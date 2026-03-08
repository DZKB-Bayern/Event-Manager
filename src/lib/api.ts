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
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || res.statusText);
  }

  return res.json();
}

/**
 * Perform a login via Webling. This function posts the provided member
 * identifier to the `/api/webling-login` endpoint. If authentication
 * succeeds the backend will set an HTTP-only cookie containing a JWT and
 * return the authenticated user. On failure an exception is thrown.
 *
 * @param member The numeric member id from Webling.
 */
export async function loginWithWebling(member: string) {
  const res = await fetch('/api/webling-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ member_id: member }),
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Webling Login fehlgeschlagen' }));
    throw new Error(error.error || res.statusText);
  }
  return res.json();
}
