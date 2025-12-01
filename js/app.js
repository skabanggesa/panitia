[file name]: app.js
[file content begin]
// =========================================================================
// js/app.js - LOGIK UTAMA SISTEM PENGURUSAN PANITIA
// Menggunakan API Firebase V8 pada objek yang diimport (db, auth, storage)
// =========================================================================

// Import rujukan dari firebase.config.js
import { db, auth, storage, isFirebaseReady } from "./firebase.config.js";

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
// FUNGSI BANTUAN UMUM
// =========================================================================

/**
 * Fungsi untuk menunggu Firebase siap
 */
const waitForFirebase = () => {
    return new Promise((resolve, reject) => {
        if (isFirebaseReady()) {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50; // 5 saat maksimum (100ms × 50)
        
        const checkInterval = setInterval(() => {
            attempts++;
            if (isFirebaseReady()) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error("Firebase gagal dimuat dalam masa yang ditetapkan"));
            }
        }, 100);
    });
};

/**
 * Format tarikh untuk display
 */
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ms-MY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

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
        const panitiaCol = db.collection('Panitia'); 
        const panitiaSnapshot = await panitiaCol.get(); 
        
        if (panitiaSnapshot.empty) {
            console.warn("Tiada panitia dijumpai dalam pangkalan data.");
            panitiaDropdown.innerHTML = '<option value="">-- Tiada Panitia Dijumpai --</option>';
            return;
        }

        panitiaSnapshot.forEach(doc => {
            const panitiaData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; 
            option.textContent = panitiaData.nama || `Panitia ${doc.id}`; 
            panitiaDropdown.appendChild(option);
        });

        panitiaDropdown.addEventListener('change', () => {
            accessBtn.disabled = !panitiaDropdown.value;
        });

    } catch (error) {
        console.error("Ralat memuatkan senarai panitia: ", error);
        panitiaDropdown.innerHTML = '<option value="">-- Ralat Memuat Data --</option>';
    }
};

/**
 * Kendalian Proses Login
 */
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMessage.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        authErrorMessage.textContent = 'Sila isi kedua-dua bidang.';
        return;
    }

    try {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sedang Log Masuk...';
        
        await auth.signInWithEmailAndPassword(email, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log Masuk';
    } catch (error) {
        console.error("Ralat Login:", error);
        
        let errorMessage = 'Email atau kata laluan tidak sah.';
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'Format email tidak sah.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Akaun ini telah dinyahaktifkan.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Akaun tidak dijumpai.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Kata laluan tidak tepat.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Ralat rangkaian. Sila periksa sambungan internet.';
        }
        
        authErrorMessage.textContent = errorMessage;
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log Masuk';
    }
});

/**
 * Kendalian Proses Logout
 */
logoutBtn?.addEventListener('click', async () => {
    try {
        if (confirm("Adakah anda pasti mahu log keluar?")) {
            logoutBtn.disabled = true;
            logoutBtn.textContent = 'Sedang Log Keluar...';
            
            await auth.signOut();
            
            localStorage.removeItem('selectedPanitiaId');
            localStorage.removeItem('selectedPanitiaName');
            localStorage.removeItem('userEmail');
            
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Ralat Logout:", error);
        alert("Ralat semasa log keluar. Sila cuba lagi.");
        logoutBtn.disabled = false;
        logoutBtn.textContent = 'Log Keluar';
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
        
        // Simpan email pengguna untuk display
        if (auth.currentUser) {
            localStorage.setItem('userEmail', auth.currentUser.email);
        }

        window.location.href = 'pages/dashboard.html'; 
    } 
});

// =========================================================================
// B. LOGIK DASHBOARD (DASHBOARD.HTML)
// =========================================================================

/**
 * Inisialisasi Dashboard
 */
const initDashboard = () => {
    const panitiaName = localStorage.getItem('selectedPanitiaName');
    const panitiaId = localStorage.getItem('selectedPanitiaId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (!panitiaId) {
        alert("Sila pilih panitia terlebih dahulu.");
        window.location.href = '../index.html';
        return;
    }
    
    // Tampilkan maklumat pengguna dan panitia
    const panitiaNameDisplay = document.getElementById('dashboard-panitia-name');
    const userEmailDisplay = document.getElementById('user-email-display');
    
    if (panitiaNameDisplay) panitiaNameDisplay.textContent = panitiaName;
    if (userEmailDisplay) userEmailDisplay.textContent = userEmail || 'Pengguna';
    
    // Setup event listeners untuk dashboard
    setupDashboardEventListeners();
    
    // Load statistik dashboard
    loadDashboardStats(panitiaId);
    
    // Setup link kategori
    setupCategoryLinks();
};

/**
 * Setup event listeners untuk dashboard
 */
const setupDashboardEventListeners = () => {
    // Logout button
    const dashboardLogoutBtn = document.getElementById('dashboard-logout-btn');
    if (dashboardLogoutBtn) {
        dashboardLogoutBtn.addEventListener('click', async () => {
            try {
                if (confirm("Adakah anda pasti mahu log keluar?")) {
                    await auth.signOut();
                    localStorage.clear();
                    window.location.href = '../index.html';
                }
            } catch (error) {
                console.error("Ralat logout:", error);
                alert("Ralat semasa log keluar.");
            }
        });
    }
    
    // Back to selection button
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
    
    // Refresh stats button
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', () => {
            const panitiaId = localStorage.getItem('selectedPanitiaId');
            if (panitiaId) {
                loadDashboardStats(panitiaId);
                alert("Statistik dikemaskini.");
            }
        });
    }
};

