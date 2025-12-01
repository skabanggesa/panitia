// js/crud-logic.js

// Fungsi Utama: Memuatkan kandungan (data) untuk Panitia dan Tab yang aktif
function loadContent(panitiaId, tabName) {
    const dataListBody = document.getElementById('data-list-body');
    dataListBody.innerHTML = `<tr><td colspan="4" class="loading-state">Memuatkan data dari ${tabName}...</td></tr>`;

    // Rujukan kepada sub-koleksi Firestore yang sepadan dengan tab yang dipilih
    const collectionRef = db.collection(panitiaId).doc('data').collection(tabName);

    collectionRef.get()
        .then(snapshot => {
            dataListBody.innerHTML = ''; // Kosongkan paparan sedia ada
            let count = 1;

            if (snapshot.empty) {
                dataListBody.innerHTML = `<tr><td colspan="4">Tiada dokumen ditemui di bawah Fail ${tabTitles[tabName]}.</td></tr>`;
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const row = dataListBody.insertRow();
                
                // Data Statik
                row.insertCell(0).textContent = count++;
                row.insertCell(1).textContent = data.title;
                row.insertCell(2).textContent = data.uploadedAt ? new Date(data.uploadedAt.toDate()).toLocaleDateString('ms-MY') : 'N/A';
                
                // Butang Tindakan
                const actionsCell = row.insertCell(3);
                
                // Muat Turun
                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = 'Muat Turun';
                downloadBtn.className = 'action-btn download-btn';
                downloadBtn.onclick = () => window.open(data.fileUrl, '_blank');
                
                // Padam
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Padam';
                deleteBtn.className = 'action-btn delete-btn';
                deleteBtn.onclick = () => deleteItem(panitiaId, tabName, doc.id, data.filePath); // filePath untuk padam dari Storage
                
                actionsCell.appendChild(downloadBtn);
                actionsCell.appendChild(deleteBtn);
            });
        })
        .catch(error => {
            dataListBody.innerHTML = `<tr><td colspan="4" class="error-message">Ralat memuatkan data: ${error.message}</td></tr>`;
            console.error("Ralat memuatkan data:", error);
        });
}

// Fungsi Tambah (CREATE) Item
async function addItem() {
    const title = document.getElementById('doc-title').value;
    const fileInput = document.getElementById('doc-file');
    const file = fileInput.files[0];
    const statusMessage = document.getElementById('status-message');
    
    statusMessage.textContent = 'Sedang memuat naik...';
    statusMessage.classList.remove('hidden');

    if (!file) {
        statusMessage.textContent = 'Sila pilih fail untuk dimuat naik.';
        statusMessage.style.color = 'var(--error-color)';
        return;
    }

    try {
        // 1. Muat Naik Fail ke Firebase Storage
        const filePath = `${currentPanitiaId}/${currentTab}/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(filePath);
        const snapshot = await storageRef.put(file);
        const fileUrl = await snapshot.ref.getDownloadURL();
        
        // 2. Simpan Rujukan Dokumen ke Firestore
        const collectionRef = db.collection(currentPanitiaId).doc('data').collection(currentTab);
        await collectionRef.add({
            title: title,
            fileUrl: fileUrl,
            filePath: filePath, // Simpan path untuk tujuan pemadaman Storage
            uploadedBy: auth.currentUser ? auth.currentUser.email : 'Unknown',
            uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        statusMessage.textContent = `Dokumen '${title}' berjaya dimuat naik!`;
        statusMessage.style.color = 'green';
        closeModal();
        loadContent(currentPanitiaId, currentTab); // Muat semula senarai
    } catch (error) {
        statusMessage.textContent = `Ralat semasa memuat naik: ${error.message}`;
        statusMessage.style.color = 'var(--error-color)';
        console.error("Ralat Muat Naik/Simpan Firestore:", error);
    }
}

// Fungsi Padam (DELETE) Item
function deleteItem(panitiaId, tabName, docId, filePath) {
    if (!confirm('Adakah anda pasti ingin memadam dokumen ini?')) {
        return;
    }

    const docRef = db.collection(panitiaId).doc('data').collection(tabName).doc(docId);
    
    docRef.delete()
        .then(() => {
            // Cuba padam dari Storage (jika ada filePath)
            if (filePath) {
                storage.ref(filePath).delete()
                    .then(() => console.log("Fail Storage berjaya dipadam."))
                    .catch(error => console.error("Ralat memadam fail Storage:", error));
            }
            
            alert('Dokumen berjaya dipadam.');
            loadContent(panitiaId, tabName); // Muat semula senarai
        })
        .catch(error => {
            alert(`Ralat memadam dokumen: ${error.message}`);
            console.error("Ralat memadam dokumen:", error);
        });
}

// **Nota:** Fungsi UPDATE (Edit) boleh ditambah kemudian, menggunakan logic yang sama seperti CREATE tetapi dengan fungsi .set() atau .update() Firestore.