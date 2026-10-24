/**
 * Centralized API client with automatic token refresh and credential support
 */

export const API_BASE_URL = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'https://social-media-app-klec.onrender.com'
).replace(/\/$/, '');

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
};

export const getFullApiUrl = (endpoint) => {
    if (!endpoint) return API_BASE_URL;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${cleanEndpoint}`;
};

export const apiFetch = async (url, options = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const config = {
        ...options,
        headers: defaultHeaders,
        credentials: 'include' // Always pass HTTP-only cookies
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const targetUrl = getFullApiUrl(url);

    let response = await fetch(targetUrl, config);

    // If unauthorized and not already refreshing or attempting login/signup
    const isAuthRoute =
        targetUrl.includes('/login') ||
        targetUrl.includes('/signup') ||
        targetUrl.includes('/refresh-token');

    if (response.status === 401 && !isAuthRoute) {
        if (!isRefreshing) {
            isRefreshing = true;

            try {
                const refreshRes = await fetch(getFullApiUrl('/api/users/refresh-token'), {
                    method: 'POST',
                    credentials: 'include'
                });

                if (refreshRes.ok) {
                    isRefreshing = false;
                    onRefreshed();
                    // Retry original request
                    return await fetch(targetUrl, config);
                } else {
                    isRefreshing = false;
                    refreshSubscribers = [];
                    // Refresh token is expired or invalid
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                        window.location.href = '/login';
                    }
                    return response;
                }
            } catch {
                isRefreshing = false;
                refreshSubscribers = [];
                return response;
            }
        }

        // Wait for token refresh to complete then retry
        return new Promise((resolve) => {
            subscribeTokenRefresh(async () => {
                resolve(await fetch(targetUrl, config));
            });
        });
    }

    return response;
};
