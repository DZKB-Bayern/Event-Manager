export async function fetcher(url: string, options: RequestInit = {}) {
  const headers: HeadersInit = { ...options.headers };
  
  // If body is FormData, do not set Content-Type (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    // Only set JSON content type if it's not already set and not FormData
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else {
    // If it is FormData, ensure Content-Type is NOT set manually
    // (It might be passed as empty object from Dashboard, which is fine, but we must ensure we don't add application/json)
    // Actually, if we pass headers: {}, it overrides the default.
    // But let's be safe.
    delete headers['Content-Type'];
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || res.statusText);
  }

  return res.json();
}
