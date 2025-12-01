[file name]: firebase-config.js
[file content begin]
// js/firebase.config.js

// Mengimport rujukan dari objek global 'window' yang ditakrifkan dalam index.html
// Tambahkan pengecekan untuk memastikan objek tersedia
export const db = window.db || null;
export const auth = window.auth || null;
export const storage = window.storage || null;

// Fungsi untuk memastikan Firebase sudah siap
export const isFirebaseReady = () => {
    return window.db && window.auth && window.storage;
};
[file content end]
