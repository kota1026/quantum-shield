'use client';

/**
 * Global Error Page
 * Catches errors in the root layout.
 * Must include its own <html> and <body> tags since it replaces the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#0A0A0C',
          color: '#F8F8FA',
          fontFamily:
            "'Plus Jakarta Sans', 'Noto Sans JP', system-ui, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '28rem',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, #BC002D 0%, #990025 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(188, 0, 45, 0.3)',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F8F8FA"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              letterSpacing: '0.02em',
            }}
          >
            System Error
          </h1>
          <p
            style={{
              color: '#9898A0',
              fontSize: '0.875rem',
              lineHeight: 1.75,
              marginBottom: '2rem',
            }}
          >
            The system is experiencing a temporary issue. Please try again
            later.
          </p>
          {error.digest && (
            <p
              style={{
                color: '#606068',
                fontSize: '0.75rem',
                fontFamily: "'DM Mono', monospace",
                marginBottom: '1.5rem',
              }}
            >
              {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.625rem',
              background:
                'linear-gradient(135deg, #BC002D 0%, #990025 100%)',
              color: '#FFFFFF',
              fontWeight: 500,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'all 250ms ease',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
