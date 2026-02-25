//! Document upload/download routes for prover application documents
//!
//! - POST /v1/documents/upload - Upload a document (multipart, prover-facing)
//! - GET /v1/documents/:prover_id - List documents for a prover
//! - GET /api/admin/documents/:doc_id/download - Download a document (admin-only)

use axum::{
    extract::Path,
    http::{header, StatusCode},
    response::IntoResponse,
    Extension, Json,
};
use axum_extra::extract::Multipart;
use serde::Serialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::db::document;
use crate::services::AppState;

/// Maximum number of documents per prover
const MAX_DOCUMENTS_PER_PROVER: usize = 5;

#[derive(Serialize)]
pub struct UploadResponse {
    success: bool,
    doc_id: String,
    file_name: String,
    file_size: i64,
}

#[derive(Serialize)]
pub struct DocumentListResponse {
    documents: Vec<DocumentInfo>,
    total: usize,
}

#[derive(Serialize)]
pub struct DocumentInfo {
    #[serde(rename = "docId")]
    doc_id: String,
    #[serde(rename = "fileName")]
    file_name: String,
    #[serde(rename = "contentType")]
    content_type: String,
    #[serde(rename = "fileSize")]
    file_size: i64,
    #[serde(rename = "uploadedAt")]
    uploaded_at: String,
}

/// POST /v1/documents/upload
///
/// Accepts multipart/form-data with:
/// - `prover_id` (text field) - the prover ID to associate the document with
/// - `file` (file field) - the document file (PDF, JPEG, or PNG, max 10MB)
pub async fn upload_document(
    Extension(state): Extension<Arc<AppState>>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let storage = state.storage.as_ref().ok_or_else(|| {
        tracing::error!("Storage service not available");
        error_response(StatusCode::SERVICE_UNAVAILABLE, "Storage service not available")
    })?;

    let mut prover_id: Option<String> = None;
    let mut file_name: Option<String> = None;
    let mut file_data: Option<Vec<u8>> = None;
    let mut content_type: Option<String> = None;

    // Parse multipart fields
    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "prover_id" => {
                let text = field.text().await.map_err(|e| {
                    error_response(StatusCode::BAD_REQUEST, &format!("Failed to read prover_id: {}", e))
                })?;
                prover_id = Some(text);
            }
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                content_type = field.content_type().map(|s| s.to_string());
                let data = field.bytes().await.map_err(|e| {
                    error_response(StatusCode::BAD_REQUEST, &format!("Failed to read file: {}", e))
                })?;
                file_data = Some(data.to_vec());
            }
            _ => {}
        }
    }

    // Validate required fields
    let prover_id = prover_id.ok_or_else(|| {
        error_response(StatusCode::BAD_REQUEST, "Missing prover_id field")
    })?;

    let file_name = file_name.ok_or_else(|| {
        error_response(StatusCode::BAD_REQUEST, "Missing file field or file name")
    })?;

    let file_data = file_data.ok_or_else(|| {
        error_response(StatusCode::BAD_REQUEST, "Missing file data")
    })?;

    // Infer content type from file extension if not provided
    let content_type = content_type.unwrap_or_else(|| {
        if file_name.ends_with(".pdf") {
            "application/pdf".to_string()
        } else if file_name.ends_with(".jpg") || file_name.ends_with(".jpeg") {
            "image/jpeg".to_string()
        } else if file_name.ends_with(".png") {
            "image/png".to_string()
        } else {
            "application/octet-stream".to_string()
        }
    });

    // Verify prover exists
    let prover_exists: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM provers WHERE prover_id = $1",
    )
    .bind(&prover_id)
    .fetch_one(state.pool())
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Failed to check prover existence");
        error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
    })?;

    if prover_exists == 0 {
        return Err(error_response(
            StatusCode::NOT_FOUND,
            &format!("Prover {} not found", prover_id),
        ));
    }

    // Check document count limit
    let existing_docs: Vec<document::DocumentRow> =
        document::get_documents_by_prover(state.pool(), &prover_id)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, "Failed to check existing documents");
                error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
            })?;

    if existing_docs.len() >= MAX_DOCUMENTS_PER_PROVER {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            &format!("Maximum {} documents per prover", MAX_DOCUMENTS_PER_PROVER),
        ));
    }

    // Generate S3 key
    let doc_uuid = Uuid::new_v4();
    let s3_key = format!("provers/{}/{}/{}", prover_id, doc_uuid, file_name);

    let file_size = file_data.len() as i64;

    // Upload to S3
    storage
        .upload(&s3_key, file_data, &content_type)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to upload file to S3");
            let msg = match &e {
                crate::services::StorageError::FileTooLarge { size, max } => {
                    format!("File too large: {} bytes (max: {} bytes)", size, max)
                }
                crate::services::StorageError::InvalidFileType { content_type } => {
                    format!("Invalid file type: {}. Allowed: PDF, JPEG, PNG", content_type)
                }
                _ => format!("Upload failed: {}", e),
            };
            error_response(StatusCode::BAD_REQUEST, &msg)
        })?;

    // Save metadata to DB
    let doc: document::DocumentRow = document::insert_document(
        state.pool(),
        &prover_id,
        &file_name,
        &content_type,
        file_size,
        &s3_key,
    )
    .await
    .map_err(|e| {
        tracing::error!(error = %e, "Failed to save document metadata");
        error_response(StatusCode::INTERNAL_SERVER_ERROR, "Failed to save document metadata")
    })?;

    tracing::info!(
        prover_id = %prover_id,
        doc_id = %doc.doc_id,
        file_name = %file_name,
        "Document uploaded successfully"
    );

    Ok((
        StatusCode::CREATED,
        Json(UploadResponse {
            success: true,
            doc_id: doc.doc_id.to_string(),
            file_name: doc.file_name,
            file_size: doc.file_size,
        }),
    ))
}

