/**
 * Token Service
 * Encapsulates storing, retrieving, and clearing JWT tokens.
 */
export const tokenService = {
  getUserToken: () => localStorage.getItem('kd_token'),
  setUserToken: (token) => localStorage.setItem('kd_token', token),
  removeUserToken: () => localStorage.removeItem('kd_token'),
  
  getAdminToken: () => localStorage.getItem('kd_admin_token'),
  setAdminToken: (token) => localStorage.setItem('kd_admin_token', token),
  removeAdminToken: () => localStorage.removeItem('kd_admin_token'),
  
  clearAllTokens: () => {
    localStorage.removeItem('kd_token');
    localStorage.removeItem('kd_admin_token');
  }
};
