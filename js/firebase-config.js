// =========================================================================
// js/firebase.config.js - KONFIGURASI FIREBASE
// PENTING: JANGAN IMPORT DARI URL DI SINI! (Ini akan menyebabkan ralat CORS)
// =========================================================================

// Konfigurasi Firebase anda
const firebaseConfig = {
    apiKey: "AIzaSyD834R5Au1ksM0h-G0imluipJIN1br2g2g",
    authDomain: "panitia-5be3a.firebaseapp.com",
    projectId: "panitia-5be3a",
    storageBucket: "panitia-5be3a.firebasestorage.app",
    messagingSenderId: "814796521590",
    appId: "1:814796521590:web:c0e31fa985401bcc571f57"
};

// Inisialisasi Firebase menggunakan objek global 'firebase'
// Objek 'firebase' ini disediakan oleh tag <script> dalam index.html
if (typeof firebase === 'undefined') {
    console.error("Firebase SDK tidak dimuatkan! Sila semak tag <script> dalam index.html.");
}

const app = firebase.initializeApp(firebaseConfig);

// Dapatkan rujukan ke perkhidmatan yang diperlukan menggunakan kaedah v8
const db = app.firestore();
const storage = app.storage();
const auth = app.auth();

// Eksport rujukan ini supaya ia boleh digunakan dalam app.js
export { db, storage, auth };
