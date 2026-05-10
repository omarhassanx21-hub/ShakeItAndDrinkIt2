const firebaseConfig = {
    apiKey: "AIzaSyCW76Q6rfX8mt5aO6QVNKdPOWbpuT-5K6I",
    authDomain: "shake-it-and-drink-it.firebaseapp.com",
    projectId: "shake-it-and-drink-it",
    storageBucket: "shake-it-and-drink-it.firebasestorage.app",
    messagingSenderId: "472657702271",
    appId: "1:472657702271:web:d912c43badf7d2cf81fe4a",
    measurementId: "G-QM6XHXYZFT"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

try {
    firebase.analytics();
} catch (e) {
    console.warn("Analytics initialization skipped:", e.message);
}

// SET YOUR AUTHORIZED EMAILS HERE
const AUTHORIZED_EMAILS = ["omarhassanx2121@gmail.com", "ahmadhasanx21@gmail.com"];
let currentEditId = null;
let unsubscribeJuices = null;
let unsubscribeOrders = null;
let ordersChart = null;
let lastOrderCount = null;
let mostSoldChart = null;
let allJuices = []; // Store juices for local re-rendering
let allOrders = []; // Store orders for local search/sort
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
        confirmBtn: "Confirm",
        confirmOrderTitle: "Delete Order",
        confirmOrderMsg: "Are you sure you want to delete the order for \"{name}\"?",
        tabInventory: "Inventory", tabActive: "Active Orders", tabCompleted: "History", tabAnalytics: "Analytics",
        headerActive: "Active Orders", headerCompleted: "Completed History",
        noActiveOrders: "No active orders.",
        statusPending: "Pending", statusWorking: "Working", statusDone: "Completed",
        btnConfirmOrder: "Confirm", btnMarkDone: "Complete",
        orderFor: "Order for", totalLabel: "Total",
        currency: "L.P", sortNewest: "Newest First", sortOldest: "Oldest First",
        sortTotalHigh: "Total: High to Low", sortTotalLow: "Total: Low to High",
        sortNameAZ: "Name: A-Z", sortNameZA: "Name: Z-A",
        statTotalOrders: "Total Orders",
        statTotalRevenue: "Total Revenue", headerCompleted: "Completed History",
        statAOV: "Avg Order Value",
        chartOrders: "Orders", chartRevenue: "Revenue", chartTitle: "Performance",
        chartMostSold: "Top 10 Most Sold Items"
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
        confirmBtn: "تأكيد",
        confirmOrderTitle: "حذف الطلب",
        confirmOrderMsg: "هل أنت متأكد أنك تريد حذف طلب \"{name}\"؟",
        tabInventory: "المخزون", tabActive: "الطلبات النشطة", tabCompleted: "السجل", tabAnalytics: "الإحصائيات",
        headerActive: "الطلبات النشطة", headerCompleted: "سجل الطلبات المكتملة",
        noActiveOrders: "لا توجد طلبات نشطة.",
        statusPending: "قيد الانتظار", statusWorking: "قيد التنفيذ", statusDone: "تم التوصيل",
        btnConfirmOrder: "تأكيد", btnMarkDone: "إتمام",
        orderFor: "طلب لـ", totalLabel: "المجموع",
        currency: "L.P", sortNewest: "الأحدث أولاً", sortOldest: "الأقدم أولاً",
        sortTotalHigh: "المجموع: من الأعلى إلى الأقل", sortTotalLow: "المجموع: من الأقل إلى الأعلى",
        sortNameAZ: "الاسم: أ-ي", sortNameZA: "الاسم: ي-أ",
        statTotalOrders: "إجمالي الطلبات",
        statTotalRevenue: "إجمالي الإيرادات", headerCompleted: "سجل الطلبات المكتملة",
        statAOV: "متوسط قيمة الطلب",
        chartOrders: "الطلبات", chartRevenue: "الأرباح", chartTitle: "الأداء",
        chartMostSold: "أكثر 10 أصناف مبيعاً"
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
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.innerText = t[key];
        });
        
        // Re-render cached data instead of re-subscribing to Firebase
        if (allJuices.length > 0) renderJuices();
        if (allOrders.length > 0) renderOrders();
    }
}

