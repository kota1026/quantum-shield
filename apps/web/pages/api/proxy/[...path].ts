import type { NextApiRequest, NextApiResponse } from 'next';

const API_SERVER = process.env.API_SERVER_URL || 'http://localhost:8080';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { path } = req.query;
  const backendPath = Array.isArray(path) ? path.join('/') : path || '';
  const queryString = req.url?.includes('?')
    ? '?' + req.url.split('?').slice(1).join('?')
    : '';
  const target = `${API_SERVER}/${backendPath}${queryString}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key === 'host' || key === 'connection') continue;
    if (typeof value === 'string') headers[key] = value;
  }

  try {
    const response = await fetch(target, {
      method: req.method || 'GET',
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined,
    });

    // Forward response headers
    response.headers.forEach((value, key) => {
      if (key !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch {
    res.status(502).json({ error: 'Backend server unreachable' });
  }
}
