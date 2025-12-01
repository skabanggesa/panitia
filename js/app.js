[file name]: app.js
[file content begin]
// =========================================================================
// js/app.js - LOGIK UTAMA SISTEM PENGURUSAN PANITIA
// =========================================================================

// Import rujukan dari firebase.config.js
import { db, auth, storage, isFirebaseReady } from "./firebase.config.js";

// ... (kod sebelumnya tetap sama)

/**
 * Fungsi untuk menunggu Firebase siap
 */
const waitForFirebase = () => {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (isFirebaseReady()) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
};

/**
 * Periksa Status Pengguna & Muatkan UI yang betul
 */
if (loginSection) { // Hanya jalankan pada index.html
    waitForFirebase().then(() => {
        // V8 Syntax: auth.onAuthStateChanged()
        auth.onAuthStateChanged((user) => { 
            if (user) {
                loginSection.style.display = 'none';
                panitiaSelectionSection.style.display = 'block';
                loadPanitiaList();
            } else {
                loginSection.style.display = 'block';
                panitiaSelectionSection.style.display = 'none';
            }
        });
    }).catch(error => {
        console.error("Gagal memuatkan Firebase:", error);
        authErrorMessage.textContent = 'Sistem sedang dalam penyelenggaraan. Sila cuba sebentar lagi.';
    });
}

// =========================================================================
// C. PANGGILAN INISIALISASI
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Jalankan logik panitia-view.html jika kita berada di halaman tersebut
    if (window.location.pathname.includes('panitia-view.html')) {
        waitForFirebase().then(() => {
            // V8 Syntax: auth.onAuthStateChanged()
            auth.onAuthStateChanged((user) => { 
                if (user) {
                    initPanitiaView();
                } else {
                    alert("Sesi log masuk telah tamat.");
                    window.location.href = '../index.html';
                }
            });
        }).catch(error => {
            console.error("Gagal memuatkan Firebase di panitia-view:", error);
            alert("Ralat sistem. Sila muat semula halaman.");
        });
    } 
});
[file content end]
