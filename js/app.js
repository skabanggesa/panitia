// =========================================================================
// js/app.js - LOGIK UTAMA SISTEM PENGURUSAN PANITIA
// =========================================================================

// Import rujukan dari firebase.config.js
import { db, auth, storage } from "./firebase.config.js";

// Pembolehubah Global
let currentPanitiaId = null;
let currentCategory = null;

// Rujukan Elemen UI (untuk index.html)
const loginForm = document.getElementById('login-form');
const authErrorMessage = document.getElementById('auth-error-message');
const loginSection = document.getElementById('login-section');
const panitiaSelectionSection = document.getElementById('panitia-selection');
const panitiaDropdown = document.getElementById('panitia-dropdown');
const accessBtn = document.getElementById('access-panitia-btn');
const logoutBtn = document.getElementById('logout-btn');


// =========================================================================
// A. LOGIK AUTHENTICATION & NAVIGASI (INDEX.HTML)
// =========================================================================

/**
 * Memuatkan senarai panitia dari Firestore dan mengisi dropdown.
 */
const loadPanitiaList = async () => {
    if (!panitiaDropdown) return;
    panitiaDropdown.innerHTML = '<option value="">-- Pilih Panitia --</option>';

    try {
        // V8 Syntax: db.collection()
        const panitiaCol = db.collection('Panitia'); 
        const panitiaSnapshot = await panitiaCol.get(); 
        
        if (panitiaSnapshot.empty) {
            console.warn("Tiada panitia dijumpai dalam pangkalan data.");
            return;
        }

        panitiaSnapshot.forEach(doc => {
            const panitiaData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; 
            option.textContent = panitiaData.nama; 
            panitiaDropdown.appendChild(option);
        });

        panitiaDropdown.addEventListener('change', () => {
            accessBtn.disabled = !panitiaDropdown.value;
        });

    } catch (error) {
        console.error("Ralat memuatkan senarai panitia: ", error);
    }
};

/**
 * Kendalian Proses Login
 */
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMessage.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        // V8 Syntax: auth.signInWithEmailAndPassword()
        await auth.signInWithEmailAndPassword(email, password); 
    } catch (error) {
        console.error("Ralat Login:", error);
        authErrorMessage.textContent = 'Email atau kata laluan tidak sah.';
    }
});

/**
 * Kendalian Proses Logout
 */
logoutBtn?.addEventListener('click', async () => {
    try {
        // V8 Syntax: auth.signOut()
        await auth.signOut(); 
        localStorage.removeItem('selectedPanitiaId');
        localStorage.removeItem('selectedPanitiaName');
    } catch (error) {
        console.error("Ralat Logout:", error);
    }
});

/**
 * Kendalian Akses Papan Pemuka
 */
accessBtn?.addEventListener('click', () => {
    const selectedPanitiaId = panitiaDropdown.value;
    const selectedPanitiaName = panitiaDropdown.options[panitiaDropdown.selectedIndex].textContent;

    if (selectedPanitiaId) {
        localStorage.setItem('selectedPanitiaId', selectedPanitiaId);
        localStorage.setItem('selectedPanitiaName', selectedPanitiaName);

        window.location.href = 'pages/dashboard.html'; 
    } 
});

/**
 * Periksa Status Pengguna & Muatkan UI yang betul
 */
if (loginSection) { // Hanya jalankan pada index.html
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
}


// =========================================================================
// B. LOGIK CRUD DOKUMEN (PANITIA-VIEW.HTML)
// =========================================================================

/**
 * Fungsi pembantu untuk format tajuk kategori
 */
const formatCategoryName = (category) => {
    const nameMap = {
        'pengurusan_perancangan': 'Fail Induk (Pengurusan & Perancangan)',
        'kurikulum': 'Fail Sukatan Pelajaran / Kurikulum',
        'mesyuarat': 'Fail Mesyuarat Panitia',
        'program_kecemerlangan': 'Fail Program Kecemerlangan',
        'peperiksaan_pentaksiran': 'Fail Peperiksaan / Pentaksiran',
        'penyeliaan_pencerapan': 'Fail Penyeliaan / Pencerapan',
        'penyemakan_buku': 'Fail Penyemakan Buku Latihan Murid'
    };
    return nameMap[category] || category.toUpperCase();
};

