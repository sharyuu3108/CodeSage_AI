/**
 * Centralized API client for CodeSage AI
 * Enforces credentials: 'include' for secure HTTP-only cookie authentication
 */

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(endpoint, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Sends HTTP-only auth cookies
    ...options,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(endpoint, config);
  } catch (err) {
    throw new ApiError(
      'Network error. Please check your connection or ensure the server is running.',
      'NETWORK_ERROR',
      0
    );
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorPayload = data?.error || {};
    throw new ApiError(
      errorPayload.message || `Request failed with status ${response.status}`,
      errorPayload.code || 'REQUEST_FAILED',
      response.status,
      errorPayload
    );
  }

  return data;
}

export const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, body, options) => request(url, { ...options, method: 'DELETE', body }),
};