// Handle the redirect result when the page loads
if (window.location.protocol !== 'file:') {
    auth.getRedirectResult().then((result) => {
        if (result.user) {
            console.log("Successfully signed in via redirect:", result.user.email);
        }
    }).catch((error) => {
        console.error("Auth Redirect Error:", error.code, error.message);
        if (error.code !== 'auth/redirect-cancelled-by-user') {
            showToast(translations[currentLang].toastLoginError + error.message, "error");
        }
    });
}

auth.onAuthStateChanged(user => {
    console.log("Auth State Changed. User:", user ? user.email : "Logged Out");
    if (user) {
        const userEmail = (user.email || "").toLowerCase();
        const isAuthorized = AUTHORIZED_EMAILS.map(e => e.toLowerCase()).includes(userEmail);

        if (isAuthorized) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            setLanguage(currentLang); // Ensure UI matches language on login
            initRealtimeUpdates();
            initOrdersRealtimeUpdates();
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
        if (unsubscribeOrders) {
            unsubscribeOrders();
            unsubscribeOrders = null;
        }
    }
});

async function loginWithGoogle() {
    console.log("Attempting Google Login...");
    const provider = new firebase.auth.GoogleAuthProvider();
    
    if (window.location.protocol === 'file:') {
        showToast(translations[currentLang].toastProtocolError, "error");
        return;
    }

    // Try Popup first as it provides immediate feedback on desktop.
    // If it fails (e.g. popup blocked), fall back to Redirect.
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log("Login successful:", result.user.email);
        })
        .catch((error) => {
            console.warn("Popup blocked or failed, trying redirect...", error.message);
            auth.signInWithRedirect(provider);
        });
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
    document.getElementById('j_avail').checked = true;
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
    const available = document.getElementById('j_avail').checked;

    if (!id || id.length < 2 || !en || !ar || isNaN(price_s) || isNaN(price_l)) {
        showToast(translations[currentLang].toastErrorFields, "error");
        return;
    }

    submitBtn.disabled = true;
    const t = translations[currentLang];
    try {
        await db.collection('juices').doc(id).set({ id, en, ar, price_s, price_l, available });
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
    document.getElementById('j_avail').checked = data.available !== false;

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
    unsubscribeJuices = db.collection('juices').orderBy('en').onSnapshot(snapshot => {
        allJuices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderJuices();
    });
}

function renderJuices() {
    const list = document.getElementById('juice-list');
    const t = translations[currentLang];
    list.innerHTML = '';

    allJuices.forEach(item => {
        const div = document.createElement('div');
        div.className = 'juice-item' + (currentEditId === item.id ? ' editing' : '');
        const priceS = (item.price_s || 0).toLocaleString();
        const priceL = (item.price_l || 0).toLocaleString();
        div.innerHTML = `
            <div class="juice-info">
                <b>${item.en}</b>
                <span>${item.ar} • S: ${priceS} / L: ${priceL}</span>
                ${item.available === false ? '<span style="color:var(--danger); font-weight:bold;"> [OUT OF STOCK]</span>' : ''}
            </div>
            <div class="action-btns">
                <button type="button" class="btn-icon edit-btn" onclick="startEdit('${item.id}')">${t.btnEdit}</button>
                <button type="button" class="btn-icon delete-btn" onclick="confirmDelete('${item.id}', '${item.en}')">${t.btnDelete}</button>
            </div>
        `;
        list.appendChild(div);
    });
    if (allJuices.length === 0) list.innerHTML = `<p style="color: #64748b;">${t.noItems}</p>`;
}

function confirmDelete(id, name) {
    const t = translations[currentLang];
    const msg = t.confirmMsg.replace('{name}', name);
    openConfirmModal(t.confirmTitle, msg, () => deleteJuice(id));
}

function showTab(tab) {
    const views = ['inventory-view', 'active-orders-view', 'completed-orders-view', 'analytics-view'];
    const buttons = ['tab-inventory', 'tab-active', 'tab-completed', 'tab-analytics'];
    
    views.forEach(v => document.getElementById(v).style.display = 'none');
    buttons.forEach(b => document.getElementById(b).classList.remove('active'));

    // Fixed mapping logic for views and buttons
    const viewId = tab.endsWith('-view') ? tab : `${tab}-view`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) viewElement.style.display = (tab === 'inventory') ? 'grid' : 'block';

    const btnId = tab.startsWith('active') ? 'tab-active' : tab.startsWith('completed') ? 'tab-completed' : `tab-${tab.replace('-view','')}`;
    document.getElementById(btnId).classList.add('active');

    // Important: Force a re-render of orders when switching to analytics 
    // so the chart can calculate its dimensions correctly while visible.
    if (tab.includes('analytics')) {
        renderOrders();
    }
}

