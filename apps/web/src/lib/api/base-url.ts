/**
 * Resolve the API base URL.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL env var (explicit override)
 * 2. Codespaces auto-detection (replace port in hostname)
 * 3. localhost:8080 fallback (local dev)
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // GitHub Codespaces: laughing-garbanzo-xxx-3000.app.github.dev
    // Replace port segment to point to API server on port 8080
    if (host.endsWith('.app.github.dev')) {
      const apiHost = host.replace(/-\d+\.app\.github\.dev$/, '-8080.app.github.dev');
      return `https://${apiHost}`;
    }
  }

  return 'http://localhost:8080';
}
