const firebaseConfig = {
    apiKey: "AIzaSyCW76Q6rfX8mt5aO6QVNKdPOWbpuT-5K6I",
    authDomain: "shake-it-and-drink-it.firebaseapp.com",
    projectId: "shake-it-and-drink-it",
    storageBucket: "shake-it-and-drink-it.firebasestorage.app",
    messagingSenderId: "472657702271",
    appId: "1:472657702271:web:d912c43badf7d2cf81fe4a",
    measurementId: "G-QM6XHXYZFT"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// SET YOUR AUTHORIZED EMAILS HERE
const AUTHORIZED_EMAILS = ["omarhassanx2121@gmail.com", "ahmadhasanx21@gmail.com"];
let currentEditId = null;
let unsubscribeJuices = null;
let currentLang = localStorage.getItem('shakeItLang') || 'en';

const translations = {
    en: {
        navTitle: "Abo Dodo Admin", logout: "Sign Out", loginHeader: "Admin Login",
        loginDesc: "Access limited to authorized personnel.", loginBtn: "Sign In with Google",
        formAdd: "Add New Juice", formEdit: "Edit Juice", labelId: "Unique ID",
        labelEn: "English Name", labelAr: "Arabic Name", labelPs: "Small Price",
        labelPl: "Large Price", btnAdd: "Add to Inventory", btnUpdate: "Update Juice",
        btnCancel: "Cancel", btnEdit: "Edit", btnDelete: "Delete",
        existingItems: "Existing Items", loading: "Loading inventory...",
        noItems: "No items found.", toastSuccessAdd: "Juice added!",
        toastSuccessUpdate: "Juice updated!", toastRemoved: "Item removed.",
        toastErrorFields: "Please fill all fields correctly.",
        toastDenied: "Access Denied: Unauthorized email.",
        toastLoginError: "Login failed: ",
        toastProtocolError: "Cannot run from file:// protocol. Use a local server.",
        confirmTitle: "Delete Juice", confirmMsg: "Are you sure you want to remove \"{name}\"?",
        confirmBtn: "Confirm"
    },
    ar: {
        navTitle: "مسؤول أبو دودو", logout: "تسجيل الخروج", loginHeader: "تسجيل دخول المسؤول",
        loginDesc: "الدخول مقتصر على الموظفين المصرح لهم.", loginBtn: "تسجيل الدخول باستخدام جوجل",
        formAdd: "إضافة عصير جديد", formEdit: "تعديل العصير", labelId: "المعرف الفريد",
        labelEn: "الاسم بالإنجليزية", labelAr: "الاسم بالعربية", labelPs: "سعر صغير",
        labelPl: "سعر كبير", btnAdd: "إضافة إلى المخزون", btnUpdate: "تحديث العصير",
        btnCancel: "إلغاء", btnEdit: "تعديل", btnDelete: "حذف",
        existingItems: "الأصناف الحالية", loading: "جاري تحميل المخزون...",
        noItems: "لم يتم العثور على أصناف.", toastSuccessAdd: "تمت إضافة العصير!",
        toastSuccessUpdate: "تم تحديث العصير!", toastRemoved: "تمت إزالة الصنف.",
        toastErrorFields: "يرجى ملء جميع الحقول بشكل صحيح.",
        toastDenied: "تم رفض الوصول: بريد إلكتروني غير مصرح به.",
        toastLoginError: "فشل تسجيل الدخول: ",
        toastProtocolError: "لا يمكن التشغيل من بروتوكول file://. استخدم خادماً محلياً.",
        confirmTitle: "حذف العصير", confirmMsg: "هل أنت متأكد أنك تريد إزالة \"{name}\"؟",
        confirmBtn: "تأكيد"
    }
};

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('shakeItLang', lang);
    document.body.className = lang === 'ar' ? 'rtl' : '';
    const t = translations[lang];
    
    document.getElementById('login-header').innerText = t.loginHeader;
    document.getElementById('login-desc').innerText = t.loginDesc;
    document.getElementById('login-google-btn').innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px; vertical-align:middle; margin-right:8px;"> ${t.loginBtn}`;
    
    if (document.getElementById('admin-content').style.display === 'block') {
        document.getElementById('nav-title').innerText = t.navTitle;
        document.getElementById('logout-btn').innerText = t.logout;
        document.getElementById('form-title').innerText = currentEditId ? t.formEdit : t.formAdd;
        document.getElementById('label-id').innerText = t.labelId;
        document.getElementById('label-en').innerText = t.labelEn;
        document.getElementById('label-ar').innerText = t.labelAr;
        document.getElementById('label-ps').innerText = t.labelPs;
        document.getElementById('label-pl').innerText = t.labelPl;
        document.getElementById('submit-btn').innerText = currentEditId ? t.btnUpdate : t.btnAdd;
        document.getElementById('cancel-edit-btn').innerText = t.btnCancel;
        document.getElementById('header-existing').innerText = t.existingItems;
        document.getElementById('modal-confirm-btn').innerText = t.confirmBtn;
        document.getElementById('modal-cancel-btn').innerText = t.btnCancel;
        
        // Re-render the list if we are logged in to update button labels
        if (document.getElementById('admin-content').style.display === 'block') {
            initRealtimeUpdates();
        }
    }
}