/**
 * Setup link kategori di dashboard
 */
const setupCategoryLinks = () => {
    const categories = [
        { 
            id: 'pengurusan_perancangan', 
            name: 'Fail Induk (Pengurusan & Perancangan)',
            icon: '📋',
            description: 'Dokumen perancangan dan pengurusan panitia'
        },
        { 
            id: 'kurikulum', 
            name: 'Fail Sukatan Pelajaran / Kurikulum',
            icon: '📚',
            description: 'Dokumen kurikulum dan sukatan pelajaran'
        },
        { 
            id: 'mesyuarat', 
            name: 'Fail Mesyuarat Panitia',
            icon: '👥',
            description: 'Minit mesyuarat dan laporan mesyuarat'
        },
        { 
            id: 'program_kecemerlangan', 
            name: 'Fail Program Kecemerlangan',
            icon: '🏆',
            description: 'Program peningkatan prestasi akademik'
        },
        { 
            id: 'peperiksaan_pentaksiran', 
            name: 'Fail Peperiksaan / Pentaksiran',
            icon: '📝',
            description: 'Soalan peperiksaan dan analisis keputusan'
        },
        { 
            id: 'penyeliaan_pencerapan', 
            name: 'Fail Penyeliaan / Pencerapan',
            icon: '👁️',
            description: 'Laporan pencerapan dan penyeliaan'
        },
        { 
            id: 'penyemakan_buku', 
            name: 'Fail Penyemakan Buku Latihan Murid',
            icon: '📓',
            description: 'Rekod semakan buku latihan murid'
        }
    ];
    
    const container = document.getElementById('category-links');
    if (!container) return;
    
    container.innerHTML = '';
    
    categories.forEach(category => {
        const link = document.createElement('a');
        link.href = `panitia-view.html?category=${category.id}`;
        link.className = 'category-link';
        link.innerHTML = `
            <div class="category-card">
                <div class="category-icon">${category.icon}</div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                    <span class="category-link-text">Klik untuk urus dokumen →</span>
                </div>
            </div>
        `;
        container.appendChild(link);
    });
};

/**
 * Load statistik dashboard
 */
