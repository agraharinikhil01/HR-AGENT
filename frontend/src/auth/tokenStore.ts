// In-memory token store — NEVER in localStorage or sessionStorage per Security Blueprint
let _token: string | null = null;

export const tokenStore = {
  get: () => _token,
  set: (t: string) => {
    _token = t;
  },
  clear: () => {
    _token = null;
  },
};