function initOrdersRealtimeUpdates() {
    if (unsubscribeOrders) unsubscribeOrders();
    unsubscribeOrders = db.collection('orders').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderOrders();
    });
}

function renderOrders() {
    const activeList = document.getElementById('orders-list');
    const completedList = document.getElementById('completed-orders-list');
    const searchQuery = document.getElementById('order-search').value.toLowerCase();
    const sortOrder = document.getElementById('order-sort').value;
    const t = translations[currentLang];

    activeList.innerHTML = '';
    completedList.innerHTML = '';
    
    let totalRev = 0;
    let completedCount = 0;
    const chartData = {}; // Format: { "MM/DD/YYYY": { count: 0, revenue: 0 } }
    const itemSales = {}; // Format: { "Item Name": totalQuantity }

    // Sort logic for completed orders
    const sortedOrders = [...allOrders].sort((a, b) => {
        if (sortOrder === 'asc' || sortOrder === 'desc') {
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        } else if (sortOrder === 'totalAsc' || sortOrder === 'totalDesc') {
            return sortOrder === 'totalAsc' ? a.total - b.total : b.total - a.total;
        } else if (sortOrder === 'nameAZ' || sortOrder === 'nameZA') {
            const nameA = (a.clientName || a.shopName || "").toLowerCase();
            const nameB = (b.clientName || b.shopName || "").toLowerCase();
            if (sortOrder === 'nameAZ') return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
        }
        return 0;
    });

    sortedOrders.forEach(order => {
        const isMatch = (order.clientName || order.shopName || "").toLowerCase().includes(searchQuery);
        const docShim = { id: order.id }; // Mock doc for render function
        
        if (order.status === 'completed') {
            completedCount++;
            totalRev += order.total;

            // Track individual item sales
            order.items.forEach(item => {
                // Group by ID to maintain language consistency in analytics
                const itemKey = item.id || item.name; 
                itemSales[itemKey] = (itemSales[itemKey] || 0) + item.quantity;
            });

            // Use ISO string (YYYY-MM-DD) as key to ensure reliable parsing/sorting across all browsers
            if (order.timestamp && typeof order.timestamp.toDate === 'function') {
                const dateKey = order.timestamp.toDate().toISOString().split('T')[0];
                if (!chartData[dateKey]) chartData[dateKey] = { count: 0, revenue: 0 };
                chartData[dateKey].count += 1;
                chartData[dateKey].revenue += order.total;
            }
            
            if (isMatch) {
                const card = renderOrderCard(docShim, order, t);
                completedList.appendChild(card);
            }
        } else {
            const card = renderOrderCard(docShim, order, t);
            activeList.appendChild(card);
        }
    });

    document.getElementById('stat-count').innerText = completedCount;
    document.getElementById('stat-revenue').innerText = `${totalRev.toLocaleString()} ${t.currency || 'L.P'}`;
    const aov = completedCount > 0 ? totalRev / completedCount : 0;
    document.getElementById('stat-aov').innerText = `${Math.round(aov).toLocaleString()} ${t.currency || 'L.P'}`;
    updateChart(chartData);
    updateMostSoldChart(itemSales);

    if (activeList.children.length === 0) activeList.innerHTML = `<p style="grid-column: 1/-1; color: #64748b;">${t.noActiveOrders}</p>`;
    if (completedList.children.length === 0) completedList.innerHTML = `<p style="grid-column: 1/-1; color: #64748b;">${t.noItems}</p>`;
}

function updateChart(data) {
    const ctx = document.getElementById('ordersChart').getContext('2d');
    const t = translations[currentLang];
    
    // Correctly sort dates chronologically
    const labels = Object.keys(data).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    
    const orderCounts = labels.map(date => data[date].count);
    const revenueValues = labels.map(date => data[date].revenue);

    if (ordersChart) ordersChart.destroy();

    ordersChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t.chartOrders,
                    data: orderCounts,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    yAxisID: 'y',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: t.chartRevenue,
                    data: revenueValues,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    yAxisID: 'y1',
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: t.chartOrders },
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: t.chartRevenue },
                    grid: { drawOnChartArea: false },
                    beginAtZero: true
                }
            }
        }
    });
}