/**
 * Fungsi Baca (Read) - Memuatkan Senarai Dokumen
 */
const loadDocuments = async () => {
    const tableBody = document.getElementById('document-table-body');
    const totalCount = document.getElementById('total-count');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5">Memuatkan data...</td></tr>';

    try {
        // V8 Syntax: db.collection().doc().collection()
        const documentsRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory);
        
        // Buat query dan order
        const q = documentsRef.orderBy('date', 'desc'); 
        const snapshot = await q.get();
        
        tableBody.innerHTML = '';
        totalCount.textContent = snapshot.size;
        let index = 1;

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">Tiada dokumen dijumpai untuk kategori ini.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const row = tableBody.insertRow();
            
            row.insertCell(0).textContent = index++;
            row.insertCell(1).textContent = data.title || 'Tiada Tajuk';
            row.insertCell(2).textContent = data.date ? new Date(data.date).toLocaleDateString('ms-MY') : '-'; 
            
            // Status Fail dan Pautan
            const fileStatusCell = row.insertCell(3);
            if (data.fileUrl) {
                fileStatusCell.innerHTML = `<a href="${data.fileUrl}" target="_blank">Lihat Fail (✔️)</a>`;
            } else {
                fileStatusCell.textContent = 'Tiada Fail (📄)';
            }
            
            // Butang Tindakan (Edit dan Padam)
            const actionsCell = row.insertCell(4);
            actionsCell.innerHTML = `
                <button class="btn action-btn edit-btn" 
                        data-id="${docId}" 
                        data-fileurl="${data.fileUrl || ''}" 
                        data-title="${data.title || ''}" 
                        data-date="${data.date || ''}">Edit</button>
                <button class="btn action-btn delete-btn" data-id="${docId}" data-fileurl="${data.fileUrl || ''}">Padam</button>
            `;
        });

    } catch (error) {
        console.error("Ralat memuatkan dokumen: ", error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color:red;">Gagal memuatkan data. Sila pastikan peraturan Firebase anda betul.</td></tr>';
    }
};

/**
 * Fungsi Tambah (Create) dan Edit (Update)
 */
const handleFormSubmission = async (e) => {
    e.preventDefault();
    const docId = document.getElementById('document-id').value;
    const title = document.getElementById('doc-title').value;
    const date = document.getElementById('doc-date').value;
    const fileInput = document.getElementById('doc-file');
    const existingFileUrl = fileInput.dataset.existingUrl || ''; 
    
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;

    try {
        let fileUrl = existingFileUrl;

        // A. Muat Naik Fail ke Storage jika ada fail baru dipilih
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const uniqueId = docId || Date.now();
            
            // V8 Syntax: storage.ref().child()
            const storagePath = `${currentPanitiaId}/${currentCategory}/${uniqueId}_${file.name}`;
            const fileRef = storage.ref().child(storagePath);
            
            await fileRef.put(file);
            fileUrl = await fileRef.getDownloadURL();

            // Jika mengedit, padam fail lama dari Storage
            if (docId && existingFileUrl) {
                try { 
                    // V8 Syntax: storage.refFromURL()
                    const oldFileRef = storage.refFromURL(existingFileUrl);
                    await oldFileRef.delete(); 
                } catch (err) { 
                    console.warn("Gagal padam fail lama (mungkin tidak wujud):", err); 
                }
            }
        }
        
        // B. Simpan atau Kemaskini Data dalam Firestore (V8 Syntax)
        const data = { title, date, fileUrl };
        const documentsRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory);
        
        if (docId) {
            // EDIT/UPDATE: update()
            await documentsRef.doc(docId).update(data);
            alert("Dokumen berjaya dikemaskini!");
        } else {
            // TAMBAH/CREATE: add()
            await documentsRef.add(data);
            alert("Dokumen berjaya ditambah!");
        }
        
        // Bersihkan borang dan muat semula senarai
        document.getElementById('document-form').reset();
        document.getElementById('crud-form-section').style.display = 'none';
        submitBtn.disabled = false;
        loadDocuments(); 

    } catch (error) {
        console.error("Ralat pemprosesan dokumen: ", error);
        alert(`Gagal menyimpan data: ${error.message}. Sila semak konsol Firebase dan pastikan anda di Pelan Blaze.`);
        submitBtn.disabled = false;
    }
};

