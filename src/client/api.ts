let csrfTokenCache: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfTokenCache = token;
}

export function getCsrfToken(): string | null {
  if (csrfTokenCache) return csrfTokenCache;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    csrfTokenCache = decodeURIComponent(match[1]);
  }
  return csrfTokenCache;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const csrf = getCsrfToken();
  if (csrf && !['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET')) {
    headers.set('x-csrf-token', csrf);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (data && data.csrfToken) {
    setCsrfToken(data.csrfToken);
  }

  if (!response.ok) {
    const errorMsg = data?.message || (typeof data === 'string' ? data : 'API request failed');
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}
