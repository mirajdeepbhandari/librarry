// authService.js

import { storeToken } from './sessionStorage.js';

/**
 * Attempts to log in the user and stores the token & role on success
 * @param {string} email
 * @param {string} password
 * @returns {string|null} role or null on failure
 */
export async function login(email, password) {
  try {
    const res = await fetch("http://localhost:5085/api/Auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    const token = data.token;
    storeToken(token); // now also stores userRole internally

    // Decode JWT locally just to return role if needed
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role;

    return role;
  } catch (err) {
    console.error("Login error:", err.message);
    return null;
  }
}
