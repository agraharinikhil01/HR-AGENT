const TOKEN_KEY = 'hireflow_auth_token';

let _token: string | null = null;
try {
  _token = localStorage.getItem(TOKEN_KEY);
} catch {
  _token = null;
}

export const tokenStore = {
  get: () => _token,
  set: (t: string) => {
    _token = t;
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {}
  },
  clear: () => {
    _token = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};
