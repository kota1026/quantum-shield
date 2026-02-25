//! S3-compatible object storage service (MinIO/AWS S3)
//!
//! Handles file upload, download, and deletion for prover documents.

use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_s3::{
    config::Builder as S3ConfigBuilder,
    primitives::ByteStream,
    Client as S3Client,
};
use tracing;

use crate::config::StorageConfig;

/// Allowed MIME types for document uploads
const ALLOWED_CONTENT_TYPES: &[&str] = &[
    "application/pdf",
    "image/jpeg",
    "image/png",
];

#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("File too large: {size} bytes (max: {max} bytes)")]
    FileTooLarge { size: usize, max: usize },
    #[error("Invalid file type: {content_type}. Allowed: PDF, JPEG, PNG")]
    InvalidFileType { content_type: String },
    #[error("S3 upload failed: {0}")]
    UploadFailed(String),
    #[error("S3 download failed: {0}")]
    DownloadFailed(String),
    #[error("S3 delete failed: {0}")]
    DeleteFailed(String),
    #[error("File not found: {key}")]
    NotFound { key: String },
}

pub struct StorageService {
    client: S3Client,
    bucket: String,
    max_file_size: usize,
}

impl StorageService {
    /// Create a new StorageService with S3-compatible client
    pub async fn new(config: &StorageConfig) -> Result<Self, anyhow::Error> {
        let credentials = Credentials::new(
            &config.access_key_id,
            &config.secret_access_key,
            None,
            None,
            "quantum-shield",
        );

        let s3_config = S3ConfigBuilder::new()
            .region(Region::new(config.region.clone()))
            .endpoint_url(&config.endpoint)
            .credentials_provider(credentials)
            .force_path_style(true) // Required for MinIO
            .build();

        let client = S3Client::from_conf(s3_config);

        tracing::info!(
            endpoint = %config.endpoint,
            bucket = %config.bucket,
            max_file_size = config.max_file_size,
            "Storage service initialized"
        );

        Ok(Self {
            client,
            bucket: config.bucket.clone(),
            max_file_size: config.max_file_size,
        })
    }

    /// Upload a file to S3
    ///
    /// Validates file type (PDF/JPEG/PNG) and size (max 10MB by default).
    /// Returns the S3 key on success.
    pub async fn upload(
        &self,
        key: &str,
        data: Vec<u8>,
        content_type: &str,
    ) -> Result<String, StorageError> {
        // Validate content type
        if !ALLOWED_CONTENT_TYPES.contains(&content_type) {
            return Err(StorageError::InvalidFileType {
                content_type: content_type.to_string(),
            });
        }

        // Validate file size
        if data.len() > self.max_file_size {
            return Err(StorageError::FileTooLarge {
                size: data.len(),
                max: self.max_file_size,
            });
        }

        tracing::info!(
            key = %key,
            content_type = %content_type,
            size = data.len(),
            "Uploading file to S3"
        );

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(ByteStream::from(data))
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| StorageError::UploadFailed(e.to_string()))?;

        tracing::info!(key = %key, "File uploaded successfully");
        Ok(key.to_string())
    }

    /// Download a file from S3
    ///
    /// Returns the file data and content type.
    pub async fn download(&self, key: &str) -> Result<(Vec<u8>, String), StorageError> {
        tracing::info!(key = %key, "Downloading file from S3");

        let result = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| {
                let err_str = e.to_string();
                if err_str.contains("NoSuchKey") || err_str.contains("not found") {
                    StorageError::NotFound { key: key.to_string() }
                } else {
                    StorageError::DownloadFailed(err_str)
                }
            })?;

        let content_type = result
            .content_type()
            .unwrap_or("application/octet-stream")
            .to_string();

        let data = result
            .body
            .collect()
            .await
            .map_err(|e| StorageError::DownloadFailed(e.to_string()))?
            .into_bytes()
            .to_vec();

        tracing::info!(key = %key, size = data.len(), "File downloaded successfully");
        Ok((data, content_type))
    }

    /// Delete a file from S3
    pub async fn delete(&self, key: &str) -> Result<(), StorageError> {
        tracing::info!(key = %key, "Deleting file from S3");

        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| StorageError::DeleteFailed(e.to_string()))?;

        tracing::info!(key = %key, "File deleted successfully");
        Ok(())
    }
}
