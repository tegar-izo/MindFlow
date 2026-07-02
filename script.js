// ============================================================
// BLOK 1: UTILITY FUNCTIONS (PURE) cure
// ============================================================

function getFormattedDate() {
    const date = new Date();
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

function formatContentHTML(rawText) {
    if (!rawText) return '';
    const lines = rawText.split('\n');
    const firstLine = `<b>${lines[0]}</b>`;
    if (lines.length > 1) {
        return `${firstLine}<br>${lines.slice(1).join('<br>')}`;
    }
    return firstLine;
}

function isToday(timestamp) {
    return timestamp === getFormattedDate();
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ============================================================
// BLOK 2: DATA STORE + MIGRASI OTOMATIS
// ============================================================
const JournalStore = (() => {
    const KEY = 'daily_journals';

    const getAll = () => JSON.parse(localStorage.getItem(KEY)) || [];

    const saveAll = (data) => localStorage.setItem(KEY, JSON.stringify(data));

    const migrateOldComments = () => {
        const data = getAll();
        let isUpdated = false;

        data.forEach(journal => {
            if (journal.comments && Array.isArray(journal.comments) && journal.comments.length > 0) {
                journal.reflections = journal.comments.map(text => ({
                    id: generateId(),
                    createdAt: getFormattedDate(),
                    content: text,
                    tags: []
                }));
                delete journal.comments;
                isUpdated = true;
            }
            if (!journal.reflections) {
                journal.reflections = [];
                isUpdated = true;
            }
        });

        if (isUpdated) {
            saveAll(data);
            console.log('✅ Migrasi data: "comments" lama berhasil diubah menjadi "reflections"!');
        }
        return data;
    };

    migrateOldComments();

    return {
        getAllJournals: getAll,

        getByTimestamp: (timestamp) => {
            return getAll().find(j => j.timestamp === timestamp) || null;
        },

        saveJournal: (journalObj) => {
            const data = getAll();
            const index = data.findIndex(j => j.timestamp === journalObj.timestamp);
            if (index > -1) {
                journalObj.reflections = data[index].reflections || [];
                data[index] = journalObj;
            } else {
                if (!journalObj.reflections) journalObj.reflections = [];
                data.push(journalObj);
            }
            saveAll(data);
        },

        addReflection: (timestamp, content, tagsArray) => {
            const data = getAll();
            const index = data.findIndex(j => j.timestamp === timestamp);
            if (index === -1) return false;

            if (!data[index].reflections) data[index].reflections = [];
            data[index].reflections.push({
                id: generateId(),
                createdAt: getFormattedDate(),
                content: content.trim(),
                tags: tagsArray.map(t => t.trim()).filter(t => t.length > 0)
            });
            saveAll(data);
            return true;
        },

        clearAll: () => {
            localStorage.removeItem(KEY);
        }
    };
})();

// ============================================================
// BLOK 3: DOM REFS & APP STATE
// ============================================================
const DOM = {
    todayDate: document.getElementById('today-date'),
    journalInput: document.getElementById('journal-input'),
    btnSave: document.getElementById('btn-save'),
    moodRadios: document.getElementsByName('mood'),
    archiveGrid: document.getElementById('archive-grid'),
    modalOverlay: document.getElementById('detail-modal'),
    modalContent: document.querySelector('.modal-content'),
    modalDate: document.getElementById('modal-date'),
    modalMood: document.getElementById('modal-mood'),
    modalBody: document.getElementById('modal-body'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    reflectionSection: document.getElementById('reflection-section'),
    reflectionList: document.getElementById('reflection-list'),
    reflectionCount: document.getElementById('reflection-count'),
    reflectionText: document.getElementById('reflection-text'),
    reflectionTags: document.getElementById('reflection-tags'),
    btnAddReflection: document.getElementById('btn-add-reflection'),
    todayMessage: document.getElementById('today-message'),
    btnReset: document.getElementById('btn-reset'),
    btnExport: document.getElementById('btn-export'),
    btnImportTrigger: document.getElementById('btn-import-trigger'),
    importInput: document.getElementById('import-input'),
    navItems: document.querySelectorAll('.nav-item'),
    tabs: document.querySelectorAll('.tab-content'),
};

const AppState = {
    activeModalTimestamp: null,
};

// ============================================================
// BLOK 4: KEYBOARD HANDLER (HANYA UNTUK PADDING #APP)
// ============================================================
let keyboardResizeHandler = null;

function initKeyboardHandler() {
    const app = document.getElementById('app');
    const focusableInputs = document.querySelectorAll(
        'textarea, input[type="text"], input[type="file"]'
    );

    if (window.visualViewport) {
        const viewport = window.visualViewport;

        const handleResize = () => {
            const keyboardHeight = Math.max(0, window.innerHeight - viewport.height);

            if (app) {
                app.style.paddingBottom = (keyboardHeight + 80) + 'px';
            }
        };

        viewport.addEventListener('resize', handleResize);
        viewport.addEventListener('scroll', handleResize);
        keyboardResizeHandler = handleResize;
        setTimeout(handleResize, 100);
    }

    focusableInputs.forEach(input => {
        input.addEventListener('focus', (e) => {
            if (e.target.closest('.modal-content')) {
                setTimeout(() => {
                    if (DOM.reflectionList) {
                        DOM.reflectionList.scrollTop = DOM.reflectionList.scrollHeight;
                    }
                }, 300);
                return;
            }

            setTimeout(() => {
                e.target.scrollIntoView({ block: 'center', behavior: 'auto' });
            }, 300);
        });
    });
}

// ============================================================
// BLOK 5: NAVIGATION (SPA TAB SWITCHING)
// ============================================================
function switchTab(targetId) {
    DOM.tabs.forEach(tab => tab.classList.remove('active'));
    DOM.navItems.forEach(nav => nav.classList.remove('active'));

    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');

    if (targetId === 'tab-create') initCreateTab();
    if (targetId === 'tab-archive') renderArchive();

    if (keyboardResizeHandler) setTimeout(keyboardResizeHandler, 100);
}

DOM.navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        switchTab(target);
    });
});