const loadDashboardStats = async (panitiaId) => {
    try {
        const statsContainer = document.getElementById('dashboard-stats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = '<div class="loading-stats">Memuatkan statistik...</div>';
        
        const categories = [
            'pengurusan_perancangan', 'kurikulum', 'mesyuarat', 
            'program_kecemerlangan', 'peperiksaan_pentaksiran', 
            'penyeliaan_pencerapan', 'penyemakan_buku'
        ];
        
        let totalDocs = 0;
        let statsByCategory = [];
        
        for (const category of categories) {
            const snapshot = await db.collection('Panitia')
                .doc(panitiaId)
                .collection(category)
                .get();
            
            const count = snapshot.size;
            totalDocs += count;
            
            if (count > 0) {
                statsByCategory.push({
                    category: category,
                    count: count
                });
            }
        }
        
        // Sort by count descending
        statsByCategory.sort((a, b) => b.count - a.count);
        
        // Update stats display
        statsContainer.innerHTML = '';
        
        // Total documents card
        const totalCard = document.createElement('div');
        totalCard.className = 'stat-card total-card';
        totalCard.innerHTML = `
            <div class="stat-icon">📊</div>
            <div class="stat-info">
                <h4>Jumlah Dokumen</h4>
                <p class="stat-number">${totalDocs}</p>
                <p class="stat-desc">Jumlah keseluruhan dokumen</p>
            </div>
        `;
        statsContainer.appendChild(totalCard);
        
        // Categories with documents
        if (statsByCategory.length > 0) {
            const topCategories = statsByCategory.slice(0, 3); // Show top 3
            
            topCategories.forEach(stat => {
                const categoryName = formatCategoryName(stat.category);
                const categoryCard = document.createElement('div');
                categoryCard.className = 'stat-card category-stat';
                categoryCard.innerHTML = `
                    <div class="stat-icon">📁</div>
                    <div class="stat-info">
                        <h4>${categoryName}</h4>
                        <p class="stat-number">${stat.count}</p>
                        <p class="stat-desc">dokumen</p>
                    </div>
                `;
                statsContainer.appendChild(categoryCard);
            });
        }
        
    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        const statsContainer = document.getElementById('dashboard-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card error-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-info">
                        <h4>Ralat</h4>
                        <p class="stat-desc">Gagal memuatkan statistik</p>
                    </div>
                </div>
            `;
        }
    }
};

// =========================================================================
// C. LOGIK CRUD DOKUMEN (PANITIA-VIEW.HTML)
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
    return nameMap[category] || category.replace(/_/g, ' ').toUpperCase();
};

/**
 * Fungsi Baca (Read) - Memuatkan Senarai Dokumen
 */
const loadDocuments = async () => {
    const tableBody = document.getElementById('document-table-body');
    const totalCount = document.getElementById('total-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    const tableContainer = document.getElementById('table-container');
    
    if (!tableBody) return;
    
    // Show loading
    if (loadingIndicator) loadingIndicator.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
    
    tableBody.innerHTML = '';

    try {
        const documentsRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory);
        
        // Buat query dan order
        const q = documentsRef.orderBy('date', 'desc'); 
        const snapshot = await q.get();
        
        totalCount.textContent = snapshot.size;
        
        if (snapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">📁</div>
                            <h3>Tiada dokumen dijumpai</h3>
                            <p>Sila tambah dokumen pertama anda menggunakan butang "Tambah Dokumen Baru" di atas.</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            let index = 1;
            
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const docId = docSnap.id;
                const row = tableBody.insertRow();
                row.className = 'document-row';
                row.setAttribute('data-id', docId);
                
                row.insertCell(0).textContent = index++;
                row.insertCell(1).textContent = data.title || 'Tiada Tajuk';
                row.insertCell(2).textContent = formatDate(data.date);
                
                // Status Fail dan Pautan
                const fileStatusCell = row.insertCell(3);
                fileStatusCell.className = 'file-status-cell';
                if (data.fileUrl) {
                    const fileName = data.fileUrl.split('/').pop().split('?')[0];
                    const truncatedName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
                    fileStatusCell.innerHTML = `
                        <div class="file-status">
                            <span class="file-icon">📎</span>
                            <a href="${data.fileUrl}" target="_blank" class="file-link" title="${fileName}">
                                ${truncatedName}
                            </a>
                            <span class="file-status-badge">Ada Fail</span>
                        </div>
                    `;
                } else {
                    fileStatusCell.innerHTML = `
                        <div class="file-status">
                            <span class="file-icon">📄</span>
                            <span class="no-file">Tiada Fail</span>
                        </div>
                    `;
                }
                
                // Butang Tindakan (Edit dan Padam)
                const actionsCell = row.insertCell(4);
                actionsCell.className = 'actions-cell';
                actionsCell.innerHTML = `
                    <button class="btn action-btn edit-btn" 
                            data-id="${docId}" 
                            data-fileurl="${data.fileUrl || ''}" 
                            data-title="${data.title || ''}" 
                            data-date="${data.date || ''}"
                            title="Edit dokumen">
                        <span class="btn-icon">✏️</span> Edit
                    </button>
                    <button class="btn action-btn delete-btn" 
                            data-id="${docId}" 
                            data-fileurl="${data.fileUrl || ''}"
                            title="Padam dokumen">
                        <span class="btn-icon">🗑️</span> Padam
                    </button>
                `;
            });
        }

    } catch (error) {
        console.error("Ralat memuatkan dokumen: ", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-state">
                    <div style="text-align: center; padding: 20px; color: #dc3545;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h3>Gagal memuatkan data</h3>
                        <p>Sila pastikan peraturan Firebase anda betul.</p>
                        <p><small>${error.message}</small></p>
                    </div>
                </td>
            </tr>
        `;
    } finally {
        // Hide loading
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }
};

/**
 * Fungsi Tambah (Create) dan Edit (Update)
 */
const handleFormSubmission = async (e) => {
    e.preventDefault();
    const docId = document.getElementById('document-id').value;
    const title = document.getElementById('doc-title').value.trim();
    const date = document.getElementById('doc-date').value;
    const fileInput = document.getElementById('doc-file');
    const existingFileUrl = fileInput.dataset.existingUrl || ''; 
    
    // Validation
    if (!title) {
        alert('Sila masukkan tajuk dokumen.');
        return;
    }
    
    if (!date) {
        alert('Sila pilih tarikh.');
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Menyimpan...';

    try {
        let fileUrl = existingFileUrl;

        // A. Muat Naik Fail ke Storage jika ada fail baru dipilih
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                alert('Saiz fail terlalu besar. Maksimum 10MB.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Validate file type
            const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(fileExtension)) {
                alert(`Jenis fail tidak dibenarkan. Hanya fail berikut dibenarkan: ${allowedTypes.join(', ')}`);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            const uniqueId = docId || Date.now();
            const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${currentPanitiaId}/${currentCategory}/${uniqueId}_${fileName}`;
            const fileRef = storage.ref().child(storagePath);
            
            // Show upload progress
            const progressBar = document.getElementById('upload-progress');
            if (progressBar) {
                progressBar.style.display = 'block';
                const uploadTask = fileRef.put(file);
                
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressBar.value = progress;
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        progressBar.style.display = 'none';
                        throw error;
                    },
                    async () => {
                        fileUrl = await fileRef.getDownloadURL();
                        progressBar.style.display = 'none';
                    }
                );
                await uploadTask;
            } else {
                await fileRef.put(file);
                fileUrl = await fileRef.getDownloadURL();
            }

            // Jika mengedit, padam fail lama dari Storage
            if (docId && existingFileUrl) {
                try { 
                    const oldFileRef = storage.refFromURL(existingFileUrl);
                    await oldFileRef.delete(); 
                } catch (err) { 
                    console.warn("Gagal padam fail lama:", err); 
                }
            }
        }
        
        // B. Simpan atau Kemaskini Data dalam Firestore
        const data = { 
            title, 
            date, 
            fileUrl,
            updatedAt: new Date().toISOString()
        };
        
        const documentsRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory);
        
        if (docId) {
            // EDIT/UPDATE
            await documentsRef.doc(docId).update(data);
            showNotification('Dokumen berjaya dikemaskini!', 'success');
        } else {
            // TAMBAH/CREATE
            data.createdAt = new Date().toISOString();
            await documentsRef.add(data);
            showNotification('Dokumen berjaya ditambah!', 'success');
        }
        
        // Bersihkan borang dan muat semula senarai
        document.getElementById('document-form').reset();
        document.getElementById('crud-form-section').style.display = 'none';
        loadDocuments();
        
    } catch (error) {
        console.error("Ralat pemprosesan dokumen: ", error);
        showNotification(`Gagal menyimpan data: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
};

/**
 * Fungsi Padam (Delete)
 */
const handleDelete = async (docId, fileUrl) => {
    if (!confirm("Adakah anda pasti mahu memadam dokumen ini?\n\nTindakan ini tidak boleh diundur dan akan memadamkan fail yang berkaitan.")) return;

    try {
        // Padam dari Firestore
        const documentRef = db.collection('Panitia').doc(currentPanitiaId).collection(currentCategory).doc(docId);
        await documentRef.delete();

        // Padam dari Storage (jika ada fail)
        if (fileUrl) {
            try {
                const fileRef = storage.refFromURL(fileUrl);
                await fileRef.delete();
            } catch (err) {
                console.warn("Gagal padam fail dari storage:", err);
            }
        }

        showNotification('Dokumen berjaya dipadam!', 'success');
        loadDocuments();

    } catch (error) {
        console.error("Ralat memadam dokumen: ", error);
        showNotification(`Gagal memadam dokumen: ${error.message}`, 'error');
    }
};

/**
 * Show notification
 */
const showNotification = (message, type = 'info') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
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
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const currentDateInput = document.getElementById('doc-date');

    if (!formSection || !documentForm || !tableBody || !addBtn) return;

    // Set current date as default
    if (currentDateInput && !currentDateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        currentDateInput.value = today;
    }

    // Tunjukkan borang 'Tambah Baru'
    addBtn.addEventListener('click', () => {
        documentForm.reset();
        document.getElementById('document-id').value = '';
        document.getElementById('form-action-title').textContent = 'Tambah Dokumen Baru';
        document.getElementById('submit-btn').textContent = 'Simpan Dokumen';
        document.getElementById('doc-file').dataset.existingUrl = '';
        
        // Set current date
        if (currentDateInput) {
            const today = new Date().toISOString().split('T')[0];
            currentDateInput.value = today;
        }
        
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Sembunyikan borang
    cancelBtn.addEventListener('click', () => {
        formSection.style.display = 'none';
    });

    // Back to dashboard
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    // Hantar borang (Tambah/Edit)
    documentForm.addEventListener('submit', handleFormSubmission);

    // File input change handler
    const fileInput = document.getElementById('doc-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                const fileSize = (e.target.files[0].size / 1024 / 1024).toFixed(2);
                fileNameDisplay.textContent = `${fileName} (${fileSize} MB)`;
                fileNameDisplay.style.color = '#28a745';
            } else {
                fileNameDisplay.textContent = 'Tiada fail dipilih';
                fileNameDisplay.style.color = '#6c757d';
            }
        });
    }

    // Edit/Delete Listeners (Menggunakan event delegation pada table body)
    tableBody.addEventListener('click', (e) => {
        const target = e.target.closest('.edit-btn') || e.target.closest('.delete-btn');
        if (!target) return;
        
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
            document.getElementById('doc-date').value = date ? date.split('T')[0] : '';
            document.getElementById('doc-file').dataset.existingUrl = fileUrl; 
            
            document.getElementById('form-action-title').textContent = 'Edit Dokumen';
            document.getElementById('submit-btn').textContent = 'Kemaskini Dokumen';
            
            if (fileUrl) {
                const fileName = fileUrl.split('/').pop().split('?')[0];
                document.getElementById('file-name-display').textContent = `Fail sedia ada: ${fileName}`;
                document.getElementById('file-name-display').style.color = '#17a2b8';
            }
            
            formSection.style.display = 'block';
            formSection.scrollIntoView({ behavior: 'smooth' });
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

    // Update UI elements
    const panitiaNameDisplay = document.getElementById('panitia-name-display');
    const categoryTitle = document.getElementById('category-title');
    const currentCategoryName = document.getElementById('current-category-name');
    
    if (panitiaNameDisplay) panitiaNameDisplay.textContent = panitiaName;
    if (categoryTitle) categoryTitle.textContent = formatCategoryName(currentCategory);
    if (currentCategoryName) currentCategoryName.textContent = formatCategoryName(currentCategory);

    loadDocuments();
    setupEventListeners();
};

// =========================================================================
// D. PANGGILAN INISIALISASI UTAMA
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    waitForFirebase().then(() => {
        // Tentukan halaman mana kita berada
        const path = window.location.pathname;
        
        // Initialize based on page
        if (path.includes('index.html') || path === '/' || path.includes('/index')) {
            // Index page
            if (loginSection) {
                auth.onAuthStateChanged((user) => { 
                    if (user) {
                        loginSection.style.display = 'none';
                        panitiaSelectionSection.style.display = 'block';
                        localStorage.setItem('userEmail', user.email);
                        loadPanitiaList();
                    } else {
                        loginSection.style.display = 'block';
                        panitiaSelectionSection.style.display = 'none';
                    }
                });
            }
        } 
        else if (path.includes('dashboard.html')) {
            // Dashboard page
            auth.onAuthStateChanged((user) => { 
                if (user) {
                    localStorage.setItem('userEmail', user.email);
                    initDashboard();
                } else {
                    window.location.href = '../index.html';
                }
            });
        }
        else if (path.includes('panitia-view.html')) {
            // Panitia view page
            auth.onAuthStateChanged((user) => { 
                if (user) {
                    localStorage.setItem('userEmail', user.email);
                    initPanitiaView();
                } else {
                    showNotification("Sesi log masuk telah tamat.", "error");
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 2000);
                }
            });
        }
        
    }).catch(error => {
        console.error("Firebase initialization failed:", error);
        
        // Show error message
        let errorMessage = 'Sistem tidak dapat dimuatkan. Sila muat semula halaman.';
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            errorMessage += '\n\nPastikan anda telah mengkonfigurasi Firebase dengan betul untuk pembangunan tempatan.';
        }
        
        const errorContainer = document.getElementById('auth-error-message') || 
                              document.getElementById('app-container') || 
                              document.body;
        
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            margin: 20px;
            border-radius: 5px;
            border: 1px solid #f5c6cb;
            text-align: center;
        `;
        errorEl.innerHTML = `
            <h3>⚠️ Ralat Sistem</h3>
            <p>${errorMessage}</p>
            <p><small>${error.message}</small></p>
            <button onclick="location.reload()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">
                Muat Semula Halaman
            </button>
        `;
        
        errorContainer.prepend(errorEl);
    });
});
[file content end]