auth.onAuthStateChanged(user => {
    if (user) {
        if (AUTHORIZED_EMAILS.includes(user.email)) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            initRealtimeUpdates();
        } else {
            showToast(translations[currentLang].toastDenied, "error");
            auth.signOut();
        }
    } else {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('admin-content').style.display = 'none';
        if (unsubscribeJuices) {
            unsubscribeJuices();
            unsubscribeJuices = null;
        }
    }
});

async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    if (window.location.protocol === 'file:') {
        showToast(translations[currentLang].toastProtocolError, "error");
        return;
    }
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        showToast(translations[currentLang].toastLoginError + error.message, "error");
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function openConfirmModal(title, message, onConfirm) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';
    document.getElementById('modal-confirm-btn').onclick = () => {
        onConfirm();
        closeModal();
    };
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function logout() {
    auth.signOut();
    location.reload();
}

function handleFormSubmit(e) {
    e.preventDefault();
    saveJuice();
}

function resetForm() {
    ['j_id', 'j_en', 'j_ar', 'j_ps', 'j_pl'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('j_id').disabled = false;
    document.getElementById('j_id').style.opacity = "1";
}

async function saveJuice() {
    const submitBtn = document.getElementById('submit-btn');
    const idInput = document.getElementById('j_id');
    // Sanitize ID: remove non-alphanumeric, handle multiple hyphens, and trim trailing hyphens
    const id = idInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    const en = document.getElementById('j_en').value.trim();
    const ar = document.getElementById('j_ar').value.trim();
    const price_s = parseInt(document.getElementById('j_ps').value);
    const price_l = parseInt(document.getElementById('j_pl').value);

    if (!id || id.length < 2 || !en || !ar || isNaN(price_s) || isNaN(price_l)) {
        showToast(translations[currentLang].toastErrorFields, "error");
        return;
    }

    submitBtn.disabled = true;
    const t = translations[currentLang];
    try {
        await db.collection('juices').doc(id).set({ id, en, ar, price_s, price_l });
        showToast(currentEditId ? t.toastSuccessUpdate : t.toastSuccessAdd, "success");
        if (currentEditId) cancelEdit();
        else resetForm();
    } catch (error) {
        console.error(error);
        showToast("Error: " + error.message, "error");
    } finally {
        submitBtn.disabled = false;
    }
}

async function startEdit(id) {
    currentEditId = id;
    const doc = await db.collection('juices').doc(id).get();
    if (!doc.exists) return;
    
    const data = doc.data();
    document.getElementById('j_id').value = data.id;
    document.getElementById('j_id').disabled = true;
    document.getElementById('j_id').style.opacity = "0.6";
    document.getElementById('j_en').value = data.en;
    document.getElementById('j_ar').value = data.ar;
    document.getElementById('j_ps').value = data.price_s;
    document.getElementById('j_pl').value = data.price_l;

    const t = translations[currentLang];
    document.getElementById('form-title').innerText = t.formEdit;
    document.getElementById('submit-btn').innerText = t.btnUpdate;
    document.getElementById('cancel-edit-btn').innerText = t.btnCancel;
    document.getElementById('cancel-edit-btn').style.display = 'block';
    document.getElementById('form-container').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    currentEditId = null;
    resetForm();
    const t = translations[currentLang];
    document.getElementById('form-title').innerText = t.formAdd;
    document.getElementById('submit-btn').innerText = t.btnAdd;
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function initRealtimeUpdates() {
    // Important: Unsubscribe from the previous listener if it exists to prevent leaks and duplicates
    if (unsubscribeJuices) {
        unsubscribeJuices();
    }

    const list = document.getElementById('juice-list');
    const t = translations[currentLang];

    unsubscribeJuices = db.collection('juices').orderBy('en').onSnapshot(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const item = doc.data();
            const div = document.createElement('div');
            div.className = 'juice-item' + (currentEditId === doc.id ? ' editing' : '');
            div.innerHTML = `
                <div class="juice-info">
                    <b>${item.en}</b>
                    <span>${item.ar} • S: ${item.price_s} / L: ${item.price_l}</span>
                </div>
                <div class="action-btns">
                    <button type="button" class="btn-icon edit-btn" onclick="startEdit('${doc.id}')">${t.btnEdit}</button>
                    <button type="button" class="btn-icon delete-btn" onclick="confirmDelete('${doc.id}', '${item.en}')">${t.btnDelete}</button>
                </div>
            `;
            list.appendChild(div);
        });
        if (snapshot.empty) list.innerHTML = `<p style="color: #64748b;">${t.noItems}</p>`;
    });
}

function confirmDelete(id, name) {
    const t = translations[currentLang];
    const msg = t.confirmMsg.replace('{name}', name);
    openConfirmModal(t.confirmTitle, msg, () => deleteJuice(id));
}

async function deleteJuice(id) {
    await db.collection('juices').doc(id).delete();
    showToast(translations[currentLang].toastRemoved, "success");
}

setLanguage(currentLang);