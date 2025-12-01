// js/firebase.config.js

// Import rujukan dari objek global 'window' yang telah ditetapkan dalam index.html
export const db = window.db;
// TIDAK PERLU EKSPORT 'auth' LAGI, kita akan aksesnya secara langsung dalam app.js
export const auth = window.auth; 
export const storage = window.storage;
