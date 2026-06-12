// --- UTILITAS TANGGAL ---
const getFormattedDate = () => {
    const date = new Date();
    const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember"
    ];
    // Format: DD-NamaBulan-YYYY
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

// --- ENKAPSULASI LOCALSTORAGE (DRY & Data Security) ---
const JournalStore = (() => {
    const KEY = "daily_journals";

    const getAll = () => {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    };

    const saveAll = data => {
        localStorage.setItem(KEY, JSON.stringify(data));
    };

    return {
        getAllJournals: () => getAll(),

        getTodayJournal: todayStr => {
            return (
                getAll().find(journal => journal.timestamp === todayStr) || null
            );
        },

        saveJournal: journalObj => {
            let data = getAll();
            const existingIndex = data.findIndex(
                j => j.timestamp === journalObj.timestamp
            );

            if (existingIndex > -1) {
                // Mode Edit (Update data yang ada di hari ini)
                data[existingIndex].mood = journalObj.mood;
                data[existingIndex].content = journalObj.content;
            } else {
                // Mode Tambah Baru
                data.push(journalObj);
            }
            saveAll(data);
        },

        addComment: (timestamp, commentText) => {
            let data = getAll();
            const index = data.findIndex(j => j.timestamp === timestamp);
            if (index > -1) {
                data[index].comments.push(commentText);
                saveAll(data);
            }
        },

        clearAll: () => {
            localStorage.removeItem(KEY);
        }
    };
})();

// --- UTILITAS FORMATTING TEKS ---
// Mengambil teks mentah, membaginya berdasarkan enter (\n), dan menebalkan baris pertama.
const formatContentHTML = rawText => {
    if (!rawText) return "";
    const lines = rawText.split("\n");
    const firstLine = `<b>${lines[0]}</b>`; // Baris Pertama Bold

    if (lines.length > 1) {
        const restOfText = lines.slice(1).join("<br>");
        return `${firstLine}<br>${restOfText}`;
    }
    return firstLine;
};

