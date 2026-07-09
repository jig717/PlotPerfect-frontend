// OAuth Configuration - kept for reference, but not used directly anymore
const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.GOOGLE_CLIENT_ID ,
    redirectUri: import.meta.env.GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
  },
};

/**
 * Initiates Google OAuth login flow by redirecting to backend endpoint
 * @param {Function} toast - Optional toast function for notifications
 */
export const handleGoogleLogin = (toast = null) => {
  // Backend Google OAuth endpoint – assumes your backend will handle the full OAuth flow
  const backendAuthUrl = `${import.meta.env.REACT_APP_API_URL || 'http://localhost:3400'}/auth/google`;

  if (toast) {
    toast.info('Redirecting to Google...');
  }

  // Redirect to backend – the backend will redirect to Google, then back to frontend
  window.location.href = backendAuthUrl;
};

/**
 * Handles OAuth callback - extracts authorization code from URL
 * @returns {Object|null} - Returns code and state if present, null otherwise
 */
export const parseOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (code) {
    return { code, state };
  }
  return null;
};

export default { handleGoogleLogin, parseOAuthCallback };