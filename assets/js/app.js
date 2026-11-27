// ============================================================
// Kings Builders — Main Application Logic (v2)
// ============================================================

// ─── USER CREDENTIALS & AUTH ─────────────────────────────────
const USERS = {
    admin:    { password: 'admin123',  name: 'Admin User',       role: 'Administrator',    initials: 'AD', color: 'bg-primary-500' },
    boss:     { password: 'boss123',   name: 'Vikram Singh',     role: 'Director (View Only)', initials: 'VS', color: 'bg-red-500' },
    store:    { password: 'store123',  name: 'Ramesh Kumar',     role: 'Store Keeper',     initials: 'RK', color: 'bg-green-500' },
    purchase: { password: 'pur123',    name: 'Sunil Mehta',      role: 'Purchase Officer', initials: 'SM', color: 'bg-purple-500' },
    sitemgr:  { password: 'site123',   name: 'Rajesh Patil',     role: 'Site Manager',     initials: 'RP', color: 'bg-amber-500' },
};
function isBossUser() { return currentUser && currentUser.username === 'boss'; }
let currentUser = null;

function fillLogin(user, pass) {
    document.getElementById('login-username').value = user;
    document.getElementById('login-password').value = pass;
}

function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errDiv = document.getElementById('login-error');

    if (!username || !password) {
        errDiv.textContent = 'Please enter username and password';
        errDiv.classList.remove('hidden');
        return;
    }

    const user = USERS[username];
    if (!user || user.password !== password) {
        errDiv.textContent = 'Invalid username or password';
        errDiv.classList.remove('hidden');
        shakeLoginBtn();
        return;
    }

    errDiv.classList.add('hidden');
    currentUser = { username, ...user };

    // Update sidebar user info
    document.getElementById('sidebar-user-avatar').textContent = user.initials;
    document.getElementById('sidebar-user-avatar').className = `w-9 h-9 rounded-full ${user.color} flex items-center justify-center text-sm font-bold`;
    document.getElementById('sidebar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-role').textContent = user.role;

    // Hide login, show loader, then app
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.opacity = '0';
    loginScreen.style.transition = 'opacity 0.4s';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        // Show loader briefly
        const loader = document.getElementById('app-loader');
        loader.style.display = 'flex';
        loader.style.opacity = '1';
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 800);
        navigateTo('dashboard');
        updateDate();
        initGlobalEventListeners();
    }, 400);
}

function handleLogout() {
    currentUser = null;
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'flex';
    loginScreen.style.opacity = '0';
    setTimeout(() => { loginScreen.style.opacity = '1'; }, 10);
    // Clear form
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
}

function shakeLoginBtn() {
    const btn = document.getElementById('login-btn');
    btn.classList.add('animate-shake');
    setTimeout(() => btn.classList.remove('animate-shake'), 500);
}

// Allow Enter key to submit login
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('login-screen')?.style.display !== 'none') {
        handleLogin();
    }
});

// ─── HSN → GST Rate Map ─────────────────────────────────────
const HSN_GST_MAP = {
    '340290': 18, '340111': 18, '34021190': 18, '38089400': 18, '090962': 18,
    '630710': 5, '39232100': 18, '39249090': 18, '96031000': 0, '96039000': 18,
    '96032900': 18, '3924': 18, '392690': 18, '252329': 28, '721420': 18,
    '250510': 5, '940540': 18, '854411': 18, '853620': 18, '391723': 18,
    '848180': 18, '320910': 28,
};

let poRowCounter = 0;
let poTaxMode = 'intra'; // 'intra' = CGST+SGST, 'inter' = IGST

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader immediately, login screen takes over
    const loader = document.getElementById('app-loader');
    loader.style.display = 'none';
});

function updateDate() {
    const d = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    document.getElementById('current-date').textContent = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── GLOBAL EVENT LISTENERS ─────────────────────────────────
function initGlobalEventListeners() {
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('sdd-search')) {
            handleSearchDropdown(e.target);
        }
        if (e.target.closest('#po-items-tbody')) {
            recalcPOTotals();
        }
    });

    document.addEventListener('click', (e) => {
        const opt = e.target.closest('.sdd-option');
        if (opt) {
            handleSearchSelect(opt);
            return;
        }
        if (!e.target.closest('.sdd-wrap')) {
            document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
        }
    });

    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('sdd-search')) {
            handleSearchDropdown(e.target);
        }
    });

    // Close fixed dropdowns on scroll inside modal
    document.addEventListener('scroll', () => {
        document.querySelectorAll('.sdd-list.open').forEach(l => l.classList.remove('open'));
    }, true);
}

function handleSearchDropdown(input) {
    const wrap = input.closest('.sdd-wrap');
    const list = wrap.querySelector('.sdd-list');
    const query = input.value.toLowerCase().trim();
    const type = input.dataset.sddType;

    document.querySelectorAll('.sdd-list.open').forEach(l => {
        if (l !== list) l.classList.remove('open');
    });

    let html = '';
    if (type === 'item') {
        const filtered = APP_DATA.items.filter(i =>
            i.name.toLowerCase().includes(query) ||
            i.id.toLowerCase().includes(query) ||
            i.hsn.includes(query)
        );
        html = filtered.length === 0
            ? '<div class="sdd-empty">No items found</div>'
            : filtered.map(i => `
                <div class="sdd-option" data-id="${i.id}" data-name="${i.name}" data-hsn="${i.hsn}" data-unit="${i.unit}" data-rate="${i.listPrice}" data-category="${i.category}">
                    <div class="font-medium">${i.name}</div>
                    <div class="sdd-sub">HSN: ${i.hsn} &bull; ${i.category} &bull; ${i.unit} &bull; &#8377;${i.listPrice}</div>
                </div>`).join('');
    } else if (type === 'vendor') {
        const filtered = APP_DATA.vendors.filter(v =>
            v.status === 'active' && (
                v.name.toLowerCase().includes(query) ||
                v.id.toLowerCase().includes(query)
            )
        );
        html = filtered.length === 0
            ? '<div class="sdd-empty">No vendors found</div>'
            : filtered.map(v => `
                <div class="sdd-option" data-id="${v.id}" data-name="${v.name}" data-state="${v.state}">
                    <div class="font-medium">${v.name}</div>
                    <div class="sdd-sub">${v.category} &bull; ${v.state}</div>
                </div>`).join('');
    } else if (type === 'site') {
        const filtered = APP_DATA.sites.filter(s =>
            s.status === 'active' && (
                s.name.toLowerCase().includes(query) ||
                s.id.toLowerCase().includes(query)
            )
        );
        html = filtered.length === 0
            ? '<div class="sdd-empty">No sites found</div>'
            : filtered.map(s => `
                <div class="sdd-option" data-id="${s.id}" data-name="${s.name}">
                    <div class="font-medium">${s.name}</div>
                    <div class="sdd-sub">${s.id} &bull; ${s.manager}</div>
                </div>`).join('');
    } else if (type === 'mi-item') {
        const catFilter = window._miCatFilter || '';
        const conCatFilter = window._miConCategories || null;
        const filtered = APP_DATA.items.filter(i =>
            (!catFilter || i.category === catFilter) &&
            (!conCatFilter || conCatFilter.includes(i.category)) && (
                i.name.toLowerCase().includes(query) ||
                i.id.toLowerCase().includes(query) ||
                i.hsn.includes(query)
            )
        );
        html = filtered.length === 0
            ? '<div class="sdd-empty">No items found</div>'
            : filtered.map(i => {
                const inv = APP_DATA.inventory.find(inv => inv.itemId === i.id);
                const avail = inv ? (inv.inStock - inv.reserved) : 0;
                return `
                <div class="sdd-option" data-id="${i.id}" data-name="${i.name}" data-unit="${i.unit}" data-avail="${avail}">
                    <div class="font-medium">${i.name}</div>
                    <div class="sdd-sub">${i.category} &bull; ${i.unit} &bull; Avail: ${avail}</div>
                </div>`;
            }).join('');
    } else if (type === 'contractor') {
        const filtered = APP_DATA.contractors.filter(c =>
            c.status === 'active' && (
                c.name.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query) ||
                c.contact.toLowerCase().includes(query)
            )
        );
        html = filtered.length === 0
            ? '<div class="sdd-empty">No contractors found</div>'
            : filtered.map(c => {
                const siteCt = c.sites.length;
                return `
                <div class="sdd-option" data-id="${c.id}" data-name="${c.name}" data-categories="${c.categories.join(',')}">
                    <div class="font-medium">${c.name}</div>
                    <div class="sdd-sub">${c.contact} &bull; ${siteCt} site${siteCt > 1 ? 's' : ''} &bull; ${c.categories.join(', ')}</div>
                </div>`;
            }).join('');
    }

    list.innerHTML = html;
    list.classList.add('open');

    // Position fixed dropdown below the input
    const rect = input.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listH = Math.min(200, list.scrollHeight || 200);
    list.style.width = rect.width + 'px';
    list.style.left = rect.left + 'px';
    if (spaceBelow < listH && rect.top > listH) {
        // Open upward
        list.style.top = 'auto';
        list.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    } else {
        // Open downward
        list.style.top = (rect.bottom + 4) + 'px';
        list.style.bottom = 'auto';
    }
}

function handleSearchSelect(option) {
    const list = option.closest('.sdd-list');
    const wrap = option.closest('.sdd-wrap');
    const input = wrap.querySelector('.sdd-search');
    const hiddenId = wrap.querySelector('.sdd-value');
    const type = input.dataset.sddType;

    input.value = option.dataset.name;
    if (hiddenId) hiddenId.value = option.dataset.id;
    list.classList.remove('open');

    if (type === 'item') {
        const row = input.closest('tr');
        if (row) {
            const hsnInput = row.querySelector('.po-hsn');
            const unitSelect = row.querySelector('.po-unit');
            const rateInput = row.querySelector('.po-rate');
            if (hsnInput) hsnInput.value = option.dataset.hsn;
            if (unitSelect) {
                const unitVal = option.dataset.unit;
                const opt2 = unitSelect.querySelector(`option[value="${unitVal}"]`);
                if (opt2) unitSelect.value = unitVal;
            }
            if (rateInput) rateInput.value = option.dataset.rate;
            const gstRate = HSN_GST_MAP[option.dataset.hsn] || 18;
            if (poTaxMode === 'intra') {
                const cgst = row.querySelector('.po-cgst');
                const sgst = row.querySelector('.po-sgst');
                if (cgst) cgst.value = (gstRate / 2);
                if (sgst) sgst.value = (gstRate / 2);
            } else {
                const igst = row.querySelector('.po-igst');
                if (igst) igst.value = gstRate;
            }
            recalcPOTotals();
        }
    } else if (type === 'site') {
        // site selected – nothing extra needed
    } else if (type === 'contractor') {
        // When contractor selected in MI modal, filter items by contractor's categories
        const cats = option.dataset.categories ? option.dataset.categories.split(',') : [];
        window._miConCategories = cats.length > 0 ? cats : null;
        // Update category filter dropdown to only show contractor's categories
        const catFilterEl = document.getElementById('mi-cat-filter');
        if (catFilterEl) {
            catFilterEl.innerHTML = '<option value="">All Categories</option>' +
                cats.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    } else if (type === 'mi-item') {
        const row = input.closest('tr');
        if (row) {
            const availCell = row.querySelector('.mi-avail-cell');
            if (availCell) availCell.textContent = option.dataset.avail;
            const unitSelect = row.querySelector('.mi-unit');
            if (unitSelect) {
                const unitVal = option.dataset.unit;
                const opt2 = unitSelect.querySelector(`option[value="${unitVal}"]`);
                if (opt2) unitSelect.value = unitVal;
            }
        }
    } else if (type === 'vendor') {
        const vendorState = option.dataset.state;
        const companyState = APP_DATA.companyInfo.state;
        const newMode = vendorState === companyState ? 'intra' : 'inter';
        if (newMode !== poTaxMode) {
            poTaxMode = newMode;
            rebuildPOItemsTable();
        }
        // Show tax mode indicator
        const indicator = document.getElementById('po-tax-indicator');
        if (indicator) {
            if (newMode === 'intra') {
                indicator.innerHTML = '<span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Same State &rarr; CGST + SGST</span>';
            } else {
                indicator.innerHTML = '<span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Inter-State &rarr; IGST</span>';
            }
        }
    }
}

// ─── SIDEBAR / NAVIGATION ───────────────────────────────────
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('-translate-x-full');
    ov.classList.toggle('hidden');
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`[data-page="${page}"]`);
    if (active) active.classList.add('active');

    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('lg:translate-x-0') && !sb.classList.contains('-translate-x-full')) {
        // desktop
    } else if (!sb.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }

    const titles = {
        'dashboard': ['Dashboard', 'Overview of your goods management'],
        'categories': ['Categories', 'Manage item categories'],
        'items-master': ['Items & HSN', 'Item master with HSN/SAC codes'],
        'warehouses': ['Warehouses', 'Manage warehouse locations'],
        'units': ['Units of Measure', 'Manage measurement units'],
        'contractors': ['Contractors', 'Manage site contractors & assignments'],
        'vendors': ['Vendors', 'Manage your 500+ vendor network'],
        'purchase-orders': ['Purchase Orders', 'Track all purchase orders & quotations'],
        'goods-receipt': ['Goods Receipt (GRN)', 'Receive & verify goods against purchase orders'],
        'inventory': ['Inventory', 'Real-time stock levels across warehouses'],
        'sites': ['Sites', 'Manage your 45 active project sites'],
        'material-issue': ['Material Issue', 'Track goods issued to sites'],
        'reports': ['Reports & Analytics', 'Coming in Phase 2'],
        'settings': ['Settings', 'System configuration & user management'],
    };
    const [t, s] = titles[page] || ['', ''];
    document.getElementById('page-title').textContent = t;
    document.getElementById('page-subtitle').textContent = s;

    destroyCharts();
    const main = document.getElementById('main-content');
    main.innerHTML = getPageContent(page);
    if (page === 'dashboard') {
        animateCounters();
    }
}

