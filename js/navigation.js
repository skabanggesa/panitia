// js/navigation.js

// Pemboleh Ubah Global untuk menyimpan Panitia dan Tab yang sedang aktif
let currentPanitiaId = ''; 
let currentTab = 'pengurusan'; 
const tabTitles = {
    'pengurusan': '1. Fail Induk (Pengurusan)',
    'kurikulum': '2. Fail Sukatan/Kurikulum',
    'mesyuarat': '3. Fail Mesyuarat',
    'program': '4. Fail Program Kecemerlangan',
    'pentaksiran': '5. Fail Peperiksaan/Pentaksiran',
    'pencerapan': '6. Fail Penyeliaan/Pencerapan',
    'semakan_buku': '7. Fail Semakan Buku Latihan'
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Logik Pendaftaran Event Listener
    
    // Untuk index.html
    if (document.getElementById('panitia-selection')) {
        // Event listener untuk butang pemilihan panitia
        document.querySelectorAll('.panitia-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const panitiaId = e.currentTarget.dataset.panitia;
                if (panitiaId) {
                    // Redirect ke dashboard dengan ID panitia sebagai parameter URL
                    window.location.href = `panitia-dashboard.html?id=${panitiaId}`;
                }
            });
        });
    }

    // Untuk panitia-dashboard.html
    if (document.getElementById('content-display')) {
        // Baca ID Panitia dari URL
        const urlParams = new URLSearchParams(window.location.search);
        currentPanitiaId = urlParams.get('id');
        
        if (currentPanitiaId) {
            // Kemas kini nama panitia di header
            const headerName = formatPanitiaName(currentPanitiaId);
            document.getElementById('panitia-header-name').textContent = headerName;
            document.getElementById('dashboard-title').textContent = `${headerName} Dashboard`;
            
            // Muatkan kandungan tab lalai (Pengurusan)
            loadContent(currentPanitiaId, currentTab);
        }

        // Event listener untuk 7 Tab Navigasi
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Buang kelas 'active' dari semua tab
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                
                // Tambah kelas 'active' pada tab yang baru diklik
                e.currentTarget.classList.add('active');
                
                // Kemas kini tab yang aktif
                currentTab = e.currentTarget.dataset.tab;
                
                // Kemas kini tajuk tab
                document.getElementById('current-tab-title').textContent = tabTitles[currentTab];
                
                // Muatkan data untuk tab yang baru dipilih
                loadContent(currentPanitiaId, currentTab);
            });
        });

        // Event listener untuk butang Tambah Dokumen
        document.getElementById('add-item-btn').addEventListener('click', () => {
            openModal();
        });

        // Event listener untuk borang (submit) di modal
        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            // Panggil fungsi CRUD untuk menyimpan data
            addItem(); 
        });
    }
    
    // Panggil fungsi semak status log masuk apabila laman dimuatkan
    checkLoginStatus(); 
});

// 2. Fungsi Logik Pengesahan (Authentication)

// Semak status log masuk Firebase secara real-time
function checkLoginStatus() {
    auth.onAuthStateChanged(user => {
        const loginSection = document.getElementById('login-section');
        const panitiaSelection = document.getElementById('panitia-selection');
        const authButton = document.getElementById('auth-button');
        const userDisplay = document.getElementById('user-display');
        
        if (user) {
            // Jika pengguna log masuk
            if (loginSection && panitiaSelection) {
                loginSection.classList.add('hidden');
                panitiaSelection.classList.remove('hidden');
                authButton.textContent = 'Log Keluar';
                authButton.onclick = logoutUser;
                userDisplay.textContent = `Hai, ${user.email}`;
            }
        } else {
            // Jika pengguna log keluar
            if (loginSection && panitiaSelection) {
                loginSection.classList.remove('hidden');
                panitiaSelection.classList.add('hidden');
                authButton.textContent = 'Log Masuk';
                authButton.onclick = () => window.location.reload(); // Refresh untuk kembali ke borang
                userDisplay.textContent = 'Sila Log Masuk';
            }
        }
    });
}

// Log masuk pengguna
function loginUser() {
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const errorMessage = document.getElementById('auth-error');

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            errorMessage.textContent = 'Log masuk berjaya!';
            errorMessage.style.color = 'green';
        })
        .catch(error => {
            errorMessage.textContent = `Ralat Log Masuk: ${error.message}`;
            errorMessage.style.color = 'var(--error-color)';
            console.error(error);
        });
}

// Log keluar pengguna
function logoutUser() {
    auth.signOut()
        .then(() => {
            // Jika di dashboard, kembali ke index.html
            if (window.location.pathname.includes('panitia-dashboard.html')) {
                window.location.href = 'index.html';
            }
            // Jika di index.html, checkLoginStatus akan mengendalikan UI
        })
        .catch(error => {
            console.error("Ralat Log Keluar:", error);
        });
}

// 3. Fungsi Logik Antara Muka (UI)

// Membuka modal (popup) untuk tambah/edit item
function openModal(docId = null, title = '', fileUrl = '') {
    document.getElementById('item-modal').classList.remove('hidden');
    // Logik untuk edit: Isi borang jika docId ada
    // ... (boleh ditambah kemudian)
}

// Menutup modal (popup)
function closeModal() {
    document.getElementById('item-modal').classList.add('hidden');
    document.getElementById('item-form').reset();
}

// Format ID panitia (cth: bahasa_melayu) kepada nama penuh (cth: Panitia Bahasa Melayu)
function formatPanitiaName(id) {
    const name = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return `Panitia ${name}`;
}