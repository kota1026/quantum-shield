//! Document repository for prover document metadata CRUD
//!
//! Stores metadata in PostgreSQL, actual files in MinIO/S3.

use sqlx::PgPool;
use uuid::Uuid;

/// Row from the prover_documents table
#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct DocumentRow {
    pub doc_id: Uuid,
    pub prover_id: String,
    pub file_name: String,
    pub content_type: String,
    pub file_size: i64,
    pub s3_key: String,
    pub uploaded_at: chrono::DateTime<chrono::Utc>,
}

/// Insert a new document metadata record
pub async fn insert_document(
    pool: &PgPool,
    prover_id: &str,
    file_name: &str,
    content_type: &str,
    file_size: i64,
    s3_key: &str,
) -> Result<DocumentRow, sqlx::Error> {
    tracing::info!(
        prover_id = %prover_id,
        file_name = %file_name,
        file_size = file_size,
        "Inserting document metadata"
    );

    let row = sqlx::query_as::<_, DocumentRow>(
        r#"
        INSERT INTO prover_documents (prover_id, file_name, content_type, file_size, s3_key)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING doc_id, prover_id, file_name, content_type, file_size, s3_key, uploaded_at
        "#,
    )
    .bind(prover_id)
    .bind(file_name)
    .bind(content_type)
    .bind(file_size)
    .bind(s3_key)
    .fetch_one(pool)
    .await?;

    tracing::info!(doc_id = %row.doc_id, "Document metadata inserted");
    Ok(row)
}

/// Get all documents for a prover
pub async fn get_documents_by_prover(
    pool: &PgPool,
    prover_id: &str,
) -> Result<Vec<DocumentRow>, sqlx::Error> {
    tracing::info!(prover_id = %prover_id, "Fetching documents for prover");

    let rows = sqlx::query_as::<_, DocumentRow>(
        r#"
        SELECT doc_id, prover_id, file_name, content_type, file_size, s3_key, uploaded_at
        FROM prover_documents
        WHERE prover_id = $1
        ORDER BY uploaded_at ASC
        "#,
    )
    .bind(prover_id)
    .fetch_all(pool)
    .await?;

    tracing::info!(prover_id = %prover_id, count = rows.len(), "Documents fetched");
    Ok(rows)
}

/// Get a single document by ID
pub async fn get_document_by_id(
    pool: &PgPool,
    doc_id: Uuid,
) -> Result<Option<DocumentRow>, sqlx::Error> {
    tracing::info!(doc_id = %doc_id, "Fetching document by ID");

    let row = sqlx::query_as::<_, DocumentRow>(
        r#"
        SELECT doc_id, prover_id, file_name, content_type, file_size, s3_key, uploaded_at
        FROM prover_documents
        WHERE doc_id = $1
        "#,
    )
    .bind(doc_id)
    .fetch_optional(pool)
    .await?;

    Ok(row)
}
