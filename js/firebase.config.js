// js/firebase.config.js

// Import rujukan dari objek global 'window' yang telah ditetapkan dalam index.html
// File ini kini berfungsi sebagai jambatan eksport untuk modul lokal lain.

// Pastikan window.db, window.auth, dan window.storage wujud dari index.html
export const db = window.db;
export const auth = window.auth;
export const storage = window.storage;
