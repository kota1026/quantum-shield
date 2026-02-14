import { NextRequest, NextResponse } from 'next/server';

const API_SERVER = process.env.API_SERVER_URL || 'http://localhost:8080';

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);
  // Strip /api/proxy prefix to get the backend path
  const backendPath = url.pathname.replace(/^\/api\/proxy/, '');
  const target = `${API_SERVER}${backendPath}${url.search}`;

  const headers = new Headers(request.headers);
  // Remove host header so the backend gets the correct one
  headers.delete('host');

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    // Remove transfer-encoding to avoid issues with Next.js
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Backend server unreachable' },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