// ============================================================
// BLOK 6: CREATE / EDIT TAB
// ============================================================
function initCreateTab() {
    const todayStr = getFormattedDate();
    const todayJournal = JournalStore.getByTimestamp(todayStr);

    if (todayJournal) {
        DOM.journalInput.value = todayJournal.content;
        Array.from(DOM.moodRadios).forEach(radio => {
            radio.checked = radio.value === todayJournal.mood;
        });
        DOM.btnSave.textContent = 'Perbarui Jurnal';
    } else {
        DOM.journalInput.value = '';
        DOM.moodRadios[0].checked = true;
        DOM.btnSave.textContent = 'Simpan Jurnal';
    }
}

DOM.btnSave.addEventListener('click', () => {
    const content = DOM.journalInput.value.trim();
    if (!content) {
        alert('Isi jurnal tidak boleh kosong, ya! Ganbatte!'); // <-- PERUBAHAN
        return;
    }

    let selectedMood = 'Senang';
    Array.from(DOM.moodRadios).forEach(r => {
        if (r.checked) selectedMood = r.value;
    });

    const todayStr = getFormattedDate();
    const existing = JournalStore.getByTimestamp(todayStr);
    const journalObj = {
        id: Date.now(),
        timestamp: todayStr,
        mood: selectedMood,
        content: content,
        reflections: existing?.reflections || []
    };

    JournalStore.saveJournal(journalObj);
    alert('Jurnal berhasil disimpan! Sugoi!'); // <-- TETAP (contoh)
    initCreateTab();
});

// ============================================================
// BLOK 7: ARCHIVE & MODAL (DENGAN NO-SCROLL)
// ============================================================
function renderArchive() {
    const allJournals = JournalStore.getAllJournals();
    DOM.archiveGrid.innerHTML = '';

    allJournals.reverse().forEach(journal => {
        const card = document.createElement('div');
        card.className = 'journal-card';
        card.innerHTML = `
            <div class="card-date">${journal.timestamp} • ${journal.mood}</div>
            <div class="card-preview">${formatContentHTML(journal.content)}</div>
        `;
        card.addEventListener('click', () => openModal(journal.timestamp));
        DOM.archiveGrid.appendChild(card);
    });
}

function openModal(timestamp) {
    const journal = JournalStore.getByTimestamp(timestamp);
    if (!journal) {
        alert('Jurnal tidak ditemukan! Chotto matte!'); // <-- PERUBAHAN
        return;
    }

    AppState.activeModalTimestamp = journal.timestamp;
    DOM.modalDate.textContent = journal.timestamp;
    DOM.modalMood.textContent = journal.mood;
    DOM.modalBody.innerHTML = formatContentHTML(journal.content);

    const isTodayJournal = isToday(journal.timestamp);

    if (isTodayJournal) {
        DOM.reflectionSection.classList.add('hidden');
        DOM.todayMessage.classList.remove('hidden');
    } else {
        DOM.reflectionSection.classList.remove('hidden');
        DOM.todayMessage.classList.add('hidden');
        renderReflections(journal.reflections || []);
        DOM.reflectionText.value = '';
        DOM.reflectionTags.value = '';
    }

    document.getElementById('app').classList.add('no-scroll');

    requestAnimationFrame(() => {
        DOM.modalOverlay.classList.remove('hidden');
    });

    if (keyboardResizeHandler) setTimeout(keyboardResizeHandler, 200);
}

