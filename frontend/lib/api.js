import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send cookies (refresh token)
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.__accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let refreshing = null;
api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    
    // Handle Token Expiry
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      if (!refreshing) {
        refreshing = api.post('/auth/refresh').finally(() => { refreshing = null; });
      }
      try {
        const { data } = await refreshing;
        window.__accessToken = data.accessToken;
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    // Handle Rate Limiting (429) globally
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || error.response.data?.retryAfter;
      let msg = error.response.data?.error || 'Rate limit reached.';
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          const minutes = Math.ceil(seconds / 60);
          msg += ` Please wait ${minutes > 1 ? `${minutes} minutes` : `${seconds} seconds`}.`;
        }
      }
      // Import toast dynamically or use a custom event if toast isn't available in this context
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error(msg, { duration: 5000, id: 'rate-limit-toast' });
      });
      // Mutate the error so the caller can still read the original response but gets a cleaner message
      error.message = msg;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
