// sessionStorage.js

export function storeToken(token) {
  sessionStorage.setItem('authToken', token);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role || 'member'; // Fallback to member if none found
    sessionStorage.setItem('userRole', role);
  } catch {
    sessionStorage.setItem('userRole', 'member');
  }
}

export function getToken() {
  return sessionStorage.getItem('authToken');
}

export function hasToken() {
  return !!getToken();
}

export function storeUserRole(role) {
  sessionStorage.setItem('userRole', role);
}

export function getUserRole() {
  return sessionStorage.getItem('userRole');
}

export function clearSession() {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userRole');
}

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch {
    return true;
  }
}
