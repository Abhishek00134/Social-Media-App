/**
 * Centralized API client with automatic token refresh and credential support
 */

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
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

    let response = await fetch(url, config);

    // If unauthorized and not already refreshing or attempting login/signup
    const isAuthRoute = url.includes('/login') || url.includes('/signup') || url.includes('/refresh-token');

    if (response.status === 401 && !isAuthRoute) {
        if (!isRefreshing) {
            isRefreshing = true;

            try {
                const refreshRes = await fetch('/api/users/refresh-token', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (refreshRes.ok) {
                    isRefreshing = false;
                    onRefreshed();
                    // Retry original request
                    return await fetch(url, config);
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
                resolve(await fetch(url, config));
            });
        });
    }

    return response;
};