function getPageContent(page) {
    switch(page) {
        case 'dashboard': return renderDashboard();
        case 'categories': return renderCategories();
        case 'items-master': return renderItemsMaster();
        case 'warehouses': return renderWarehouses();
        case 'units': return renderUnits();
        case 'contractors': return renderContractors();
        case 'vendors': return renderVendors();
        case 'purchase-orders': return renderPurchaseOrders();
        case 'goods-receipt': return renderGoodsReceipt();
        case 'inventory': return renderInventory();
        case 'sites': return renderSites();
        case 'material-issue': return renderMaterialIssue();
        case 'reports': return renderPhase2('Reports & Analytics', 'Advanced reports including PO vs GRN reconciliation, vendor performance, GST reports, and inventory valuation.', 'purple');
        case 'settings': return renderSettings();
        default: return '<p class="text-surface-400">Page not found</p>';
    }
}

// ─── UTILITIES ──────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtNum(n) { return Number(n).toLocaleString('en-IN'); }

function statusBadge(status) {
    const map = {
        'draft': 'bg-surface-100 text-surface-600',
        'approved': 'bg-blue-50 text-blue-700',
        'partially-received': 'bg-amber-50 text-amber-700',
        'fully-received': 'bg-green-50 text-green-700',
        'closed': 'bg-surface-100 text-surface-500',
        'active': 'bg-green-50 text-green-700',
        'inactive': 'bg-red-50 text-red-600',
        'completed': 'bg-blue-50 text-blue-700',
        'issued': 'bg-green-50 text-green-700',
        'pending': 'bg-amber-50 text-amber-700',
    };
    const cls = map[status] || 'bg-surface-100 text-surface-600';
    return `<span class="px-2.5 py-1 rounded-full text-xs font-medium ${cls}">${status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`;
}

function formatDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const icon = type === 'success'
        ? '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
        : '<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    const toast = document.createElement('div');
    toast.className = 'bg-white rounded-xl shadow-lg border border-surface-100 px-4 py-3 flex items-center gap-3 animate-slide-in max-w-sm';
    toast.innerHTML = `${icon}<p class="text-sm font-medium text-surface-700">${msg}</p>`;
    c.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function openModal(content) {
    const mc = document.getElementById('modal-container');
    document.getElementById('modal-content').innerHTML = content;
    mc.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

// ─── FORM HELPERS ────────────────────────────────────────────
function formField(label, type, id, placeholder) {
    return `<div>
        <label class="block text-xs font-medium text-surface-600 mb-1.5">${label}</label>
        <input type="${type}" id="${id}" placeholder="${placeholder}" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition">
    </div>`;
}

function formSelect(label, id, options) {
    return `<div>
        <label class="block text-xs font-medium text-surface-600 mb-1.5">${label}</label>
        <select id="${id}" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition">
            <option value="">Select ${label}</option>
            ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
    </div>`;
}

// ─── PHASE 2 PLACEHOLDER ────────────────────────────────────
function renderPhase2(title, desc, color) {
    const colors = {
        amber: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-100' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-100' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100' },
    };
    const c = colors[color] || colors.amber;
    return `
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 phase2-placeholder">
        <div class="phase2-icon ${c.bg} ${c.border} border">
            <svg class="w-10 h-10 ${c.icon}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
        </div>
        <h3 class="text-xl font-bold text-surface-800 mb-2">${title}</h3>
        <p class="text-sm text-surface-400 max-w-md mb-6">${desc}</p>
        <div class="flex items-center gap-2 bg-surface-50 px-4 py-2 rounded-full">
            <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
            <span class="text-xs font-medium text-surface-500">Planned for Phase 2</span>
        </div>
    </div>`;
}

// ================================================================
//  PAGE: DASHBOARD
// ================================================================
function renderDashboard() {
    const k = APP_DATA.kpis;
    const spendChange = ((k.thisMonthSpend - k.lastMonthSpend) / k.lastMonthSpend * 100).toFixed(1);
    return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        ${kpiCard('Total Vendors', fmtNum(k.totalVendors), `${k.activeVendors} active`, 'blue',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>')}
        ${kpiCard('Purchase Orders', fmtNum(k.totalPOs), `${k.pendingPOs} pending`, 'purple',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>')}
        ${kpiCard('Active Sites', fmtNum(k.activeSites), `${k.totalSites} total`, 'green',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>')}
        ${kpiCard('This Month Spend', fmt(k.thisMonthSpend), `${spendChange > 0 ? '+' : ''}${spendChange}% vs last month`, 'amber',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>')}
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        ${kpiCard('Inventory Value', fmt(k.totalInventoryValue), `${k.lowStockItems} low stock alerts`, 'cyan',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>')}
        ${kpiCard('GRNs Recorded', fmtNum(k.totalGRNs), `${k.pendingDeliveries} pending deliveries`, 'rose',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>')}
        ${kpiCard('Low Stock Items', k.lowStockItems, 'Needs reorder', 'red',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>')}
        ${kpiCard('Pending POs', k.pendingPOs, 'Awaiting delivery', 'orange',
            '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>')}
    </div>`;
}

function kpiCard(title, value, sub, color, icon) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        rose: 'bg-rose-50 text-rose-600',
        red: 'bg-red-50 text-red-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    // Extract raw number for counter animation
    const rawNum = String(value).replace(/[^0-9.]/g, '');
    const prefix = String(value).match(/^[^0-9]*/)?.[0] || '';
    const suffix = String(value).match(/[^0-9.]*$/)?.[0] || '';
    return `
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 iso-card">
        <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center iso-icon-sm">${icon}</div>
        </div>
        <p class="text-2xl font-bold text-surface-800 kpi-counter" data-target="${rawNum}" data-prefix="${prefix}" data-suffix="${suffix}">0</p>
        <p class="text-xs text-surface-400 mt-1">${title}</p>
        <p class="text-[11px] text-surface-300 mt-0.5">${sub}</p>
    </div>`;
}

// ─── Counter Animation ──────────────────────────────────────
function animateCounters() {
    const counters = document.querySelectorAll('.kpi-counter');
    counters.forEach(el => {
        const target = parseFloat(el.dataset.target) || 0;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const startTime = performance.now();
        const isInteger = Number.isInteger(target);

        function formatIndian(n) {
            return n.toLocaleString('en-IN');
        }

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo for a snappy feel
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = target * ease;
            el.textContent = prefix + formatIndian(isInteger ? Math.round(current) : parseFloat(current.toFixed(1))) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

// ================================================================
//  PAGE: CATEGORIES MASTER
// ================================================================
function renderCategories() {
    const cats = APP_DATA.categories;
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <p class="text-sm text-surface-500">${cats.length} categories</p>
        ${isBossUser() ? '' : `<button onclick="openAddCategoryModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Category
        </button>`}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${cats.map(cat => {
            const colors = {
                'Housekeeping': 'bg-cyan-50 text-cyan-600 border-cyan-100',
                'Construction': 'bg-amber-50 text-amber-600 border-amber-100',
                'Electrical': 'bg-yellow-50 text-yellow-600 border-yellow-100',
                'Plumbing': 'bg-blue-50 text-blue-600 border-blue-100',
                'Paints': 'bg-rose-50 text-rose-600 border-rose-100',
                'Security': 'bg-red-50 text-red-600 border-red-100',
                'Gardening': 'bg-green-50 text-green-600 border-green-100',
            };
            const clr = colors[cat.name] || 'bg-surface-50 text-surface-600 border-surface-100';
            return `
            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5 iso-card">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl ${clr} border flex items-center justify-center">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    </div>
                    ${statusBadge(cat.status)}
                </div>
                <h3 class="font-semibold text-surface-800 mb-1">${cat.name}</h3>
                <p class="text-xs text-surface-400 mb-3">${cat.description}</p>
                <div class="flex items-center justify-between pt-3 border-t border-surface-100">
                    <span class="text-sm font-medium">${cat.itemCount} items</span>
                    <span class="text-xs text-surface-400">${cat.id}</span>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function openAddCategoryModal() {
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Category</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="space-y-4">
                ${formField('Category Name', 'text', 'cat-name', 'e.g. Housekeeping')}
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Description</label>
                    <textarea id="cat-desc" rows="3" placeholder="Brief description of this category" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none"></textarea>
                </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveCategory()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Category</button>
            </div>
        </div>
    `);
}

function saveCategory() {
    const name = document.getElementById('cat-name').value.trim();
    const desc = document.getElementById('cat-desc').value.trim();
    if (!name) { showToast('Please enter category name', 'info'); return; }
    const newId = 'CAT' + String(APP_DATA.categories.length + 1).padStart(3, '0');
    APP_DATA.categories.push({ id: newId, name, description: desc, itemCount: 0, status: 'active' });
    closeModal();
    showToast('Category added successfully!');
    navigateTo('categories');
}

// ================================================================
//  PAGE: ITEMS & HSN MASTER
// ================================================================
function renderItemsMaster() {
    const items = APP_DATA.items;
    const categories = [...new Set(items.map(i => i.category))];
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-3 flex-wrap">
            <p class="text-sm text-surface-500">${items.length} items</p>
            <select id="items-cat-filter" onchange="filterItemsMaster()" class="border border-surface-200 rounded-lg px-2 py-1 text-sm">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <input type="text" id="items-search" oninput="filterItemsMaster()" placeholder="Search items..." class="border border-surface-200 rounded-lg px-3 py-1 text-sm w-48">
        </div>
        ${isBossUser() ? '' : `<button onclick="openAddItemModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Item
        </button>`}
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Item ID</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Name</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">HSN/SAC</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Category</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Unit</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase">List Price</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">GST %</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Reorder Lvl</th>
                    </tr>
                </thead>
                <tbody id="items-master-tbody" class="divide-y divide-surface-50">
                    ${renderItemsMasterRows(items)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderItemsMasterRows(items) {
    return items.map(item => {
        const gst = HSN_GST_MAP[item.hsn] || 0;
        return `
        <tr class="hover:bg-surface-50/50 transition">
            <td class="py-3 px-4 font-mono text-xs text-surface-400">${item.id}</td>
            <td class="py-3 px-4 font-medium text-surface-800">${item.name}</td>
            <td class="py-3 px-4 font-mono text-sm">${item.hsn}</td>
            <td class="py-3 px-4 hidden md:table-cell"><span class="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md text-xs">${item.category}</span></td>
            <td class="py-3 px-4 hidden md:table-cell text-surface-500">${item.unit}</td>
            <td class="py-3 px-4 text-right font-medium">${fmt(item.listPrice)}</td>
            <td class="py-3 px-4 text-right hidden lg:table-cell">${gst}%</td>
            <td class="py-3 px-4 text-right hidden lg:table-cell">${item.reorderLevel}</td>
        </tr>`;
    }).join('');
}

function filterItemsMaster() {
    const catFilter = document.getElementById('items-cat-filter').value;
    const search = document.getElementById('items-search').value.toLowerCase().trim();
    let items = APP_DATA.items;
    if (catFilter) items = items.filter(i => i.category === catFilter);
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search) || i.hsn.includes(search) || i.id.toLowerCase().includes(search));
    document.getElementById('items-master-tbody').innerHTML = renderItemsMasterRows(items);
}

function openAddItemModal() {
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Item</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${formField('Item Name', 'text', 'new-item-name', 'e.g. Bathroom Cleaner 5LTR')}
                ${formField('HSN/SAC Code', 'text', 'new-item-hsn', 'e.g. 340290')}
                ${formSelect('Category', 'new-item-cat', APP_DATA.categories.filter(c=>c.status==='active').map(c=>c.name))}
                ${formSelect('Unit', 'new-item-unit', APP_DATA.units.filter(u=>u.status==='active').map(u=>u.name))}
                ${formField('List Price (₹)', 'number', 'new-item-price', 'e.g. 650')}
                ${formField('Reorder Level', 'number', 'new-item-reorder', 'e.g. 10')}
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveItem()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Item</button>
            </div>
        </div>
    `);
}

function saveItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const hsn = document.getElementById('new-item-hsn').value.trim();
    const cat = document.getElementById('new-item-cat').value;
    const unit = document.getElementById('new-item-unit').value;
    const price = parseFloat(document.getElementById('new-item-price').value) || 0;
    const reorder = parseInt(document.getElementById('new-item-reorder').value) || 0;
    if (!name || !hsn) { showToast('Please enter item name and HSN code', 'info'); return; }
    const newId = 'ITM' + String(APP_DATA.items.length + 1).padStart(3, '0');
    APP_DATA.items.push({ id: newId, name, hsn, unit: unit || 'Pcs', category: cat || 'Housekeeping', listPrice: price, reorderLevel: reorder });
    closeModal();
    showToast('Item added successfully!');
    navigateTo('items-master');
}

// ================================================================
//  PAGE: WAREHOUSES MASTER
// ================================================================
function renderWarehouses() {
    const wh = APP_DATA.warehouses;
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <p class="text-sm text-surface-500">${wh.length} warehouses</p>
        ${isBossUser() ? '' : `<button onclick="openAddWarehouseModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Warehouse
        </button>`}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${wh.map(w => `
        <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5 iso-card">
            <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
                </div>
                ${statusBadge(w.status)}
            </div>
            <h3 class="font-semibold text-surface-800 mb-1">${w.name}</h3>
            <p class="text-xs text-surface-400 mb-3">${w.location}</p>
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Manager</p>
                    <p class="text-sm font-medium">${w.manager}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Type</p>
                    <p class="text-sm font-medium">${w.type}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Capacity</p>
                    <p class="text-sm font-medium">${w.capacity}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Phone</p>
                    <p class="text-sm font-medium">${w.phone}</p>
                </div>
            </div>
        </div>`).join('')}
    </div>`;
}

function openAddWarehouseModal() {
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Warehouse</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${formField('Warehouse Name', 'text', 'wh-name', 'e.g. Warehouse D')}
                ${formField('Location', 'text', 'wh-location', 'e.g. Vashi, Navi Mumbai')}
                ${formField('Manager', 'text', 'wh-manager', 'e.g. Ramesh Kumar')}
                ${formField('Phone', 'text', 'wh-phone', 'e.g. 9876543210')}
                ${formSelect('Type', 'wh-type', ['Covered', 'Open Yard', 'Cold Storage', 'Container'])}
                ${formField('Capacity', 'text', 'wh-capacity', 'e.g. 5,000 sqft')}
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveWarehouse()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Warehouse</button>
            </div>
        </div>
    `);
}

function saveWarehouse() {
    const name = document.getElementById('wh-name').value.trim();
    const location = document.getElementById('wh-location').value.trim();
    if (!name) { showToast('Please enter warehouse name', 'info'); return; }
    const newId = 'WH' + String(APP_DATA.warehouses.length + 1).padStart(3, '0');
    APP_DATA.warehouses.push({
        id: newId, name, location,
        manager: document.getElementById('wh-manager').value.trim(),
        phone: document.getElementById('wh-phone').value.trim(),
        type: document.getElementById('wh-type').value || 'Covered',
        capacity: document.getElementById('wh-capacity').value.trim(),
        status: 'active'
    });
    closeModal();
    showToast('Warehouse added successfully!');
    navigateTo('warehouses');
}

// ================================================================
//  PAGE: UNITS MASTER
// ================================================================
function renderUnits() {
    const units = APP_DATA.units;
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <p class="text-sm text-surface-500">${units.length} units of measure</p>
        ${isBossUser() ? '' : `<button onclick="openAddUnitModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Unit
        </button>`}
    </div>
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Code</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Abbreviation</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Full Name</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-surface-50">
                    ${units.map(u => `
                    <tr class="hover:bg-surface-50/50 transition">
                        <td class="py-3 px-4 font-mono text-xs text-surface-400">${u.id}</td>
                        <td class="py-3 px-4 font-semibold text-surface-800">${u.name}</td>
                        <td class="py-3 px-4 text-surface-600">${u.fullName}</td>
                        <td class="py-3 px-4 text-center">${statusBadge(u.status)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

function openAddUnitModal() {
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Unit</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${formField('Abbreviation', 'text', 'unit-abbr', 'e.g. Pcs, Kg, Ltr')}
                ${formField('Full Name', 'text', 'unit-full', 'e.g. Pieces, Kilograms')}
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveUnit()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Unit</button>
            </div>
        </div>
    `);
}

function saveUnit() {
    const abbr = document.getElementById('unit-abbr').value.trim();
    const full = document.getElementById('unit-full').value.trim();
    if (!abbr) { showToast('Please enter unit abbreviation', 'info'); return; }
    const newId = 'U' + String(APP_DATA.units.length + 1).padStart(3, '0');
    APP_DATA.units.push({ id: newId, name: abbr, fullName: full || abbr, status: 'active' });
    closeModal();
    showToast('Unit added successfully!');
    navigateTo('units');
}

// ================================================================
//  PAGE: CONTRACTORS
// ================================================================
function renderContractors() {
    const contractors = APP_DATA.contractors;
    const allSites = APP_DATA.sites;
    const allCategories = APP_DATA.categories;
    const activeCons = contractors.filter(c => c.status === 'active').length;

    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-full">${contractors.length} Total</span>
            <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">${activeCons} Active</span>
        </div>
        ${isBossUser() ? '' : `<button onclick="openAddContractorModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Contractor
        </button>`}
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 flex items-center bg-surface-50 rounded-lg px-3 py-2">
                <svg class="w-4 h-4 text-surface-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" id="con-search" placeholder="Search contractor name, contact, phone..." class="bg-transparent text-sm outline-none w-full placeholder-surface-400" oninput="filterContractorList()">
            </div>
            <select id="con-filter-status" onchange="filterContractorList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            <select id="con-filter-site" onchange="filterContractorList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Sites</option>
                ${allSites.filter(s => s.status === 'active').map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
            <select id="con-filter-cat" onchange="filterContractorList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Categories</option>
                ${allCategories.filter(c => c.status === 'active').map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
        </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Contractor</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Contact</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Sites</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Categories</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody id="con-list-tbody" class="divide-y divide-surface-50">
                    ${renderContractorRows(contractors)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderContractorRows(contractors) {
    if (contractors.length === 0) return '<tr><td colspan="5" class="py-8 text-center text-surface-400 text-sm">No contractors found</td></tr>';
    const allSites = APP_DATA.sites;
    return contractors.map(con => {
        const siteNames = con.sites.map(sid => {
            const s = allSites.find(x => x.id === sid);
            return s ? s.name : sid;
        });
        return `
        <tr class="hover:bg-surface-50/50 transition cursor-pointer" onclick="viewContractorDetail('${con.id}')">
            <td class="py-3 px-4">
                <p class="font-medium text-surface-800">${con.name}</p>
                <p class="text-xs text-surface-400">${con.id}</p>
            </td>
            <td class="py-3 px-4 hidden md:table-cell">
                <p class="text-surface-700">${con.contact}</p>
                <p class="text-xs text-surface-400">${con.phone}</p>
            </td>
            <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1">
                    ${siteNames.map(s => `<span class="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">${s.length > 20 ? s.substring(0, 20) + '…' : s}</span>`).join('')}
                </div>
            </td>
            <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1">
                    ${con.categories.map(c => `<span class="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">${c}</span>`).join('')}
                </div>
            </td>
            <td class="py-3 px-4 text-center">${statusBadge(con.status)}</td>
        </tr>`;
    }).join('');
}

function filterContractorList() {
    const search = (document.getElementById('con-search')?.value || '').toLowerCase();
    const status = document.getElementById('con-filter-status')?.value || '';
    const siteFilter = document.getElementById('con-filter-site')?.value || '';
    const catFilter = document.getElementById('con-filter-cat')?.value || '';

    const filtered = APP_DATA.contractors.filter(con => {
        if (search && !(
            con.name.toLowerCase().includes(search) ||
            con.contact.toLowerCase().includes(search) ||
            con.phone.includes(search) ||
            con.id.toLowerCase().includes(search)
        )) return false;
        if (status && con.status !== status) return false;
        if (siteFilter && !con.sites.includes(siteFilter)) return false;
        if (catFilter && !con.categories.includes(catFilter)) return false;
        return true;
    });

    const tbody = document.getElementById('con-list-tbody');
    if (tbody) tbody.innerHTML = renderContractorRows(filtered);
}

function viewContractorDetail(id) {
    const con = APP_DATA.contractors.find(c => c.id === id);
    if (!con) return;
    const allSites = APP_DATA.sites;
    const siteNames = con.sites.map(sid => {
        const s = allSites.find(x => x.id === sid);
        return s ? s.name : sid;
    });
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold">${con.name}</h2>
                    <p class="text-sm text-surface-400">${con.id}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${statusBadge(con.status)}
                    <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600 ml-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span class="text-surface-400">Contact Person:</span> <span class="font-medium">${con.contact}</span></div>
                <div><span class="text-surface-400">Phone:</span> <span class="font-medium">${con.phone}</span></div>
                <div><span class="text-surface-400">Email:</span> <span class="font-medium">${con.email || '—'}</span></div>
                <div><span class="text-surface-400">Status:</span> <span class="font-medium capitalize">${con.status}</span></div>
            </div>
            <h3 class="text-sm font-semibold mb-2">Assigned Sites</h3>
            <div class="flex flex-wrap gap-2 mb-4">
                ${siteNames.map(s => `<span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">${s}</span>`).join('')}
            </div>
            <h3 class="text-sm font-semibold mb-2">Assigned Categories</h3>
            <div class="flex flex-wrap gap-2 mb-4">
                ${con.categories.map(c => `<span class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">${c}</span>`).join('')}
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Close</button>
                <button onclick="closeModal(); openEditContractorModal('${con.id}')" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Edit</button>
            </div>
        </div>
    `);
}

function openAddContractorModal() {
    const allSites = APP_DATA.sites.filter(s => s.status === 'active');
    const allCats = APP_DATA.categories.filter(c => c.status === 'active');
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Contractor</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="space-y-4">
                ${formField('Contractor Name', 'text', 'con-name', 'e.g. ABC Facility Services')}
                <div class="grid grid-cols-2 gap-4">
                    ${formField('Contact Person', 'text', 'con-contact', 'e.g. Ravi Sharma')}
                    ${formField('Phone', 'tel', 'con-phone', 'e.g. 9876543210')}
                </div>
                ${formField('Email', 'email', 'con-email', 'e.g. contact@company.com')}
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Assigned Sites</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-surface-200 rounded-xl p-3">
                        ${allSites.map(s => `
                        <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-50 rounded px-1 py-0.5">
                            <input type="checkbox" class="con-site-cb rounded" value="${s.id}">
                            <span class="truncate">${s.name}</span>
                        </label>`).join('')}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Assigned Categories</label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-surface-200 rounded-xl p-3">
                        ${allCats.map(c => `
                        <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-50 rounded px-1 py-0.5">
                            <input type="checkbox" class="con-cat-cb rounded" value="${c.name}">
                            <span>${c.name}</span>
                        </label>`).join('')}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Status</label>
                    <select id="con-status" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveContractor()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Contractor</button>
            </div>
        </div>
    `);
}

function openEditContractorModal(id) {
    const con = APP_DATA.contractors.find(c => c.id === id);
    if (!con) return;
    const allSites = APP_DATA.sites.filter(s => s.status === 'active');
    const allCats = APP_DATA.categories.filter(c => c.status === 'active');
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Edit Contractor</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <input type="hidden" id="con-edit-id" value="${con.id}">
            <div class="space-y-4">
                ${formField('Contractor Name', 'text', 'con-name', 'e.g. ABC Facility Services')}
                <div class="grid grid-cols-2 gap-4">
                    ${formField('Contact Person', 'text', 'con-contact', 'e.g. Ravi Sharma')}
                    ${formField('Phone', 'tel', 'con-phone', 'e.g. 9876543210')}
                </div>
                ${formField('Email', 'email', 'con-email', 'e.g. contact@company.com')}
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Assigned Sites</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-surface-200 rounded-xl p-3">
                        ${allSites.map(s => `
                        <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-50 rounded px-1 py-0.5">
                            <input type="checkbox" class="con-site-cb rounded" value="${s.id}" ${con.sites.includes(s.id) ? 'checked' : ''}>
                            <span class="truncate">${s.name}</span>
                        </label>`).join('')}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Assigned Categories</label>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-surface-200 rounded-xl p-3">
                        ${allCats.map(c => `
                        <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-surface-50 rounded px-1 py-0.5">
                            <input type="checkbox" class="con-cat-cb rounded" value="${c.name}" ${con.categories.includes(c.name) ? 'checked' : ''}>
                            <span>${c.name}</span>
                        </label>`).join('')}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Status</label>
                    <select id="con-status" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition">
                        <option value="active" ${con.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${con.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveContractor(true)" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Update Contractor</button>
            </div>
        </div>
    `);
    // Pre-fill values
    setTimeout(() => {
        document.getElementById('con-name').value = con.name;
        document.getElementById('con-contact').value = con.contact;
        document.getElementById('con-phone').value = con.phone;
        document.getElementById('con-email').value = con.email || '';
    }, 50);
}

function saveContractor(isEdit = false) {
    const name = document.getElementById('con-name')?.value?.trim();
    const contact = document.getElementById('con-contact')?.value?.trim();
    const phone = document.getElementById('con-phone')?.value?.trim();
    const email = document.getElementById('con-email')?.value?.trim();
    const status = document.getElementById('con-status')?.value || 'active';
    const sites = [...document.querySelectorAll('.con-site-cb:checked')].map(cb => cb.value);
    const categories = [...document.querySelectorAll('.con-cat-cb:checked')].map(cb => cb.value);

    if (!name) { showToast('Please enter contractor name', 'info'); return; }
    if (!contact) { showToast('Please enter contact person', 'info'); return; }
    if (sites.length === 0) { showToast('Please select at least one site', 'info'); return; }
    if (categories.length === 0) { showToast('Please select at least one category', 'info'); return; }

    if (isEdit) {
        const editId = document.getElementById('con-edit-id')?.value;
        const con = APP_DATA.contractors.find(c => c.id === editId);
        if (con) {
            con.name = name;
            con.contact = contact;
            con.phone = phone;
            con.email = email;
            con.status = status;
            con.sites = sites;
            con.categories = categories;
        }
        closeModal();
        showToast('Contractor updated successfully!');
    } else {
        const num = APP_DATA.contractors.length + 1;
        APP_DATA.contractors.push({
            id: `CON${String(num).padStart(3, '0')}`,
            name, contact, phone, email, sites, categories, status
        });
        closeModal();
        showToast('Contractor added successfully!');
    }
    navigateTo('contractors');
}

// ================================================================
//  PAGE: VENDORS
// ================================================================
function renderVendors() {
    const vendors = APP_DATA.vendors;
    const active = vendors.filter(v => v.status === 'active').length;
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-3">
            <p class="text-sm text-surface-500">${vendors.length} vendors &bull; ${active} active</p>
        </div>
        ${isBossUser() ? '' : `<button onclick="openAddVendorModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Vendor
        </button>`}
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Vendor</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Category</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">GSTIN</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">State</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Orders</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Total Value</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-surface-50">
                    ${vendors.map(v => `
                    <tr class="hover:bg-surface-50/50 transition cursor-pointer" onclick="viewVendorDetail('${v.id}')">
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-3">
                                <div class="w-9 h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0">${v.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>
                                <div>
                                    <p class="font-medium text-surface-800">${v.name}</p>
                                    <p class="text-xs text-surface-400">${v.contact} &bull; ${v.phone}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-3 px-4 hidden md:table-cell"><span class="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md text-xs">${v.category}</span></td>
                        <td class="py-3 px-4 hidden lg:table-cell font-mono text-xs">${v.gstin}</td>
                        <td class="py-3 px-4 hidden md:table-cell text-xs text-surface-500">${v.state}</td>
                        <td class="py-3 px-4 text-right hidden lg:table-cell">${v.totalOrders}</td>
                        <td class="py-3 px-4 text-right font-medium">${fmt(v.totalValue)}</td>
                        <td class="py-3 px-4 text-center">${statusBadge(v.status)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
}

function viewVendorDetail(id) {
    const v = APP_DATA.vendors.find(x => x.id === id);
    if (!v) return;
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-lg font-bold">${v.name.split(' ').map(w=>w[0]).join('').substring(0,2)}</div>
                    <div>
                        <h2 class="text-lg font-semibold">${v.name}</h2>
                        <p class="text-sm text-surface-400">${v.id} &bull; ${v.category}</p>
                    </div>
                </div>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">Contact</p><p class="text-sm font-medium">${v.contact}</p></div>
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">Phone</p><p class="text-sm font-medium">${v.phone}</p></div>
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">Email</p><p class="text-sm font-medium text-xs">${v.email}</p></div>
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">GSTIN</p><p class="text-sm font-medium font-mono">${v.gstin}</p></div>
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">PAN</p><p class="text-sm font-medium font-mono">${v.pan}</p></div>
                <div class="bg-surface-50 rounded-xl p-3"><p class="text-xs text-surface-400">State</p><p class="text-sm font-medium">${v.state}</p></div>
            </div>
            <div class="bg-surface-50 rounded-xl p-3 mb-4">
                <p class="text-xs text-surface-400">Address</p>
                <p class="text-sm">${v.address}</p>
            </div>
            <div class="bg-surface-50 rounded-xl p-3 mb-4">
                <p class="text-xs text-surface-400 mb-1">Bank Details</p>
                <p class="text-sm">${v.bankName} — ${v.bankBranch}</p>
                <p class="text-xs font-mono text-surface-500">A/C: ${v.bankAc} &bull; IFSC: ${v.bankIfsc}</p>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <div class="text-center bg-blue-50 rounded-xl p-3"><p class="text-xl font-bold text-blue-700">${v.totalOrders}</p><p class="text-xs text-blue-600">Orders</p></div>
                <div class="text-center bg-green-50 rounded-xl p-3"><p class="text-xl font-bold text-green-700">${fmt(v.totalValue)}</p><p class="text-xs text-green-600">Total Value</p></div>
                <div class="text-center bg-amber-50 rounded-xl p-3"><p class="text-xl font-bold text-amber-700">${v.rating}</p><p class="text-xs text-amber-600">Rating</p></div>
            </div>
        </div>
    `);
}

function openAddVendorModal() {
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Add Vendor</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${formField('Vendor Name', 'text', 'v-name', 'Company name')}
                ${formField('Contact Person', 'text', 'v-contact', 'Mr./Mrs. Name')}
                ${formField('Phone', 'text', 'v-phone', '9876543210')}
                ${formField('Email', 'email', 'v-email', 'vendor@email.com')}
                ${formField('GSTIN', 'text', 'v-gstin', '27XXXXXXXXXXXZX')}
                ${formField('PAN', 'text', 'v-pan', 'XXXXX0000X')}
                ${formSelect('Category', 'v-category', APP_DATA.categories.filter(c=>c.status==='active').map(c=>c.name))}
                ${formSelect('State', 'v-state', ['Maharashtra','Karnataka','Gujarat','Tamil Nadu','Delhi','Rajasthan','Uttar Pradesh','West Bengal','Kerala','Telangana'])}
            </div>
            <div class="mt-4">${formField('Address', 'text', 'v-address', 'Full address')}</div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveVendor()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Save Vendor</button>
            </div>
        </div>
    `);
}

function saveVendor() {
    const name = document.getElementById('v-name').value.trim();
    if (!name) { showToast('Please enter vendor name', 'info'); return; }
    const newId = 'V' + String(APP_DATA.vendors.length + 1).padStart(3, '0');
    APP_DATA.vendors.push({
        id: newId, name,
        contact: document.getElementById('v-contact').value.trim(),
        phone: document.getElementById('v-phone').value.trim(),
        email: document.getElementById('v-email').value.trim(),
        gstin: document.getElementById('v-gstin').value.trim(),
        pan: document.getElementById('v-pan').value.trim(),
        address: document.getElementById('v-address').value.trim(),
        category: document.getElementById('v-category').value || 'Housekeeping',
        state: document.getElementById('v-state').value || 'Maharashtra',
        rating: 0, status: 'active',
        bankName: '', bankBranch: '', bankAc: '', bankIfsc: '',
        totalOrders: 0, totalValue: 0
    });
    closeModal();
    showToast('Vendor added successfully!');
    navigateTo('vendors');
}

// ================================================================
//  PAGE: PURCHASE ORDERS
// ================================================================
function renderPurchaseOrders() {
    const pos = APP_DATA.purchaseOrders;
    const statusCounts = { draft: 0, approved: 0, 'partially-received': 0, 'fully-received': 0 };
    pos.forEach(p => { if (statusCounts[p.status] !== undefined) statusCounts[p.status]++; });
    const vendors = [...new Set(pos.map(p => p.vendorName))];

    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-full">${pos.length} Total</span>
            <span class="text-xs bg-surface-100 text-surface-500 px-2 py-1 rounded-full">${statusCounts.draft} Draft</span>
            <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">${statusCounts.approved} Approved</span>
            <span class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">${statusCounts['partially-received']} Partial</span>
            <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">${statusCounts['fully-received']} Complete</span>
        </div>
        ${isBossUser() ? '' : `<button onclick="openCreatePOModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Create PO
        </button>`}
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 flex items-center bg-surface-50 rounded-lg px-3 py-2">
                <svg class="w-4 h-4 text-surface-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" id="po-search" placeholder="Search PO number, vendor, quotation..." class="bg-transparent text-sm outline-none w-full placeholder-surface-400" oninput="filterPOList()">
            </div>
            <select id="po-filter-status" onchange="filterPOList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="partially-received">Partially Received</option>
                <option value="fully-received">Fully Received</option>
            </select>
            <select id="po-filter-vendor" onchange="filterPOList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Vendors</option>
                ${vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
            <input type="date" id="po-filter-from" onchange="filterPOList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="From date">
            <input type="date" id="po-filter-to" onchange="filterPOList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="To date">
        </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">PO Number</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Vendor</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Date</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Items</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Amount</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Receipt</th>
                    </tr>
                </thead>
                <tbody id="po-list-tbody" class="divide-y divide-surface-50">
                    ${renderPORows(pos)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderPORows(pos) {
    if (pos.length === 0) return '<tr><td colspan="7" class="py-8 text-center text-surface-400 text-sm">No purchase orders found</td></tr>';
    return pos.map(po => {
        const pct = Math.round(po.receivedQty / po.totalQty * 100);
        return `
        <tr class="hover:bg-surface-50/50 transition cursor-pointer" onclick="viewPODetail('${po.id}')">
            <td class="py-3 px-4">
                <p class="font-medium text-primary-600">${po.id}</p>
                <p class="text-xs text-surface-400">Quot: ${po.quotationNo}</p>
            </td>
            <td class="py-3 px-4">
                <p class="font-medium">${po.vendorName}</p>
                <p class="text-xs text-surface-400">${po.paymentTerms}</p>
            </td>
            <td class="py-3 px-4 hidden md:table-cell text-surface-500">${formatDate(po.date)}</td>
            <td class="py-3 px-4 text-right hidden md:table-cell">${po.items.length} items</td>
            <td class="py-3 px-4 text-right font-semibold">${fmt(po.totalAmount)}</td>
            <td class="py-3 px-4 text-center">${statusBadge(po.status)}</td>
            <td class="py-3 px-4 hidden lg:table-cell">
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
                    </div>
                    <span class="text-xs text-surface-500 w-8">${pct}%</span>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function filterPOList() {
    const search = (document.getElementById('po-search')?.value || '').toLowerCase();
    const status = document.getElementById('po-filter-status')?.value || '';
    const vendor = document.getElementById('po-filter-vendor')?.value || '';
    const from = document.getElementById('po-filter-from')?.value || '';
    const to = document.getElementById('po-filter-to')?.value || '';

    const filtered = APP_DATA.purchaseOrders.filter(po => {
        if (search && !(
            po.id.toLowerCase().includes(search) ||
            po.vendorName.toLowerCase().includes(search) ||
            po.quotationNo.toLowerCase().includes(search)
        )) return false;
        if (status && po.status !== status) return false;
        if (vendor && po.vendorName !== vendor) return false;
        if (from && po.date < from) return false;
        if (to && po.date > to) return false;
        return true;
    });

    const tbody = document.getElementById('po-list-tbody');
    if (tbody) tbody.innerHTML = renderPORows(filtered);
}

function viewPODetail(id) {
    const po = APP_DATA.purchaseOrders.find(p => p.id === id);
    if (!po) return;
    const vendor = APP_DATA.vendors.find(v => v.id === po.vendorId);

    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold">${po.id}</h2>
                    <p class="text-sm text-surface-400">Quotation No: ${po.quotationNo}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${statusBadge(po.status)}
                    <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600 ml-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div><p class="text-xs text-surface-400">Vendor</p><p class="font-medium">${po.vendorName}</p></div>
                <div><p class="text-xs text-surface-400">PO Date</p><p class="font-medium">${formatDate(po.date)}</p></div>
                <div><p class="text-xs text-surface-400">Delivery Date</p><p class="font-medium">${formatDate(po.deliveryDate)}</p></div>
                <div><p class="text-xs text-surface-400">GSTIN</p><p class="font-medium font-mono">${vendor?.gstin || 'N/A'}</p></div>
            </div>

            <div class="overflow-x-auto mb-4">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="bg-surface-100">
                            <th class="py-2 px-2 text-left">S.N.</th>
                            <th class="py-2 px-2 text-left">Description of Goods</th>
                            <th class="py-2 px-2 text-left">HSN/SAC</th>
                            <th class="py-2 px-2 text-right">Qty</th>
                            <th class="py-2 px-2">Unit</th>
                            <th class="py-2 px-2 text-right">Rate</th>
                            <th class="py-2 px-2 text-right">Disc%</th>
                            <th class="py-2 px-2 text-right">CGST%</th>
                            <th class="py-2 px-2 text-right">SGST%</th>
                            <th class="py-2 px-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-surface-50">
                        ${po.items.map((item, i) => {
                            const base = item.qty * item.rate * (1 - item.disc/100);
                            const cgst = base * item.cgstRate/100;
                            const sgst = base * item.sgstRate/100;
                            const total = base + cgst + sgst;
                            return `
                            <tr class="hover:bg-surface-50">
                                <td class="py-2 px-2">${i+1}</td>
                                <td class="py-2 px-2 font-medium">${item.name}</td>
                                <td class="py-2 px-2 font-mono">${item.hsn}</td>
                                <td class="py-2 px-2 text-right">${item.qty}</td>
                                <td class="py-2 px-2">${item.unit}</td>
                                <td class="py-2 px-2 text-right">${fmt(item.rate)}</td>
                                <td class="py-2 px-2 text-right">${item.disc}%</td>
                                <td class="py-2 px-2 text-right">${item.cgstRate}%</td>
                                <td class="py-2 px-2 text-right">${item.sgstRate}%</td>
                                <td class="py-2 px-2 text-right font-medium">${fmt(total.toFixed(2))}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="bg-surface-100 font-semibold">
                            <td colspan="3" class="py-2 px-2">Grand Total</td>
                            <td class="py-2 px-2 text-right">${fmtNum(po.totalQty)}</td>
                            <td colspan="5"></td>
                            <td class="py-2 px-2 text-right">${fmt(po.totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="bg-surface-50 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium">Receipt Progress</p>
                    <p class="text-sm font-bold">${po.receivedQty} / ${po.totalQty}</p>
                </div>
                <div class="w-full bg-surface-200 rounded-full h-3 overflow-hidden">
                    <div class="h-full rounded-full ${po.receivedQty >= po.totalQty ? 'bg-green-500' : 'bg-primary-500'} transition-all" style="width:${Math.min(100, Math.round(po.receivedQty/po.totalQty*100))}%"></div>
                </div>
            </div>
        </div>
    `);
}

// ─── CREATE PO MODAL (with searchable items, working add-item, GST logic) ───
function openCreatePOModal() {
    poRowCounter = 0;
    poTaxMode = 'intra';
    const unitOptions = APP_DATA.units.filter(u => u.status === 'active').map(u => `<option value="${u.name}">${u.name}</option>`).join('');

    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Create Purchase Order</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Searchable Vendor -->
                <div>
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Vendor</label>
                    <div class="sdd-wrap">
                        <input type="text" class="sdd-search sdd-input" data-sdd-type="vendor" placeholder="Search vendor..." autocomplete="off">
                        <input type="hidden" class="sdd-value" id="po-vendor-id">
                        <div class="sdd-list"></div>
                    </div>
                </div>
                ${formField('Quotation No', 'text', 'po-quotation', 'Enter quotation number')}
                ${formField('PO Date', 'date', 'po-date', '')}
                ${formField('Expected Delivery', 'date', 'po-delivery', '')}
                ${formSelect('Payment Terms', 'po-payment', ['Cash','Net 15','Net 30','Net 45','Net 60'])}
                <div class="flex items-end">
                    <div id="po-tax-indicator">
                        <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">Same State &rarr; CGST + SGST</span>
                    </div>
                </div>
            </div>

            <h3 class="text-sm font-semibold mb-3">Line Items</h3>
            <div class="overflow-visible mb-3">
                <table class="w-full text-sm" id="po-items-table">
                    <thead>
                        <tr class="bg-surface-50 text-xs" id="po-items-thead">
                            ${getPOTableHeaders()}
                        </tr>
                    </thead>
                    <tbody id="po-items-tbody">
                    </tbody>
                    <tfoot>
                        <tr class="bg-surface-50 font-semibold text-xs">
                            <td colspan="3" class="py-2 px-2">TOTAL</td>
                            <td class="py-2 px-2 text-right" id="po-total-qty">0</td>
                            <td class="py-2 px-2"></td>
                            <td class="py-2 px-2"></td>
                            <td class="py-2 px-2"></td>
                            <td class="py-2 px-2 text-right tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}></td>
                            <td class="py-2 px-2 text-right tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}></td>
                            <td class="py-2 px-2 text-right tax-inter" ${poTaxMode !== 'inter' ? 'style="display:none"' : ''}></td>
                            <td class="py-2 px-2 text-right font-bold" id="po-total-amount">₹0</td>
                            <td class="py-2 px-2"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <button onclick="addPOItemRow()" class="text-primary-600 text-sm font-medium hover:text-primary-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Add Another Item
            </button>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="savePO('draft')" class="px-4 py-2 rounded-xl border border-primary-200 text-primary-600 text-sm font-medium hover:bg-primary-50 transition">Save Draft</button>
                <button onclick="savePO('approved')" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Create PO</button>
            </div>
        </div>
    `);

    // Add first row
    addPOItemRow();
}

function getPOTableHeaders() {
    return `
        <th class="py-2 px-2 text-left">Item</th>
        <th class="py-2 px-2 text-left">HSN</th>
        <th class="py-2 px-2 text-right">Qty</th>
        <th class="py-2 px-2">Unit</th>
        <th class="py-2 px-2 text-right">Rate</th>
        <th class="py-2 px-2 text-right">Disc%</th>
        <th class="py-2 px-2 text-right tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}>CGST%</th>
        <th class="py-2 px-2 text-right tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}>SGST%</th>
        <th class="py-2 px-2 text-right tax-inter" ${poTaxMode !== 'inter' ? 'style="display:none"' : ''}>IGST%</th>
        <th class="py-2 px-2 text-right">Amount</th>
        <th class="py-2 px-2 w-8"></th>
    `;
}

function addPOItemRow() {
    const tbody = document.getElementById('po-items-tbody');
    if (!tbody) return;
    const idx = poRowCounter++;
    const unitOptions = APP_DATA.units.filter(u => u.status === 'active').map(u => `<option value="${u.name}">${u.name}</option>`).join('');

    const tr = document.createElement('tr');
    tr.className = 'po-item-row';
    tr.dataset.row = idx;
    tr.innerHTML = `
        <td class="py-1 px-1" style="min-width:180px">
            <div class="sdd-wrap">
                <input type="text" class="sdd-search sdd-input" data-sdd-type="item" placeholder="Search item..." autocomplete="off" style="font-size:0.8125rem;padding:0.375rem 0.5rem">
                <input type="hidden" class="sdd-value po-item-id">
                <div class="sdd-list"></div>
            </div>
        </td>
        <td class="py-1 px-1"><input class="po-hsn w-20" value="" style="font-size:0.8125rem;padding:0.375rem 0.5rem" readonly></td>
        <td class="py-1 px-1"><input type="number" class="po-qty w-16 text-right" value="1" min="1" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1"><select class="po-unit" style="font-size:0.8125rem;padding:0.375rem 0.25rem">${unitOptions}</select></td>
        <td class="py-1 px-1"><input type="number" class="po-rate w-20 text-right" value="0" min="0" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1"><input type="number" class="po-disc w-14 text-right" value="0" min="0" max="100" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1 tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}><input type="number" class="po-cgst w-14 text-right" value="9" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1 tax-intra" ${poTaxMode !== 'intra' ? 'style="display:none"' : ''}><input type="number" class="po-sgst w-14 text-right" value="9" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1 tax-inter" ${poTaxMode !== 'inter' ? 'style="display:none"' : ''}><input type="number" class="po-igst w-14 text-right" value="18" style="font-size:0.8125rem;padding:0.375rem 0.5rem"></td>
        <td class="py-1 px-1 text-right font-medium text-xs po-row-amount" style="min-width:80px">₹0</td>
        <td class="py-1 px-1 text-center">
            <button onclick="removePOItemRow(this)" class="remove-row-btn text-red-400 hover:text-red-600" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
    recalcPOTotals();
}

function removePOItemRow(btn) {
    const tr = btn.closest('tr');
    const tbody = document.getElementById('po-items-tbody');
    if (tbody && tbody.children.length > 1) {
        tr.remove();
        recalcPOTotals();
    } else {
        showToast('At least one item required', 'info');
    }
}

function recalcPOTotals() {
    const tbody = document.getElementById('po-items-tbody');
    if (!tbody) return;
    let totalQty = 0;
    let totalAmount = 0;

    tbody.querySelectorAll('tr').forEach(row => {
        const qty = parseFloat(row.querySelector('.po-qty')?.value) || 0;
        const rate = parseFloat(row.querySelector('.po-rate')?.value) || 0;
        const disc = parseFloat(row.querySelector('.po-disc')?.value) || 0;
        const base = qty * rate * (1 - disc / 100);

        let tax = 0;
        if (poTaxMode === 'intra') {
            const cgst = parseFloat(row.querySelector('.po-cgst')?.value) || 0;
            const sgst = parseFloat(row.querySelector('.po-sgst')?.value) || 0;
            tax = base * (cgst + sgst) / 100;
        } else {
            const igst = parseFloat(row.querySelector('.po-igst')?.value) || 0;
            tax = base * igst / 100;
        }

        const rowTotal = base + tax;
        totalQty += qty;
        totalAmount += rowTotal;

        const amtCell = row.querySelector('.po-row-amount');
        if (amtCell) amtCell.textContent = fmt(rowTotal.toFixed(2));
    });

    const qtyEl = document.getElementById('po-total-qty');
    const amtEl = document.getElementById('po-total-amount');
    if (qtyEl) qtyEl.textContent = fmtNum(totalQty);
    if (amtEl) amtEl.textContent = fmt(totalAmount.toFixed(2));
}

function rebuildPOItemsTable() {
    // Toggle visibility of tax columns
    document.querySelectorAll('.tax-intra').forEach(el => {
        el.style.display = poTaxMode === 'intra' ? '' : 'none';
    });
    document.querySelectorAll('.tax-inter').forEach(el => {
        el.style.display = poTaxMode === 'inter' ? '' : 'none';
    });
    recalcPOTotals();
}

function savePO(status) {
    const vendorId = document.getElementById('po-vendor-id')?.value;
    const vendor = APP_DATA.vendors.find(v => v.id === vendorId);
    if (!vendor) { showToast('Please select a vendor', 'info'); return; }

    const tbody = document.getElementById('po-items-tbody');
    const rows = tbody ? tbody.querySelectorAll('tr') : [];
    if (rows.length === 0) { showToast('Please add at least one item', 'info'); return; }

    const items = [];
    let totalQty = 0;
    let totalAmount = 0;

    rows.forEach(row => {
        const itemId = row.querySelector('.po-item-id')?.value || '';
        const name = row.querySelector('.sdd-search')?.value || '';
        const hsn = row.querySelector('.po-hsn')?.value || '';
        const qty = parseFloat(row.querySelector('.po-qty')?.value) || 0;
        const unit = row.querySelector('.po-unit')?.value || 'Pcs';
        const rate = parseFloat(row.querySelector('.po-rate')?.value) || 0;
        const disc = parseFloat(row.querySelector('.po-disc')?.value) || 0;

        let cgstRate = 0, sgstRate = 0, igstRate = 0;
        if (poTaxMode === 'intra') {
            cgstRate = parseFloat(row.querySelector('.po-cgst')?.value) || 0;
            sgstRate = parseFloat(row.querySelector('.po-sgst')?.value) || 0;
        } else {
            igstRate = parseFloat(row.querySelector('.po-igst')?.value) || 0;
        }

        const base = qty * rate * (1 - disc / 100);
        const tax = poTaxMode === 'intra' ? base * (cgstRate + sgstRate) / 100 : base * igstRate / 100;
        totalQty += qty;
        totalAmount += base + tax;

        items.push({ itemId, name, hsn, qty, unit, rate, disc, cgstRate, sgstRate, igstRate });
    });

    const poNum = APP_DATA.purchaseOrders.length + 1;
    const newPO = {
        id: `PO-2026-${String(poNum).padStart(3, '0')}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        date: document.getElementById('po-date')?.value || new Date().toISOString().split('T')[0],
        quotationNo: document.getElementById('po-quotation')?.value || '',
        status,
        paymentTerms: document.getElementById('po-payment')?.value || 'Cash',
        deliveryDate: document.getElementById('po-delivery')?.value || '',
        items,
        totalQty,
        totalAmount: Math.round(totalAmount * 100) / 100,
        receivedQty: 0
    };

    APP_DATA.purchaseOrders.push(newPO);

    // Auto-update inventory for each item
    items.forEach(item => {
        const inv = APP_DATA.inventory.find(i => i.itemId === item.itemId);
        if (inv) {
            // PO created - reserve qty
            inv.reserved += item.qty;
        }
    });

    closeModal();
    showToast(status === 'draft' ? 'PO saved as draft' : 'Purchase Order created!');
    navigateTo('purchase-orders');
}

// ================================================================
//  PAGE: INVENTORY (Enhanced with filters)
// ================================================================
function renderInventory() {
    const inv = APP_DATA.inventory;
    const categories = [...new Set(inv.map(i => i.category))];
    const locations = [...new Set(inv.map(i => i.location))];
    const inStock = inv.filter(i => i.inStock > 0);
    const outOfStock = inv.filter(i => i.inStock === 0);

    return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="bg-white rounded-xl border border-surface-100 p-4">
            <p class="text-xs text-surface-400">Total Items</p><p class="text-xl font-bold">${inv.length}</p>
        </div>
        <div class="bg-green-50 rounded-xl border border-green-100 p-4">
            <p class="text-xs text-green-600">In Stock</p><p class="text-xl font-bold text-green-700">${inStock.length}</p>
        </div>
        <div class="bg-red-50 rounded-xl border border-red-100 p-4">
            <p class="text-xs text-red-600">Out of Stock</p><p class="text-xl font-bold text-red-700">${outOfStock.length}</p>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p class="text-xs text-amber-600">Low Stock (&le;5)</p><p class="text-xl font-bold text-amber-700">${inv.filter(i => i.inStock > 0 && (i.inStock - i.reserved) <= 5).length}</p>
        </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 mb-4">
        <div class="flex flex-wrap items-center gap-3">
            <input type="text" id="inv-search" oninput="filterInventory()" placeholder="Search items..." class="border border-surface-200 rounded-lg px-3 py-1.5 text-sm w-56">
            <select id="inv-cat-filter" onchange="filterInventory()" class="border border-surface-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <select id="inv-loc-filter" onchange="filterInventory()" class="border border-surface-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Locations</option>
                ${locations.map(l => `<option value="${l}">${l}</option>`).join('')}
            </select>
            <select id="inv-status-filter" onchange="filterInventory()" class="border border-surface-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
            </select>
        </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Item</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Category</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase">In Stock</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Reserved</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Available</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Unit</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Location</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody id="inv-tbody" class="divide-y divide-surface-50">
                    ${renderInventoryRows(inv)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderInventoryRows(items) {
    return items.map(item => {
        const avail = item.inStock - item.reserved;
        const status = item.inStock === 0 ? 'out' : avail <= 5 ? 'low' : 'ok';
        const statusHtml = status === 'out' ? '<span class="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">Out of Stock</span>'
            : status === 'low' ? '<span class="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-xs font-medium">Low Stock</span>'
            : '<span class="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium">Available</span>';
        return `
        <tr class="hover:bg-surface-50/50 transition" data-category="${item.category}" data-location="${item.location}" data-status="${status}">
            <td class="py-3 px-4">
                <p class="font-medium text-surface-800">${item.name}</p>
                <p class="text-xs text-surface-400">${item.itemId}</p>
            </td>
            <td class="py-3 px-4 hidden md:table-cell"><span class="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md text-xs">${item.category}</span></td>
            <td class="py-3 px-4 text-right font-bold ${item.inStock === 0 ? 'text-red-500' : ''}">${item.inStock}</td>
            <td class="py-3 px-4 text-right hidden md:table-cell ${item.reserved > 0 ? 'text-amber-600 font-medium' : ''}">${item.reserved}</td>
            <td class="py-3 px-4 text-right font-medium hidden lg:table-cell">${avail}</td>
            <td class="py-3 px-4 hidden lg:table-cell text-surface-500">${item.unit}</td>
            <td class="py-3 px-4 hidden md:table-cell text-surface-500">${item.location}</td>
            <td class="py-3 px-4 text-center">${statusHtml}</td>
        </tr>`;
    }).join('');
}

function filterInventory() {
    const search = (document.getElementById('inv-search')?.value || '').toLowerCase().trim();
    const catFilter = document.getElementById('inv-cat-filter')?.value || '';
    const locFilter = document.getElementById('inv-loc-filter')?.value || '';
    const statusFilter = document.getElementById('inv-status-filter')?.value || '';

    let items = APP_DATA.inventory;
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search) || i.itemId.toLowerCase().includes(search));
    if (catFilter) items = items.filter(i => i.category === catFilter);
    if (locFilter) items = items.filter(i => i.location === locFilter);
    if (statusFilter) {
        items = items.filter(i => {
            const avail = i.inStock - i.reserved;
            if (statusFilter === 'out-of-stock') return i.inStock === 0;
            if (statusFilter === 'low-stock') return i.inStock > 0 && avail <= 5;
            if (statusFilter === 'in-stock') return i.inStock > 0 && avail > 5;
            return true;
        });
    }
    document.getElementById('inv-tbody').innerHTML = renderInventoryRows(items);
}

// ================================================================
//  PAGE: SITES
// ================================================================
function renderSites() {
    const sites = APP_DATA.sites;
    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <p class="text-sm text-surface-500">${sites.length} sites &bull; ${sites.filter(s=>s.status==='active').length} active</p>
        <button onclick="showToast('Add Site form coming soon','info')" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Add Site
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${sites.map(site => `
        <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5 hover:shadow-md transition iso-card">
            <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-xl ${site.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                </div>
                ${statusBadge(site.status)}
            </div>
            <h3 class="font-semibold text-surface-800 mb-1">${site.name}</h3>
            <p class="text-xs text-surface-400 mb-3">${site.location}</p>
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Manager</p>
                    <p class="text-sm font-medium">${site.manager}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Phone</p>
                    <p class="text-sm font-medium">${site.phone}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Items Issued</p>
                    <p class="text-sm font-medium">${fmtNum(site.itemsIssued)}</p>
                </div>
                <div class="bg-surface-50 rounded-lg p-2">
                    <p class="text-xs text-surface-400">Material Cost</p>
                    <p class="text-sm font-medium">${fmt(site.totalMaterialCost)}</p>
                </div>
            </div>
        </div>`).join('')}
    </div>`;
}

// ================================================================
//  PAGE: MATERIAL ISSUE
// ================================================================
let miRowCounter = 0;

function renderMaterialIssue() {
    const issues = APP_DATA.materialIssues;
    const statusCounts = { issued: 0, pending: 0, cancelled: 0 };
    issues.forEach(mi => { if (statusCounts[mi.status] !== undefined) statusCounts[mi.status]++; });
    const sites = [...new Set(issues.map(mi => mi.siteName))];

    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-full">${issues.length} Total</span>
            <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">${statusCounts.issued} Issued</span>
            <span class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">${statusCounts.pending} Pending</span>
        </div>
        ${isBossUser() ? '' : `<button onclick="openIssueMaterialModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Issue Material
        </button>`}
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 flex items-center bg-surface-50 rounded-lg px-3 py-2">
                <svg class="w-4 h-4 text-surface-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" id="mi-search" placeholder="Search MI number, site, items, issued by..." class="bg-transparent text-sm outline-none w-full placeholder-surface-400" oninput="filterMIList()">
            </div>
            <select id="mi-filter-status" onchange="filterMIList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
            </select>
            <select id="mi-filter-site" onchange="filterMIList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Sites</option>
                ${sites.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <input type="date" id="mi-filter-from" onchange="filterMIList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="From date">
            <input type="date" id="mi-filter-to" onchange="filterMIList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="To date">
        </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">MI Number</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Issued To</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Date</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Items</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Issued By</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Requested By</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Status</th>
                    </tr>
                </thead>
                <tbody id="mi-list-tbody" class="divide-y divide-surface-50">
                    ${renderMIRows(issues)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderMIRows(issues) {
    if (issues.length === 0) return '<tr><td colspan="7" class="py-8 text-center text-surface-400 text-sm">No material issues found</td></tr>';
    return issues.map(mi => {
        const isContractor = mi.issueToType === 'contractor';
        const issuedToName = isContractor ? mi.contractorName : mi.siteName;
        const issuedToSub = isContractor ? `${mi.contractorId} &bull; Contractor` : `${mi.siteId}`;
        return `
        <tr class="hover:bg-surface-50/50 transition cursor-pointer" onclick="viewMIDetail('${mi.id}')">
            <td class="py-3 px-4">
                <p class="font-medium text-primary-600">${mi.id}</p>
                <p class="text-xs text-surface-400">${mi.items.length} item${mi.items.length > 1 ? 's' : ''}</p>
            </td>
            <td class="py-3 px-4">
                <p class="font-medium">${issuedToName}</p>
                <p class="text-xs text-surface-400">${issuedToSub}</p>
            </td>
            <td class="py-3 px-4 hidden md:table-cell text-surface-500">${formatDate(mi.date)}</td>
            <td class="py-3 px-4 text-right hidden md:table-cell">${mi.items.reduce((s, i) => s + i.qty, 0)} units</td>
            <td class="py-3 px-4 hidden lg:table-cell text-surface-500 text-xs">${mi.issuedBy}</td>
            <td class="py-3 px-4 hidden lg:table-cell text-surface-500 text-xs">${mi.requestedBy}</td>
            <td class="py-3 px-4 text-center">${statusBadge(mi.status)}</td>
        </tr>`;
    }).join('');
}

function viewMIDetail(id) {
    const mi = APP_DATA.materialIssues.find(m => m.id === id);
    if (!mi) return;
    const isContractor = mi.issueToType === 'contractor';
    const issuedToLabel = isContractor ? 'Contractor' : 'Site';
    const issuedToName = isContractor ? mi.contractorName : mi.siteName;
    const issuedToId = isContractor ? mi.contractorId : mi.siteId;
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold">${mi.id}</h2>
                    <p class="text-sm text-surface-400">${issuedToName}${isContractor ? ' <span class="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded ml-1">Contractor</span>' : ''}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${statusBadge(mi.status)}
                    <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600 ml-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span class="text-surface-400">Date:</span> <span class="font-medium">${formatDate(mi.date)}</span></div>
                <div><span class="text-surface-400">${issuedToLabel} ID:</span> <span class="font-medium">${issuedToId}</span></div>
                <div><span class="text-surface-400">Issued By:</span> <span class="font-medium">${mi.issuedBy}</span></div>
                <div><span class="text-surface-400">Requested By:</span> <span class="font-medium">${mi.requestedBy}</span></div>
            </div>
            <h3 class="text-sm font-semibold mb-2">Items Issued</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead><tr class="bg-surface-50 text-xs text-surface-500">
                        <th class="py-2 px-3 text-left">Item</th>
                        <th class="py-2 px-3 text-right">Qty</th>
                        <th class="py-2 px-3 text-left">Unit</th>
                    </tr></thead>
                    <tbody class="divide-y divide-surface-50">
                        ${mi.items.map(item => `
                        <tr>
                            <td class="py-2 px-3 font-medium">${item.name}</td>
                            <td class="py-2 px-3 text-right">${item.qty}</td>
                            <td class="py-2 px-3 text-surface-500">${item.unit}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `);
}

function filterMIList() {
    const search = (document.getElementById('mi-search')?.value || '').toLowerCase();
    const status = document.getElementById('mi-filter-status')?.value || '';
    const site = document.getElementById('mi-filter-site')?.value || '';
    const from = document.getElementById('mi-filter-from')?.value || '';
    const to = document.getElementById('mi-filter-to')?.value || '';

    const filtered = APP_DATA.materialIssues.filter(mi => {
        if (search && !(
            mi.id.toLowerCase().includes(search) ||
            mi.siteName.toLowerCase().includes(search) ||
            (mi.contractorName || '').toLowerCase().includes(search) ||
            mi.issuedBy.toLowerCase().includes(search) ||
            mi.requestedBy.toLowerCase().includes(search) ||
            mi.items.some(item => item.name.toLowerCase().includes(search))
        )) return false;
        if (status && mi.status !== status) return false;
        if (site && mi.siteName !== site) return false;
        if (from && mi.date < from) return false;
        if (to && mi.date > to) return false;
        return true;
    });

    const tbody = document.getElementById('mi-list-tbody');
    if (tbody) tbody.innerHTML = renderMIRows(filtered);
}

function openIssueMaterialModal() {
    miRowCounter = 0;
    window._miConCategories = null;
    window._miIssueToMode = 'site';
    const categories = [...new Set(APP_DATA.items.map(i => i.category))];
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Issue Material</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>

            <!-- Issue To Toggle -->
            <div class="mb-4">
                <label class="block text-xs font-medium text-surface-600 mb-1.5">Issue To</label>
                <div class="flex gap-2">
                    <button type="button" onclick="toggleMIIssueTo('site')" id="mi-toggle-site" class="px-4 py-1.5 rounded-lg text-sm font-medium border-2 border-primary-500 bg-primary-50 text-primary-700 transition">Site</button>
                    <button type="button" onclick="toggleMIIssueTo('contractor')" id="mi-toggle-contractor" class="px-4 py-1.5 rounded-lg text-sm font-medium border-2 border-surface-200 text-surface-500 hover:border-surface-300 transition">Contractor</button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Searchable Site (shown by default) -->
                <div id="mi-site-wrap">
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Site</label>
                    <div class="sdd-wrap">
                        <input type="text" class="sdd-search sdd-input" data-sdd-type="site" placeholder="Search site..." autocomplete="off">
                        <input type="hidden" class="sdd-value" id="mi-site-id">
                        <div class="sdd-list"></div>
                    </div>
                </div>
                <!-- Searchable Contractor (hidden by default) -->
                <div id="mi-contractor-wrap" class="hidden">
                    <label class="block text-xs font-medium text-surface-600 mb-1.5">Contractor</label>
                    <div class="sdd-wrap">
                        <input type="text" class="sdd-search sdd-input" data-sdd-type="contractor" placeholder="Search contractor..." autocomplete="off">
                        <input type="hidden" class="sdd-value" id="mi-contractor-id">
                        <div class="sdd-list"></div>
                    </div>
                </div>
                ${formField('Issue Date', 'date', 'mi-date', '')}
                ${formField('Requested By', 'text', 'mi-requested', 'Site manager name')}
                ${formField('Issued By', 'text', 'mi-issued', 'Store keeper name')}
            </div>

            <!-- Category filter for items -->
            <div class="flex items-center gap-3 mb-3">
                <h3 class="text-sm font-semibold">Items</h3>
                <select id="mi-cat-filter" onchange="filterMIItems()" class="border border-surface-200 rounded-lg px-2 py-1 text-xs">
                    <option value="">All Categories</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>

            <div class="overflow-visible mb-3">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-surface-50 text-xs">
                            <th class="py-2 px-2 text-left">Item</th>
                            <th class="py-2 px-2 text-right">Available</th>
                            <th class="py-2 px-2 text-right">Qty</th>
                            <th class="py-2 px-2">Unit</th>
                            <th class="py-2 px-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody id="mi-items-tbody"></tbody>
                </table>
            </div>

            <button onclick="addMIItemRow()" class="text-primary-600 text-sm font-medium hover:text-primary-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Add Another Item
            </button>

            <div id="mi-validation-msg" class="hidden mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5"></div>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveMaterialIssue()" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Issue Material</button>
            </div>
        </div>
    `);
    addMIItemRow();
}

function toggleMIIssueTo(mode) {
    const siteWrap = document.getElementById('mi-site-wrap');
    const conWrap = document.getElementById('mi-contractor-wrap');
    const siteBtn = document.getElementById('mi-toggle-site');
    const conBtn = document.getElementById('mi-toggle-contractor');
    const activeClass = 'border-primary-500 bg-primary-50 text-primary-700';
    const inactiveClass = 'border-surface-200 text-surface-500 hover:border-surface-300';

    if (mode === 'contractor') {
        siteWrap.classList.add('hidden');
        conWrap.classList.remove('hidden');
        siteBtn.className = `px-4 py-1.5 rounded-lg text-sm font-medium border-2 ${inactiveClass} transition`;
        conBtn.className = `px-4 py-1.5 rounded-lg text-sm font-medium border-2 ${activeClass} transition`;
        // Clear site selection
        const siteInput = siteWrap.querySelector('.sdd-search');
        const siteHidden = document.getElementById('mi-site-id');
        if (siteInput) siteInput.value = '';
        if (siteHidden) siteHidden.value = '';
        window._miIssueToMode = 'contractor';
    } else {
        conWrap.classList.add('hidden');
        siteWrap.classList.remove('hidden');
        conBtn.className = `px-4 py-1.5 rounded-lg text-sm font-medium border-2 ${inactiveClass} transition`;
        siteBtn.className = `px-4 py-1.5 rounded-lg text-sm font-medium border-2 ${activeClass} transition`;
        // Clear contractor selection
        const conInput = conWrap.querySelector('.sdd-search');
        const conHidden = document.getElementById('mi-contractor-id');
        if (conInput) conInput.value = '';
        if (conHidden) conHidden.value = '';
        window._miConCategories = null;
        window._miIssueToMode = 'site';
        // Reset category filter to all
        const catFilterEl = document.getElementById('mi-cat-filter');
        if (catFilterEl) {
            const allCats = [...new Set(APP_DATA.items.map(i => i.category))];
            catFilterEl.innerHTML = '<option value="">All Categories</option>' +
                allCats.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }
}

function addMIItemRow() {
    const tbody = document.getElementById('mi-items-tbody');
    if (!tbody) return;
    const idx = miRowCounter++;
    const unitOptions = APP_DATA.units.filter(u => u.status === 'active').map(u => `<option value="${u.name}">${u.name}</option>`).join('');
    const tr = document.createElement('tr');
    tr.className = 'po-item-row';
    tr.dataset.row = idx;
    tr.innerHTML = `
        <td class="py-1 px-1" style="min-width:180px">
            <div class="sdd-wrap">
                <input type="text" class="sdd-search sdd-input" data-sdd-type="mi-item" placeholder="Search item..." autocomplete="off" style="font-size:0.8125rem;padding:0.375rem 0.5rem">
                <input type="hidden" class="sdd-value mi-item-id">
                <div class="sdd-list"></div>
            </div>
        </td>
        <td class="py-1 px-1 text-right text-xs text-surface-400 mi-avail-cell">—</td>
        <td class="py-1 px-1"><input type="number" class="mi-qty w-16 text-right" value="1" min="1" style="font-size:0.8125rem;padding:0.375rem 0.5rem;border:1px solid #e2e8f0;border-radius:0.5rem"></td>
        <td class="py-1 px-1"><select class="mi-unit" style="font-size:0.8125rem;padding:0.375rem 0.25rem;border:1px solid #e2e8f0;border-radius:0.5rem">${unitOptions}</select></td>
        <td class="py-1 px-1 text-center">
            <button onclick="removeMIItemRow(this)" class="remove-row-btn text-red-400 hover:text-red-600" title="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </td>
    `;
    tbody.appendChild(tr);
}

function removeMIItemRow(btn) {
    const tr = btn.closest('tr');
    const tbody = document.getElementById('mi-items-tbody');
    if (tbody && tbody.children.length > 1) {
        tr.remove();
    } else {
        showToast('At least one item required', 'info');
    }
}

function filterMIItems() {
    // Stores category filter for mi-item search
    window._miCatFilter = document.getElementById('mi-cat-filter')?.value || '';
}

function saveMaterialIssue() {
    const issueMode = window._miIssueToMode || 'site';
    let site = null, contractor = null;

    if (issueMode === 'contractor') {
        const conId = document.getElementById('mi-contractor-id')?.value;
        contractor = APP_DATA.contractors.find(c => c.id === conId);
        if (!contractor) { showToast('Please select a contractor', 'info'); return; }
    } else {
        const siteId = document.getElementById('mi-site-id')?.value;
        site = APP_DATA.sites.find(s => s.id === siteId);
        if (!site) { showToast('Please select a site', 'info'); return; }
    }

    const tbody = document.getElementById('mi-items-tbody');
    const rows = tbody ? tbody.querySelectorAll('tr') : [];
    if (rows.length === 0) { showToast('Please add at least one item', 'info'); return; }

    const items = [];
    const errors = [];

    rows.forEach((row, idx) => {
        const itemId = row.querySelector('.mi-item-id')?.value || '';
        const name = row.querySelector('.sdd-search')?.value || '';
        const qty = parseFloat(row.querySelector('.mi-qty')?.value) || 0;
        const unit = row.querySelector('.mi-unit')?.value || 'Pcs';

        if (!name) return;

        // Validate against inventory
        const inv = APP_DATA.inventory.find(i => i.itemId === itemId);
        const available = inv ? (inv.inStock - inv.reserved) : 0;
        if (qty > available) {
            errors.push(`${name}: requested ${qty} but only ${available} available`);
        }

        items.push({ itemId, name, qty, unit });
    });

    if (items.length === 0) { showToast('Please add at least one item', 'info'); return; }

    // Show validation errors
    const msgDiv = document.getElementById('mi-validation-msg');
    if (errors.length > 0) {
        msgDiv.classList.remove('hidden');
        msgDiv.innerHTML = `<p class="text-xs text-red-700 font-medium mb-1">Stock validation failed:</p>` +
            errors.map(e => `<p class="text-xs text-red-600">&bull; ${e}</p>`).join('');
        return;
    }
    if (msgDiv) msgDiv.classList.add('hidden');

    // Create the issue
    const miNum = APP_DATA.materialIssues.length + 1;
    const newMI = {
        id: `MI-2026-${String(miNum).padStart(3, '0')}`,
        issueToType: issueMode,
        siteId: site ? site.id : '',
        siteName: site ? site.name : '',
        contractorId: contractor ? contractor.id : '',
        contractorName: contractor ? contractor.name : '',
        date: document.getElementById('mi-date')?.value || new Date().toISOString().split('T')[0],
        issuedBy: document.getElementById('mi-issued')?.value || 'Store Keeper',
        requestedBy: document.getElementById('mi-requested')?.value || (site ? site.manager : contractor ? contractor.contact : ''),
        status: 'issued',
        items
    };
    APP_DATA.materialIssues.push(newMI);

    // Deduct from inventory
    items.forEach(item => {
        const inv = APP_DATA.inventory.find(i => i.itemId === item.itemId);
        if (inv) {
            inv.inStock = Math.max(0, inv.inStock - item.qty);
        }
    });

    closeModal();
    showToast('Material issued successfully!');
    navigateTo('material-issue');
}

// ================================================================
//  PAGE: GOODS RECEIPT (GRN)
// ================================================================
function renderGoodsReceipt() {
    const grns = APP_DATA.goodsReceipts;
    const qualityCounts = { 'Accepted': 0, 'Accepted with remarks': 0, 'Partial Delivery': 0 };
    grns.forEach(g => { if (qualityCounts[g.qualityStatus] !== undefined) qualityCounts[g.qualityStatus]++; });
    const vendors = [...new Set(grns.map(g => g.vendorName))];
    const receivablePOs = APP_DATA.purchaseOrders.filter(p => p.status === 'approved' || p.status === 'partially-received');

    return `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded-full">${grns.length} Total GRNs</span>
            <span class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">${qualityCounts['Accepted'] || 0} Accepted</span>
            <span class="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">${qualityCounts['Accepted with remarks']} With Remarks</span>
            <span class="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">${qualityCounts['Partial Delivery']} Partial</span>
        </div>
        ${isBossUser() ? '' : `<button onclick="openReceiveGoodsModal()" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Receive Goods
        </button>`}
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 flex items-center bg-surface-50 rounded-lg px-3 py-2">
                <svg class="w-4 h-4 text-surface-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" id="grn-search" placeholder="Search GRN number, PO, vendor..." class="bg-transparent text-sm outline-none w-full placeholder-surface-400" oninput="filterGRNList()">
            </div>
            <select id="grn-filter-vendor" onchange="filterGRNList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All Vendors</option>
                ${vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
            <input type="date" id="grn-filter-from" onchange="filterGRNList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="From date">
            <input type="date" id="grn-filter-to" onchange="filterGRNList()" class="border border-surface-200 rounded-lg px-3 py-2 text-sm" title="To date">
        </div>
    </div>

    ${receivablePOs.length > 0 ? `
    <div class="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <span class="text-sm font-medium text-amber-800">${receivablePOs.length} Purchase Order${receivablePOs.length > 1 ? 's' : ''} awaiting receipt</span>
        </div>
        <div class="flex flex-wrap gap-2">
            ${receivablePOs.map(p => `<span class="text-xs bg-white text-amber-700 px-2 py-1 rounded-lg border border-amber-200">${p.id} &mdash; ${p.vendorName}</span>`).join('')}
        </div>
    </div>` : ''}

    <div class="bg-white rounded-2xl shadow-sm border border-surface-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-surface-50 border-b border-surface-100">
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">GRN Number</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase">PO / Vendor</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Date</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden md:table-cell">Ordered</th>
                        <th class="text-right py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Received</th>
                        <th class="text-left py-3 px-4 font-semibold text-surface-600 text-xs uppercase hidden lg:table-cell">Received By</th>
                        <th class="text-center py-3 px-4 font-semibold text-surface-600 text-xs uppercase">Quality</th>
                    </tr>
                </thead>
                <tbody id="grn-list-tbody" class="divide-y divide-surface-50">
                    ${renderGRNRows(grns)}
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderGRNRows(grns) {
    if (grns.length === 0) return '<tr><td colspan="7" class="py-8 text-center text-surface-400 text-sm">No goods receipts found</td></tr>';
    return grns.map(g => {
        const qColor = g.qualityStatus === 'Partial Delivery' ? 'bg-red-50 text-red-700' :
                        g.qualityStatus === 'Accepted with remarks' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700';
        return `
        <tr class="hover:bg-surface-50/50 transition cursor-pointer" onclick="viewGRNDetail('${g.id}')">
            <td class="py-3 px-4">
                <p class="font-medium text-primary-600">${g.id}</p>
                <p class="text-xs text-surface-400">${g.items.length} item${g.items.length > 1 ? 's' : ''}</p>
            </td>
            <td class="py-3 px-4">
                <p class="font-medium">${g.vendorName}</p>
                <p class="text-xs text-surface-400">${g.poId}</p>
            </td>
            <td class="py-3 px-4 hidden md:table-cell text-surface-500">${formatDate(g.date)}</td>
            <td class="py-3 px-4 text-right hidden md:table-cell">${g.totalOrdered} units</td>
            <td class="py-3 px-4 text-right font-medium">${g.totalReceived} units</td>
            <td class="py-3 px-4 hidden lg:table-cell text-surface-500 text-xs">${g.receivedBy}</td>
            <td class="py-3 px-4 text-center"><span class="text-[11px] px-2 py-0.5 rounded-full ${qColor}">${g.qualityStatus}</span></td>
        </tr>`;
    }).join('');
}

function filterGRNList() {
    const search = (document.getElementById('grn-search')?.value || '').toLowerCase();
    const vendor = document.getElementById('grn-filter-vendor')?.value || '';
    const from = document.getElementById('grn-filter-from')?.value || '';
    const to = document.getElementById('grn-filter-to')?.value || '';

    const filtered = APP_DATA.goodsReceipts.filter(g => {
        if (search && !(
            g.id.toLowerCase().includes(search) ||
            g.poId.toLowerCase().includes(search) ||
            g.vendorName.toLowerCase().includes(search) ||
            g.receivedBy.toLowerCase().includes(search)
        )) return false;
        if (vendor && g.vendorName !== vendor) return false;
        if (from && g.date < from) return false;
        if (to && g.date > to) return false;
        return true;
    });

    const tbody = document.getElementById('grn-list-tbody');
    if (tbody) tbody.innerHTML = renderGRNRows(filtered);
}

function viewGRNDetail(id) {
    const grn = APP_DATA.goodsReceipts.find(g => g.id === id);
    if (!grn) return;
    const totalAccepted = grn.items.reduce((s, i) => s + i.acceptedQty, 0);
    const totalRejected = grn.items.reduce((s, i) => s + i.rejectedQty, 0);
    const qColor = grn.qualityStatus === 'Partial Delivery' ? 'bg-red-50 text-red-700' :
                    grn.qualityStatus === 'Accepted with remarks' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700';
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold">${grn.id}</h2>
                    <p class="text-sm text-surface-400">Against ${grn.poId} &mdash; ${grn.vendorName}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[11px] px-2 py-0.5 rounded-full ${qColor}">${grn.qualityStatus}</span>
                    <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600 ml-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div><span class="text-surface-400">Date:</span> <span class="font-medium">${formatDate(grn.date)}</span></div>
                <div><span class="text-surface-400">Received By:</span> <span class="font-medium">${grn.receivedBy}</span></div>
                <div><span class="text-surface-400">Accepted:</span> <span class="font-medium text-green-700">${totalAccepted}</span></div>
                <div><span class="text-surface-400">Rejected:</span> <span class="font-medium ${totalRejected > 0 ? 'text-red-600' : ''}">${totalRejected}</span></div>
            </div>
            ${grn.remarks ? `<div class="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-800"><span class="font-medium">Remarks:</span> ${grn.remarks}</div>` : ''}

            <h3 class="text-sm font-semibold mb-2">Items Checklist</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead><tr class="bg-surface-50 text-xs text-surface-500">
                        <th class="py-2 px-3 text-left">Item</th>
                        <th class="py-2 px-3 text-right">Ordered</th>
                        <th class="py-2 px-3 text-right">Received</th>
                        <th class="py-2 px-3 text-right">Accepted</th>
                        <th class="py-2 px-3 text-right">Rejected</th>
                        <th class="py-2 px-3 text-center">Status</th>
                    </tr></thead>
                    <tbody class="divide-y divide-surface-50">
                        ${grn.items.map(item => {
                            let st, stClass;
                            if (item.receivedQty === 0) { st = 'Not Received'; stClass = 'bg-red-50 text-red-600'; }
                            else if (item.receivedQty < item.orderedQty) { st = 'Partial'; stClass = 'bg-amber-50 text-amber-600'; }
                            else if (item.rejectedQty > 0) { st = 'With Rejects'; stClass = 'bg-amber-50 text-amber-600'; }
                            else { st = 'OK'; stClass = 'bg-green-50 text-green-600'; }
                            return `
                        <tr>
                            <td class="py-2 px-3 font-medium">${item.name}</td>
                            <td class="py-2 px-3 text-right">${item.orderedQty}</td>
                            <td class="py-2 px-3 text-right font-medium">${item.receivedQty}</td>
                            <td class="py-2 px-3 text-right text-green-700">${item.acceptedQty}</td>
                            <td class="py-2 px-3 text-right ${item.rejectedQty > 0 ? 'text-red-600 font-medium' : ''}">${item.rejectedQty}</td>
                            <td class="py-2 px-3 text-center"><span class="text-[10px] px-1.5 py-0.5 rounded ${stClass}">${st}</span></td>
                        </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `);
}

function openReceiveGoodsModal() {
    const receivablePOs = APP_DATA.purchaseOrders.filter(p => p.status === 'approved' || p.status === 'partially-received');
    if (receivablePOs.length === 0) {
        showToast('No purchase orders available for receiving', 'info');
        return;
    }
    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-semibold">Receive Goods &mdash; Select PO</h2>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div class="space-y-3">
                ${receivablePOs.map(po => {
                    const pct = Math.round(po.receivedQty / po.totalQty * 100);
                    return `
                    <div class="border border-surface-200 rounded-xl p-4 hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition" onclick="openGRNChecklistModal('${po.id}')">
                        <div class="flex items-center justify-between mb-2">
                            <div>
                                <p class="font-semibold text-primary-600">${po.id}</p>
                                <p class="text-sm text-surface-500">${po.vendorName}</p>
                            </div>
                            ${statusBadge(po.status)}
                        </div>
                        <div class="flex items-center justify-between text-xs text-surface-500">
                            <span>${po.items.length} items &bull; ${formatDate(po.date)}</span>
                            <span>${pct}% received</span>
                        </div>
                        <div class="mt-2 bg-surface-100 rounded-full h-1.5 overflow-hidden">
                            <div class="h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}" style="width:${pct}%"></div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `);
}

function openGRNChecklistModal(poId) {
    const po = APP_DATA.purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    // Calculate already received quantities from existing GRNs
    const existingGRNs = APP_DATA.goodsReceipts.filter(g => g.poId === poId);
    const alreadyReceived = {};
    existingGRNs.forEach(grn => {
        grn.items.forEach(gi => {
            alreadyReceived[gi.name] = (alreadyReceived[gi.name] || 0) + gi.receivedQty;
        });
    });

    openModal(`
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-lg font-semibold">Receive Goods &mdash; ${po.id}</h2>
                    <p class="text-sm text-surface-400">${po.vendorName} &bull; ${formatDate(po.date)}</p>
                </div>
                <button onclick="closeModal()" class="text-surface-400 hover:text-surface-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                ${formField('Receipt Date', 'date', 'grn-date', '')}
                ${formField('Received By', 'text', 'grn-received-by', 'Store keeper name')}
            </div>

            <h3 class="text-sm font-semibold mb-2">Item Checklist</h3>
            <p class="text-xs text-surface-400 mb-3">Enter the actual received qty for each item. Reduce qty if vendor sent less or you don't need all.</p>

            <div class="overflow-x-auto mb-3">
                <table class="w-full text-sm" id="grn-checklist-table">
                    <thead>
                        <tr class="bg-surface-50 text-xs text-surface-500">
                            <th class="py-2 px-2 text-left">Item</th>
                            <th class="py-2 px-2 text-right">Ordered</th>
                            <th class="py-2 px-2 text-right">Already Rcvd</th>
                            <th class="py-2 px-2 text-right">Pending</th>
                            <th class="py-2 px-2 text-right">Receive Now</th>
                            <th class="py-2 px-2 text-right">Rejected</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-surface-50">
                        ${po.items.map((item, idx) => {
                            const prevRcvd = alreadyReceived[item.name] || 0;
                            const pending = Math.max(0, item.qty - prevRcvd);
                            return `
                        <tr data-item-idx="${idx}">
                            <td class="py-2 px-2">
                                <p class="font-medium text-sm">${item.name}</p>
                                <p class="text-[10px] text-surface-400">${item.unit}</p>
                            </td>
                            <td class="py-2 px-2 text-right">${item.qty}</td>
                            <td class="py-2 px-2 text-right text-surface-400">${prevRcvd}</td>
                            <td class="py-2 px-2 text-right font-medium ${pending > 0 ? 'text-amber-600' : 'text-green-600'}">${pending}</td>
                            <td class="py-2 px-2">
                                <input type="number" class="grn-rcv-qty w-20 text-right" value="${pending}" min="0" max="${pending}" data-pending="${pending}" data-name="${item.name}" data-unit="${item.unit}" data-ordered="${item.qty}" style="font-size:0.8125rem;padding:0.375rem 0.5rem;border:1px solid #e2e8f0;border-radius:0.5rem" ${pending === 0 ? 'disabled' : ''}>
                            </td>
                            <td class="py-2 px-2">
                                <input type="number" class="grn-rej-qty w-16 text-right" value="0" min="0" data-name="${item.name}" style="font-size:0.8125rem;padding:0.375rem 0.5rem;border:1px solid #e2e8f0;border-radius:0.5rem" ${pending === 0 ? 'disabled' : ''}>
                            </td>
                        </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div>
                <label class="block text-xs font-medium text-surface-600 mb-1.5">Remarks / Quality Notes</label>
                <textarea id="grn-remarks" rows="2" placeholder="e.g. 2 bags damaged, 5 items pending next delivery" class="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none"></textarea>
            </div>

            <div id="grn-validation-msg" class="hidden mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5"></div>

            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
                <button onclick="closeModal()" class="px-4 py-2 rounded-xl border border-surface-200 text-sm font-medium hover:bg-surface-50 transition">Cancel</button>
                <button onclick="saveGoodsReceipt('${po.id}')" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition">Confirm Receipt</button>
            </div>
        </div>
    `);
}

function saveGoodsReceipt(poId) {
    const po = APP_DATA.purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const date = document.getElementById('grn-date')?.value || new Date().toISOString().split('T')[0];
    const receivedBy = document.getElementById('grn-received-by')?.value?.trim() || 'Store Keeper';
    const remarks = document.getElementById('grn-remarks')?.value?.trim() || '';

    const rcvInputs = document.querySelectorAll('.grn-rcv-qty');
    const rejInputs = document.querySelectorAll('.grn-rej-qty');
    const items = [];
    const errors = [];
    let totalReceived = 0;
    let totalOrdered = 0;
    let hasAnyReceived = false;

    rcvInputs.forEach((input, idx) => {
        const name = input.dataset.name;
        const unit = input.dataset.unit;
        const ordered = parseInt(input.dataset.ordered) || 0;
        const pending = parseInt(input.dataset.pending) || 0;
        const rcvQty = parseInt(input.value) || 0;
        const rejQty = parseInt(rejInputs[idx]?.value) || 0;

        if (rcvQty > pending) {
            errors.push(`${name}: receiving ${rcvQty} but only ${pending} pending`);
        }
        if (rejQty > rcvQty) {
            errors.push(`${name}: rejected (${rejQty}) cannot exceed received (${rcvQty})`);
        }

        const acceptedQty = Math.max(0, rcvQty - rejQty);
        if (rcvQty > 0) hasAnyReceived = true;
        totalReceived += rcvQty;
        totalOrdered += ordered;
        items.push({ name, unit, orderedQty: ordered, receivedQty: rcvQty, acceptedQty, rejectedQty: rejQty });
    });

    if (!hasAnyReceived) {
        showToast('Please enter received quantity for at least one item', 'info');
        return;
    }

    const msgDiv = document.getElementById('grn-validation-msg');
    if (errors.length > 0) {
        msgDiv.classList.remove('hidden');
        msgDiv.innerHTML = `<p class="text-xs text-red-700 font-medium mb-1">Validation errors:</p>` +
            errors.map(e => `<p class="text-xs text-red-600">&bull; ${e}</p>`).join('');
        return;
    }
    if (msgDiv) msgDiv.classList.add('hidden');

    // Determine quality status
    const totalRejected = items.reduce((s, i) => s + i.rejectedQty, 0);
    const hasUnreceived = items.some(i => i.receivedQty === 0 && parseInt(document.querySelector(`.grn-rcv-qty[data-name="${CSS.escape(i.name)}"]`)?.dataset.pending || '0') > 0);
    const hasPartial = items.some(i => i.receivedQty > 0 && i.receivedQty < (parseInt(document.querySelector(`.grn-rcv-qty[data-name="${CSS.escape(i.name)}"]`)?.dataset.pending || '0')));
    let qualityStatus = 'Accepted';
    if (hasUnreceived || hasPartial) {
        qualityStatus = 'Partial Delivery';
    } else if (totalRejected > 0) {
        qualityStatus = 'Accepted with remarks';
    }

    // Create GRN
    const grnNum = APP_DATA.goodsReceipts.length + 1;
    const newGRN = {
        id: `GRN-2026-${String(grnNum).padStart(3, '0')}`,
        poId,
        vendorName: po.vendorName,
        date,
        receivedBy,
        items,
        totalReceived,
        totalOrdered,
        qualityStatus,
        remarks
    };
    APP_DATA.goodsReceipts.push(newGRN);

    // Update PO received quantities and status
    const allGRNsForPO = APP_DATA.goodsReceipts.filter(g => g.poId === poId);
    const totalRcvdForPO = {};
    allGRNsForPO.forEach(grn => {
        grn.items.forEach(gi => {
            totalRcvdForPO[gi.name] = (totalRcvdForPO[gi.name] || 0) + gi.receivedQty;
        });
    });
    po.receivedQty = Object.values(totalRcvdForPO).reduce((s, v) => s + v, 0);
    const allItemsFullyReceived = po.items.every(pi => (totalRcvdForPO[pi.name] || 0) >= pi.qty);
    po.status = allItemsFullyReceived ? 'fully-received' : 'partially-received';

    // Update inventory — add accepted qty to stock
    items.forEach(item => {
        if (item.acceptedQty > 0) {
            const inv = APP_DATA.inventory.find(i => i.name === item.name);
            if (inv) {
                inv.inStock += item.acceptedQty;
                inv.lastReceived = date;
            }
        }
    });

    closeModal();
    showToast('Goods receipt recorded successfully!');
    navigateTo('goods-receipt');
}

// ================================================================
//  PAGE: SETTINGS
// ================================================================
function renderSettings() {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5">
                <h3 class="font-semibold text-surface-800 mb-4">User Management</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead><tr class="bg-surface-50 border-b border-surface-100">
                            <th class="py-2 px-3 text-left text-xs font-semibold text-surface-600">User</th>
                            <th class="py-2 px-3 text-left text-xs font-semibold text-surface-600">Role</th>
                            <th class="py-2 px-3 text-left text-xs font-semibold text-surface-600">Email</th>
                            <th class="py-2 px-3 text-center text-xs font-semibold text-surface-600">Status</th>
                        </tr></thead>
                        <tbody class="divide-y divide-surface-50">
                            ${[
                                { name: 'Admin User', role: 'Admin', email: 'admin@goodsflow.in', status: 'active' },
                                { name: 'Rajesh Patil', role: 'Site Manager', email: 'rajesh@goodsflow.in', status: 'active' },
                                { name: 'Ramesh Kumar', role: 'Store Keeper', email: 'ramesh@goodsflow.in', status: 'active' },
                                { name: 'Sunil Jadhav', role: 'Store Keeper', email: 'sunil@goodsflow.in', status: 'active' },
                                { name: 'Priya Sharma', role: 'Accountant', email: 'priya@goodsflow.in', status: 'active' },
                            ].map(u => `
                            <tr class="hover:bg-surface-50">
                                <td class="py-3 px-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">${u.name.split(' ').map(w=>w[0]).join('')}</div>
                                        <span class="font-medium">${u.name}</span>
                                    </div>
                                </td>
                                <td class="py-3 px-3"><span class="bg-surface-100 text-surface-600 px-2 py-0.5 rounded-md text-xs">${u.role}</span></td>
                                <td class="py-3 px-3 text-surface-500">${u.email}</td>
                                <td class="py-3 px-3 text-center">${statusBadge(u.status)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5">
                <h3 class="font-semibold text-surface-800 mb-4">Roles & Permissions</h3>
                <div class="space-y-3">
                    ${['Admin', 'Site Manager', 'Store Keeper', 'Accountant'].map((role, i) => {
                        const perms = [
                            'Full access to all modules',
                            'View sites, request material, view reports',
                            'Manage GRN, inventory, issue material',
                            'View POs, reports, vendor payments'
                        ];
                        const colors = ['bg-red-50 text-red-600', 'bg-blue-50 text-blue-600', 'bg-green-50 text-green-600', 'bg-purple-50 text-purple-600'];
                        return `
                        <div class="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                            <span class="${colors[i]} px-2 py-0.5 rounded-md text-xs font-medium">${role}</span>
                            <p class="text-xs text-surface-500">${perms[i]}</p>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-surface-100 p-5">
                <h3 class="font-semibold text-surface-800 mb-4">Company Info</h3>
                <div class="space-y-3">
                    <div><p class="text-xs text-surface-400">Company Name</p><p class="text-sm font-medium">${APP_DATA.companyInfo.name}</p></div>
                    <div><p class="text-xs text-surface-400">GSTIN</p><p class="text-sm font-medium font-mono">${APP_DATA.companyInfo.gstin}</p></div>
                    <div><p class="text-xs text-surface-400">State</p><p class="text-sm font-medium">${APP_DATA.companyInfo.state} (${APP_DATA.companyInfo.stateCode})</p></div>
                    <div><p class="text-xs text-surface-400">Default Warehouse</p><p class="text-sm font-medium">Main Warehouse, Navi Mumbai</p></div>
                </div>
            </div>
        </div>
    </div>`;
}