function closeModal() {
    DOM.modalOverlay.classList.add('hidden');
    AppState.activeModalTimestamp = null;

    document.getElementById('app').classList.remove('no-scroll');

    if (keyboardResizeHandler) setTimeout(keyboardResizeHandler, 100);
}

DOM.btnCloseModal.addEventListener('click', closeModal);

DOM.modalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.modalOverlay) closeModal();
});

// ============================================================
// BLOK 8: RENDER & TAMBAH REFLEKSI
// ============================================================
function renderReflections(reflectionsArray) {
    DOM.reflectionList.innerHTML = '';
    DOM.reflectionCount.textContent = `${reflectionsArray.length} refleksi`;

    if (!reflectionsArray || reflectionsArray.length === 0) {
        DOM.reflectionList.innerHTML = `
            <div style="text-align:center;padding:var(--space-md);opacity:0.5;font-size:14px;">
                Belum ada refleksi untuk masa lalu ini. Mōsukoshi! <!-- PERUBAHAN -->
            </div>
        `;
        return;
    }

    const sorted = [...reflectionsArray].reverse();

    sorted.forEach(ref => {
        const card = document.createElement('div');
        card.className = 'reflection-card';

        let tagsHTML = '';
        if (ref.tags && ref.tags.length > 0) {
            tagsHTML = `<div class="card-tags">${ref.tags.map(t => `<span class="tag-chip">#${t}</span>`).join('')}</div>`;
        }

        card.innerHTML = `
            <div class="card-meta">
                <span class="reflection-date">📌 ${ref.createdAt || 'Tanpa tanggal'}</span>
                <span style="font-size:10px;opacity:0.4;">ID: ${ref.id}</span>
            </div>
            <div class="card-content">${ref.content}</div>
            ${tagsHTML}
        `;
        DOM.reflectionList.appendChild(card);
    });

    DOM.reflectionList.scrollTop = DOM.reflectionList.scrollHeight;
}

DOM.btnAddReflection.addEventListener('click', () => {
    const text = DOM.reflectionText.value.trim();
    if (!text) {
        alert('Refleksi tidak boleh kosong! Mōichido!'); // <-- PERUBAHAN
        return;
    }
    if (!AppState.activeModalTimestamp) return;

    const tagsRaw = DOM.reflectionTags.value.trim();
    let tagsArray = [];
    if (tagsRaw) {
        tagsArray = tagsRaw.split(',').map(t => t.trim().replace(/^#/, ''));
        tagsArray = tagsArray.filter(t => t.length > 0);
    }

    const success = JournalStore.addReflection(AppState.activeModalTimestamp, text, tagsArray);
    if (success) {
        DOM.reflectionText.value = '';
        DOM.reflectionTags.value = '';
        const updatedJournal = JournalStore.getByTimestamp(AppState.activeModalTimestamp);
        if (updatedJournal) {
            renderReflections(updatedJournal.reflections || []);
        }
        setTimeout(() => {
            DOM.reflectionList.scrollTop = DOM.reflectionList.scrollHeight;
        }, 100);
    }
});

// ============================================================
// BLOK 9: SETTINGS – RESET
// ============================================================
DOM.btnReset.addEventListener('click', () => {
    const confirmDelete = confirm(
        'Honto ni? (Apakah kamu benar-benar yakin ingin menghapus semua jurnal?)' // <-- TETAP (contoh)
    );
    if (confirmDelete) {
        JournalStore.clearAll();
        alert('Seluruh data telah dihapus. Sayonara!'); // <-- PERUBAHAN
        initCreateTab();
    }
});

// ============================================================
// BLOK 10: SETTINGS – EXPORT / IMPORT
// ============================================================
DOM.btnExport.addEventListener('click', () => {
    const allData = JournalStore.getAllJournals();
    const dataString = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_jurnal_${getFormattedDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

DOM.btnImportTrigger.addEventListener('click', () => {
    DOM.importInput.click();
});

DOM.importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            localStorage.setItem('daily_journals', JSON.stringify(parsedData));
            alert('Data berhasil diimpor! Yokatta!'); // <-- TETAP (sudah ada Yokatta!)
            location.reload();
        } catch (_) {
            alert('Gagal! Pastikan file yang diunggah adalah file JSON yang valid. Shikata ga nai!'); // <-- PERUBAHAN
        }
    };
    reader.readAsText(file);
    event.target.value = '';
});

// ============================================================
// BLOK 11: INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    DOM.todayDate.textContent = getFormattedDate();
    initKeyboardHandler();
    initCreateTab();
});