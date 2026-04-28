/**
 * AI Prover Agent - Audit Logger
 *
 * 監査ログ（全判断を記録）
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * カスタムログフォーマット（コンソール用）
 */
const consoleFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
  let msg = `${ts} [${level}] ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += '\n  ' + JSON.stringify(metadata, null, 2).split('\n').join('\n  ');
  }

  return msg;
});

/**
 * ロガーを作成
 */
export function createLogger(logFile?: string): winston.Logger {
  const transports: winston.transport[] = [
    // コンソール出力
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ];

  // ファイル出力（指定された場合）
  if (logFile) {
    const logDir = path.dirname(logFile);

    // 一般ログ
    transports.push(
      new winston.transports.File({
        filename: logFile,
        level: 'info',
        format: combine(timestamp(), json()),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      })
    );

    // 監査ログ（別ファイル）
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'audit.log'),
        level: 'info',
        format: combine(timestamp(), json()),
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 30, // 90日分保持
      })
    );

    // エラーログ（別ファイル）
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: combine(timestamp(), json()),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports,
    // 未処理の例外とリジェクションもキャッチ
    exceptionHandlers: logFile
      ? [
          new winston.transports.File({
            filename: path.join(path.dirname(logFile), 'exceptions.log'),
          }),
        ]
      : [],
    rejectionHandlers: logFile
      ? [
          new winston.transports.File({
            filename: path.join(path.dirname(logFile), 'rejections.log'),
          }),
        ]
      : [],
  });
}

/**
 * 監査ログエントリのインターフェース
 */
export interface AuditLogEntry {
  timestamp: string;
  action: 'ESCALATE' | 'REJECT' | 'ERROR';
  queue_id: string;
  lock_id: string;
  amount: string;
  confidence: number;
  reason: string;
  anomalies?: string[];
  signature_hash?: string;
  prover_id: string;
  agent_version: string;
}

/**
 * 監査ログを記録
 */
export function logAuditEntry(logger: winston.Logger, entry: Omit<AuditLogEntry, 'timestamp' | 'agent_version'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    agent_version: process.env.AGENT_VERSION || '0.1.0',
  };

  // 監査ログとして記録（別ファイルに保存される）
  logger.info('AUDIT_LOG', fullEntry);
}