/**
 * Fungsi Padam (Delete)
 */
const handleDelete = async (docId, fileUrl) => {
    if (!confirm("Adakah anda pasti mahu memadam dokumen ini? Tindakan ini tidak boleh diundur.")) return;

    try {
        // V8 Syntax: Padam dari Firestore
        const documentRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory).doc(docId);
        await documentRef.delete();

        // Padam dari Storage (jika ada fail, V8 Syntax)
        if (fileUrl) {
            const fileRef = storage.refFromURL(fileUrl);
            await fileRef.delete();
        }

        alert("Dokumen berjaya dipadam!");
        loadDocuments(); 

    } catch (error) {
        console.error("Ralat memadam dokumen: ", error);
        alert(`Gagal memadam dokumen: ${error.message}. Sila semak konsol Firebase.`);
    }
};

/**
 * Sediakan Event Listeners untuk interaksi UI dalam panitia-view.html
 */
const setupEventListeners = () => {
    const formSection = document.getElementById('crud-form-section');
    const documentForm = document.getElementById('document-form');
    const tableBody = document.getElementById('document-table-body');
    const addBtn = document.getElementById('add-document-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    if (!formSection || !documentForm || !tableBody || !addBtn) return;

    // Tunjukkan borang 'Tambah Baru'
    addBtn.addEventListener('click', () => {
        documentForm.reset();
        document.getElementById('document-id').value = '';
        document.getElementById('form-action').textContent = 'Tambah';
        document.getElementById('submit-btn').textContent = 'Simpan';
        document.getElementById('doc-file').dataset.existingUrl = '';
        formSection.style.display = 'block';
    });

    // Sembunyikan borang
    cancelBtn.addEventListener('click', () => {
        formSection.style.display = 'none';
    });

    // Hantar borang (Tambah/Edit)
    documentForm.addEventListener('submit', handleFormSubmission);

    // Edit/Delete Listeners (Menggunakan event delegation pada table body)
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const docId = target.dataset.id;
        const fileUrl = target.dataset.fileurl;

        if (!docId) return;

        if (target.classList.contains('delete-btn')) {
            handleDelete(docId, fileUrl);
        } else if (target.classList.contains('edit-btn')) {
            // Isi borang untuk edit
            const title = target.dataset.title;
            const date = target.dataset.date;

            document.getElementById('document-id').value = docId;
            document.getElementById('doc-title').value = title;
            document.getElementById('doc-date').value = date;
            document.getElementById('doc-file').dataset.existingUrl = fileUrl; 
            
            document.getElementById('form-action').textContent = 'Edit';
            document.getElementById('submit-btn').textContent = 'Kemaskini';
            formSection.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
};

/**
 * Inisialisasi utama untuk panitia-view.html
 */
const initPanitiaView = () => {
    currentPanitiaId = localStorage.getItem('selectedPanitiaId');
    const params = new URLSearchParams(window.location.search);
    currentCategory = params.get('category');
    const panitiaName = localStorage.getItem('selectedPanitiaName');

    if (!currentPanitiaId || !currentCategory) { 
        alert("Sesi tamat atau data panitia tidak lengkap. Sila log masuk semula.");
        window.location.href = '../index.html';
        return;
    }

    document.getElementById('panitia-name-display').textContent = panitiaName;
    document.getElementById('category-title').textContent = formatCategoryName(currentCategory);

    loadDocuments();
    setupEventListeners();
};


// =========================================================================
// C. PANGGILAN INISIALISASI
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Jalankan logik panitia-view.html jika kita berada di halaman tersebut
    if (window.location.pathname.includes('panitia-view.html')) {
        // V8 Syntax: auth.onAuthStateChanged()
        auth.onAuthStateChanged((user) => { 
            if (user) {
                initPanitiaView();
            } else {
                alert("Sesi log masuk telah tamat.");
                window.location.href = '../index.html';
            }
        });
    } 
});