// --- LOGIKA UI (DOM Manipulation) ---
document.addEventListener("DOMContentLoaded", () => {
    const todayStr = getFormattedDate();
    document.getElementById("today-date").innerText = todayStr;

    // Inisialisasi State App
    let activeModalTimestamp = null;

    // --- 1. NAVIGASI SPA ---
    const navItems = document.querySelectorAll(".nav-item");
    const tabs = document.querySelectorAll(".tab-content");

    const switchTab = targetId => {
        tabs.forEach(tab => tab.classList.remove("active"));
        navItems.forEach(nav => nav.classList.remove("active"));

        document.getElementById(targetId).classList.add("active");
        document
            .querySelector(`[data-target="${targetId}"]`)
            .classList.add("active");

        // Jika pindah ke Create, refresh form state
        if (targetId === "tab-create") initCreateTab();
        // Jika pindah ke Arsip, render ulang grid
        if (targetId === "tab-archive") renderArchive();
    };

    navItems.forEach(btn => {
        btn.addEventListener("click", e => {
            switchTab(e.currentTarget.getAttribute("data-target"));
        });
    });

    // --- 2. FITUR CREATE / EDIT ---
    const journalInput = document.getElementById("journal-input");
    const btnSave = document.getElementById("btn-save");
    const moodRadios = document.getElementsByName("mood");

    const initCreateTab = () => {
        const todayJournal = JournalStore.getTodayJournal(todayStr);
        if (todayJournal) {
            // Jika sudah ada jurnal hari ini (Mode Edit)
            journalInput.value = todayJournal.content;
            Array.from(moodRadios).forEach(radio => {
                radio.checked = radio.value === todayJournal.mood;
            });
            btnSave.innerText = "Perbarui Jurnal";
        } else {
            // Mode Tambah Baru
            journalInput.value = "";
            moodRadios[0].checked = true; // Default "Senang"
            btnSave.innerText = "Simpan Jurnal";
        }
    };

    btnSave.addEventListener("click", () => {
        const content = journalInput.value.trim();
        if (!content) {
            alert("Isi jurnal tidak boleh kosong, ya!");
            return;
        }

        let selectedMood = "Senang";
        Array.from(moodRadios).forEach(r => {
            if (r.checked) selectedMood = r.value;
        });

        const journalObj = {
            id: Date.now(),
            timestamp: todayStr,
            mood: selectedMood,
            content: content,
            comments: JournalStore.getTodayJournal(todayStr)?.comments || [] // Pertahankan komentar jika ada
        };

        JournalStore.saveJournal(journalObj);
        alert("Jurnal berhasil disimpan! Sugoi!");
        initCreateTab(); // Refresh tampilan tombol & teks
    });

    // --- 3. FITUR ARSIP & MODAL DETAIL ---
    const archiveGrid = document.getElementById("archive-grid");
    const modalOverlay = document.getElementById("detail-modal");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const commentSection = document.getElementById("comment-section");

    const renderArchive = () => {
        const allJournals = JournalStore.getAllJournals();
        archiveGrid.innerHTML = ""; // Kosongkan grid

        // Urutkan dari yang terbaru (opsional)
        allJournals.reverse().forEach(journal => {
            const card = document.createElement("div");
            card.className = "journal-card";
            card.innerHTML = `
                <div class="card-date">${journal.timestamp} • ${journal.mood}</div>
                <div class="card-preview">${formatContentHTML(journal.content)}</div>
            `;
            card.addEventListener("click", () => openModal(journal));
            archiveGrid.appendChild(card);
        });
    };

    const openModal = journal => {
        activeModalTimestamp = journal.timestamp;
        document.getElementById("modal-date").innerText = journal.timestamp;
        document.getElementById("modal-mood").innerText = journal.mood;
        document.getElementById("modal-body").innerHTML = formatContentHTML(
            journal.content
        );

        // Aturan Komentar: Disable jika jurnal hari ini, Enable jika jurnal lampau
        if (journal.timestamp === todayStr) {
            commentSection.classList.add("hidden");
        } else {
            commentSection.classList.remove("hidden");
            renderComments(journal.comments);
        }

        modalOverlay.classList.remove("hidden");
    };

    btnCloseModal.addEventListener("click", () => {
        modalOverlay.classList.add("hidden");
        activeModalTimestamp = null;
    });

    // --- 4. FITUR KOMENTAR DI MODAL ---
    const btnAddComment = document.getElementById("btn-add-comment");
    const commentInput = document.getElementById("comment-input");
    const commentList = document.getElementById("comment-list");

    const renderComments = commentsArray => {
        commentList.innerHTML = "";
        if (commentsArray.length === 0) {
            commentList.innerHTML =
                '<p style="font-size:12px; opacity:0.6;">Belum ada komentar.</p>';
            return;
        }
        commentsArray.forEach(txt => {
            const el = document.createElement("div");
            el.className = "comment-item";
            el.innerText = txt;
            commentList.appendChild(el);
        });
        // Auto scroll ke bawah
        commentList.scrollTop = commentList.scrollHeight;
    };

    btnAddComment.addEventListener("click", () => {
        const txt = commentInput.value.trim();
        if (txt && activeModalTimestamp) {
            JournalStore.addComment(activeModalTimestamp, txt);
            commentInput.value = ""; // Bersihkan input

            // Render ulang komentar langsung dari store
            const updatedJournal = JournalStore.getAllJournals().find(
                j => j.timestamp === activeModalTimestamp
            );
            renderComments(updatedJournal.comments);
        }
    });

    // --- 5. FITUR PENGATURAN (RESET) ---
    document.getElementById("btn-reset").addEventListener("click", () => {
        const confirmDelete = confirm(
            "Honto ni? (Apakah kamu benar-benar yakin ingin menghapus semua jurnal?)"
        );
        if (confirmDelete) {
            JournalStore.clearAll();
            alert("Seluruh data telah dihapus.");
            initCreateTab();
        }
    });

    // Jalankan inisialisasi awal saat aplikasi pertama kali dimuat (Deployment state)
    initCreateTab();
});
