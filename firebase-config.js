// js/firebase-config.js

// 1. Objek Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyD834R5Au1ksM0h-G0imluipJIN1br2g2g",
    authDomain: "panitia-5be3a.firebaseapp.com",
    projectId: "panitia-5be3a",
    storageBucket: "panitia-5be3a.firebasestorage.app",
    messagingSenderId: "814796521590",
    appId: "1:814796521590:web:c0e31fa985401bcc571f57"
};

// 2. Initialize Firebase (Memulakan Aplikasi)
// Menggunakan sintaks kompatibiliti (compat)
const app = firebase.initializeApp(firebaseConfig);

// 3. Mendapatkan Rujukan kepada Perkhidmatan yang Digunakan

// Authentication (Auth)
const auth = app.auth(); 

// Firestore Database (db)
const db = app.firestore(); 

// Storage (Penyelesaian Ralat: Menggunakan firebase.storage() untuk sintaks compat)
const storage = firebase.storage(); 

console.log("Firebase telah diinisialisasi.");