/// GET /v1/documents/:prover_id
///
/// List all documents for a prover
pub async fn list_documents(
    Extension(state): Extension<Arc<AppState>>,
    Path(prover_id): Path<String>,
) -> Result<Json<DocumentListResponse>, (StatusCode, Json<serde_json::Value>)> {
    tracing::info!(prover_id = %prover_id, "Listing documents for prover");

    let docs: Vec<document::DocumentRow> =
        document::get_documents_by_prover(state.pool(), &prover_id)
            .await
            .map_err(|e| {
                tracing::error!(error = %e, "Failed to fetch documents");
                error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
            })?;

    let total = docs.len();
    let documents: Vec<DocumentInfo> = docs
        .into_iter()
        .map(|d| DocumentInfo {
            doc_id: d.doc_id.to_string(),
            file_name: d.file_name,
            content_type: d.content_type,
            file_size: d.file_size,
            uploaded_at: d.uploaded_at.to_rfc3339(),
        })
        .collect();

    Ok(Json(DocumentListResponse { documents, total }))
}

/// GET /api/admin/documents/:doc_id/download
///
/// Download a document by ID (admin-only, protected by admin JWT middleware)
pub async fn download_document(
    Extension(state): Extension<Arc<AppState>>,
    Path(doc_id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    let storage = state.storage.as_ref().ok_or_else(|| {
        error_response(StatusCode::SERVICE_UNAVAILABLE, "Storage service not available")
    })?;

    let doc_uuid = Uuid::parse_str(&doc_id).map_err(|_| {
        error_response(StatusCode::BAD_REQUEST, "Invalid document ID")
    })?;

    // Get document metadata from DB
    let doc: document::DocumentRow = document::get_document_by_id(state.pool(), doc_uuid)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to fetch document metadata");
            error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?
        .ok_or_else(|| {
            error_response(StatusCode::NOT_FOUND, "Document not found")
        })?;

    // Download from S3
    let (data, content_type) = storage.download(&doc.s3_key).await.map_err(|e| {
        tracing::error!(error = %e, "Failed to download file from S3");
        error_response(StatusCode::INTERNAL_SERVER_ERROR, &format!("Download failed: {}", e))
    })?;

    tracing::info!(
        doc_id = %doc_id,
        file_name = %doc.file_name,
        size = data.len(),
        "Document downloaded for admin review"
    );

    // Return file with proper headers
    let disposition = format!("attachment; filename=\"{}\"", doc.file_name);
    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, content_type),
            (header::CONTENT_DISPOSITION, disposition),
        ],
        data,
    ))
}

/// Helper to create error response tuple
fn error_response(status: StatusCode, msg: &str) -> (StatusCode, Json<serde_json::Value>) {
    (status, Json(serde_json::json!({ "error": msg })))
}