function updateMostSoldChart(itemSales) {
    const ctx = document.getElementById('mostSoldChart').getContext('2d');
    const t = translations[currentLang];

    // Sort item keys by volume (quantity) and take top 10
    const sortedKeys = Object.keys(itemSales)
        .sort((a, b) => itemSales[b] - itemSales[a])
        .slice(0, 10);
    
    // Translate keys back to names for display
    const displayLabels = sortedKeys.map(key => {
        if (!key.includes('_')) return key; // Fallback for legacy items
        const [id, size] = key.split('_');
        const juice = allJuices.find(j => j.id === id);
        if (!juice) return key; // Safety check
        const name = currentLang === 'ar' ? (juice.ar || id) : (juice.en || id);
        const sizeLabel = t[size === 's' ? 'small_label' : 'large_label'];
        return `${name} (${sizeLabel})`;
    });
    
    const data = sortedKeys.map(key => itemSales[key]);

    if (mostSoldChart) mostSoldChart.destroy();

    mostSoldChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: displayLabels,
            datasets: [{
                label: t.chartMostSold,
                data: data,
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: '#4f46e5',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Makes the bar chart horizontal
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

function renderOrderCard(doc, order, t) {
            const date = order.timestamp ? order.timestamp.toDate().toLocaleString() : '...';
            
            const div = document.createElement('div');
            div.className = `order-card ${order.status}`;
            
            let itemsHtml = order.items.map(i => `<div>${i.quantity} x ${i.name}</div>`).join('');

            let statusText = t.statusDone;
            let actionBtn = '';

            if (order.status === 'pending') {
                statusText = t.statusPending;
                actionBtn = `<button onclick="confirmOrder('${doc.id}')" class="btn-icon confirm-btn">${t.btnConfirmOrder}</button>`;
            } else if (order.status === 'confirmed') {
                statusText = t.statusWorking;
                actionBtn = `<button onclick="completeOrder('${doc.id}')" class="btn-icon edit-btn">${t.btnMarkDone}</button>`;
            }

            div.innerHTML = `
                <div class="order-header">
                    <strong>${t.orderFor}: ${order.clientName || order.shopName}</strong>
                    <span class="status-badge">${statusText}</span>
                </div>
                <div class="order-body">
                    <p class="order-date">${date}</p>
                    <p class="order-address">📍 ${order.address}</p>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-footer">
                        <span>${t.totalLabel}: <b>${order.total.toLocaleString()} ${order.currency}</b></span>
                        <div style="display: flex; gap: 8px;">
                            ${actionBtn}
                            <button onclick="confirmOrderDelete('${doc.id}', '${(order.clientName || order.shopName || "Customer").replace(/'/g, "\\'")}')" class="btn-icon delete-btn">${t.btnDelete}</button>
                        </div>
                    </div>
                </div>
            `;
            return div;
}

async function confirmOrder(id) {
    try {
        await db.collection('orders').doc(id).update({ status: 'confirmed' });
        showToast(translations[currentLang].toastSuccessUpdate, "success");
    } catch (e) {
        showToast(e.message, "error");
    }
}

function confirmOrderDelete(id, name) {
    const t = translations[currentLang];
    const msg = t.confirmOrderMsg.replace('{name}', name);
    openConfirmModal(t.confirmOrderTitle, msg, () => deleteOrder(id));
}

async function deleteOrder(id) {
    try {
        await db.collection('orders').doc(id).delete();
        showToast(translations[currentLang].toastRemoved, "success");
    } catch (e) {
        showToast(e.message, "error");
    }
}

async function completeOrder(id) {
    try {
        await db.collection('orders').doc(id).update({ status: 'completed' });
        showToast(translations[currentLang].toastSuccessUpdate, "success");
    } catch (e) {
        showToast(e.message, "error");
    }
}

async function deleteJuice(id) {
    await db.collection('juices').doc(id).delete();
    showToast(translations[currentLang].toastRemoved, "success");
}

setLanguage(currentLang);