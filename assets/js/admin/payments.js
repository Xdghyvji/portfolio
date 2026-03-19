import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app",
    messagingSenderId: "473586363516",
    appId: "1:473586363516:web:d7b9db91eba86f8809adf9",
    measurementId: "G-P25VB35JSM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Payments Component - Advanced Financial Ledger & Revenue Tracking
 */
const Payments = {
    allPayments: [],
    filteredPayments: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchPayments();
            this.filteredPayments = [...this.allPayments];

            container.innerHTML = this.renderUI();
            this.renderPaymentsTable(this.filteredPayments);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Payments Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchPayments() {
        const snap = await getDocs(collection(db, "payments"));
        this.allPayments = [];
        snap.forEach(doc => {
            this.allPayments.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allPayments.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const totalVolume = this.allPayments.length;
        
        let totalSettled = 0;
        let pendingClearance = 0;
        let failedRefunded = 0;

        this.allPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            const status = (p.status || 'pending').toLowerCase();
            
            if (status === 'completed' || status === 'settled') {
                totalSettled += amount;
            } else if (status === 'pending' || status === 'processing') {
                pendingClearance += amount;
            } else if (status === 'failed' || status === 'refunded') {
                failedRefunded += amount;
            }
        });

        return { totalVolume, totalSettled, pendingClearance, failedRefunded };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-wallet text-ma-emerald"></i> Revenue Ledger
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Monitor inbound capital, track clearing statuses, and manage financial logs.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.PaymentsExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Ledger
                        </button>
                        <button onclick="window.PaymentsOpenProvisionModal()" class="px-4 py-2.5 bg-ma-emerald hover:bg-emerald-500 text-ma-dark rounded-xl text-xs font-bold shadow-lg shadow-ma-emerald/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Record Transaction
                        </button>
                        <button onclick="window.loadSection('payments')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-emerald transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Settled</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">$${stats.totalSettled.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Pending Clearance</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">$${stats.pendingClearance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-hourglass-half"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Failed / Refunded</p>
                            <h4 class="text-2xl font-display font-bold text-rose-500">$${stats.failedRefunded.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition"><i class="fa-solid fa-arrow-right-arrow-left"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Tx Volume</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.totalVolume}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-money-bill-transfer"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-emerald text-ma-dark shadow-lg transition">All</button>
                            <button data-filter="completed" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Settled</button>
                            <button data-filter="pending" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Pending</button>
                            <button data-filter="failed" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Failed/Refunds</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="payment-search" placeholder="Search client or TX ID..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-emerald/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Transaction ID / Method</th>
                                    <th class="px-6 py-4 font-medium">Client Origin</th>
                                    <th class="px-6 py-4 font-medium">Value</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium">Timestamp</th>
                                    <th class="px-6 py-4 font-medium text-right">Ledger Ops</th>
                                </tr>
                            </thead>
                            <tbody id="payments-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="payments-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="payments-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderPaymentsTable(payments) {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-receipt"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No financial transactions detected.</p>
                        <p class="text-xs text-slate-600 mt-1">The revenue ledger is currently empty.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = payments.map(payment => {
            const status = (payment.status || 'pending').toLowerCase();
            const method = payment.method || 'Transfer';
            const amount = Number(payment.amount) || 0;
            
            let statusMarkup = '';
            if (status === 'completed' || status === 'settled') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-ma-emerald bg-ma-emerald/10 border border-ma-emerald/20 px-2.5 py-1 rounded w-fit"><span class="w-1.5 h-1.5 rounded-full bg-ma-emerald"></span> Settled</span>`;
            } else if (status === 'failed' || status === 'refunded') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-xmark"></i> ${status}</span>`;
            } else {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded w-fit"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pending</span>`;
            }

            const methodIcon = this.getMethodIcon(method);
            const dateStr = payment.createdAt ? new Date(payment.createdAt.seconds * 1000).toLocaleDateString() : 'Legacy';

            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.PaymentsInspectNode('${payment.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-emerald/30 group-hover:text-ma-emerald transition-all shrink-0">
                            <i class="fa-solid ${methodIcon} text-sm"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-slate-500 uppercase truncate tracking-widest mb-0.5">TX-${payment.id.substring(0, 8)}</p>
                            <p class="text-xs font-bold text-white truncate group-hover:text-ma-emerald transition">${method}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1 max-w-[200px]">
                        <span class="text-sm font-medium text-white truncate">${payment.clientEmail || 'Anonymous'}</span>
                        <p class="text-[10px] text-slate-500 line-clamp-1 italic">Ref: ${payment.description || 'N/A'}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-sm font-bold ${status === 'failed' || status === 'refunded' ? 'text-slate-500 line-through' : 'text-white'}">
                        $${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                </td>
                <td class="px-6 py-4">
                    ${statusMarkup}
                </td>
                <td class="px-6 py-4">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${dateStr}
                    </p>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2" onclick="event.stopPropagation()">
                        <button onclick="window.PaymentsInspectNode('${payment.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-emerald hover:border-ma-emerald/50 transition-all" title="Inspect Ledger">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button onclick="window.PaymentsDeleteNode('${payment.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all" title="Void Transaction">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    getMethodIcon(method) {
        const m = method.toLowerCase();
        if (m.includes('stripe') || m.includes('card')) return 'fa-credit-card';
        if (m.includes('crypto') || m.includes('btc') || m.includes('eth')) return 'fa-bitcoin fa-brands';
        if (m.includes('paypal')) return 'fa-paypal fa-brands';
        if (m.includes('bank')) return 'fa-building-columns';
        return 'fa-money-bill-wave';
    },

    setupListeners() {
        const searchInput = document.getElementById('payment-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.applyFilters(term, this.currentFilter);
            });
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                filterBtns.forEach(b => {
                    b.classList.remove('bg-ma-emerald', 'text-ma-dark', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-emerald', 'text-ma-dark', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('payment-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredPayments = this.allPayments.filter(p => {
            const email = (p.clientEmail || '').toLowerCase();
            const ref = (p.description || '').toLowerCase();
            const id = (p.id || '').toLowerCase();
            const matchesSearch = email.includes(searchTerm) || ref.includes(searchTerm) || id.includes(searchTerm);
            
            const pStatus = (p.status || 'pending').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'completed') matchesStatus = pStatus === 'completed' || pStatus === 'settled';
            else if (statusFilter === 'pending') matchesStatus = pStatus === 'pending' || pStatus === 'processing';
            else if (statusFilter === 'failed') matchesStatus = pStatus === 'failed' || pStatus === 'refunded';
            
            return matchesSearch && matchesStatus;
        });
        this.renderPaymentsTable(this.filteredPayments);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-wallet fa-fade text-4xl text-ma-emerald"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Financial_Ledgers...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Ledger Sync Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('payments')" class="px-8 py-3 rounded-xl bg-ma-emerald text-ma-dark text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-emerald/20 transition-all">Retry Connection</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.PaymentsToast = (msg, type = 'success') => {
            const container = document.getElementById('payments-toast-container');
            if(!container) return;
            
            const color = type === 'success' ? 'ma-emerald' : 'rose-500';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
            
            const toast = document.createElement('div');
            toast.className = `bg-ma-dark border border-${color}/30 text-white px-4 py-3 rounded-xl shadow-2xl shadow-black flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]`;
            toast.innerHTML = `
                <i class="fa-solid ${icon} text-${color}"></i>
                <span class="text-sm font-medium">${msg}</span>
            `;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        window.PaymentsExportData = () => {
            if(Payments.filteredPayments.length === 0) return window.PaymentsToast("No data to export", "error");
            
            let csv = "TransactionID,ClientEmail,Amount,Method,Status,Description,Date\n";
            Payments.filteredPayments.forEach(p => {
                let dateStr = '';
                if(p.createdAt) dateStr = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000).toISOString() : p.createdAt;
                
                const safeDesc = (p.description || '').replace(/"/g, '""');
                const email = p.clientEmail || '';
                
                csv += `"${p.id}","${email}","${p.amount||0}","${p.method||'Transfer'}","${p.status||'pending'}","${safeDesc}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Revenue_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.PaymentsToast("Ledger exported successfully.");
        };

        window.PaymentsCloseModal = () => {
            const container = document.getElementById('payments-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.PaymentsOpenProvisionModal = () => {
            const container = document.getElementById('payments-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar text-ma-emerald"></i> Record Transaction</h3>
                            <button onclick="window.PaymentsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.PaymentsSubmitProvision(event)" class="p-6 space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Amount ($)</label>
                                    <input type="number" step="0.01" id="prov-pay-amount" required placeholder="0.00" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Payment Method</label>
                                    <select id="prov-pay-method" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition cursor-pointer">
                                        <option value="Stripe">Stripe / Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Crypto">Crypto (BTC/ETH/USDT)</option>
                                        <option value="PayPal">PayPal</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Email</label>
                                <input type="email" id="prov-pay-email" required placeholder="client@domain.com" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Status</label>
                                <select id="prov-pay-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition cursor-pointer">
                                    <option value="completed">Completed / Settled</option>
                                    <option value="pending" selected>Pending Clearance</option>
                                    <option value="failed">Failed / Refunded</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Reference / Description</label>
                                <input type="text" id="prov-pay-desc" required placeholder="Invoice #INV-XYZ or Project Name" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4">
                                <button type="button" onclick="window.PaymentsCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-5 py-2.5 rounded-xl bg-ma-emerald hover:bg-emerald-500 text-ma-dark text-sm font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">Log Payment <i class="fa-solid fa-check"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.PaymentsSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            try {
                const data = {
                    amount: Number(document.getElementById('prov-pay-amount').value),
                    method: document.getElementById('prov-pay-method').value,
                    clientEmail: document.getElementById('prov-pay-email').value,
                    status: document.getElementById('prov-pay-status').value,
                    description: document.getElementById('prov-pay-desc').value,
                    adminNotes: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "payments"), data);
                window.PaymentsCloseModal();
                window.PaymentsToast("Transaction successfully logged.");
                Payments.init(); // Reload to refresh grid and stats
            } catch (err) {
                console.error(err);
                window.PaymentsToast("Logging failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Log Payment <i class="fa-solid fa-check"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.PaymentsInspectNode = (paymentId) => {
            const payment = Payments.allPayments.find(p => p.id === paymentId);
            if(!payment) return;

            const container = document.getElementById('payments-modal-container');
            const email = payment.clientEmail || 'Anonymous';
            const status = (payment.status || 'pending').toLowerCase();
            const amount = Number(payment.amount) || 0;
            const dateStr = payment.createdAt ? new Date(payment.createdAt.seconds * 1000).toLocaleString() : 'Legacy Data';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-file-invoice text-ma-emerald"></i> Ledger Inspector</h3>
                            <button onclick="window.PaymentsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Hero / Identity -->
                            <div class="flex flex-col items-center justify-center py-6 border-b border-white/5">
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Transaction Amount</p>
                                <h2 class="text-4xl font-display font-bold ${status === 'failed' || status === 'refunded' ? 'text-rose-500 line-through decoration-2' : 'text-white'} mb-2">
                                    $${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </h2>
                                <span class="text-[10px] font-mono text-ma-emerald uppercase tracking-widest bg-ma-emerald/10 px-3 py-1 rounded border border-ma-emerald/20">TX-${payment.id.substring(0,10)}</span>
                            </div>

                            <!-- Quick Controls -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Method</p>
                                    <p class="text-sm font-bold text-white">${payment.method || 'Transfer'}</p>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Clearing Status</p>
                                    <select onchange="window.PaymentsUpdateField('${payment.id}', 'status', this.value)" class="bg-transparent w-full text-xs font-bold focus:outline-none cursor-pointer ${status === 'completed' ? 'text-ma-emerald' : status === 'failed' ? 'text-rose-500' : 'text-amber-400'}">
                                        <option value="pending" class="bg-ma-dark text-white" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="completed" class="bg-ma-dark text-white" ${status === 'completed' || status === 'settled' ? 'selected' : ''}>Completed</option>
                                        <option value="failed" class="bg-ma-dark text-white" ${status === 'failed' || status === 'refunded' ? 'selected' : ''}>Failed/Refunded</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Details -->
                            <div class="space-y-4">
                                <div>
                                    <p class="text-[9px] font-mono uppercase text-slate-500 mb-1">Client Origin</p>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <input type="text" id="edit-pay-email-${payment.id}" value="${email}" class="bg-transparent w-full text-white text-sm focus:outline-none" placeholder="client@domain.com">
                                        <button onclick="window.PaymentsUpdateField('${payment.id}', 'clientEmail', document.getElementById('edit-pay-email-${payment.id}').value)" class="text-ma-emerald hover:text-white transition ml-2"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>

                                <div>
                                    <p class="text-[9px] font-mono uppercase text-slate-500 mb-1">Reference Details</p>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <input type="text" id="edit-pay-desc-${payment.id}" value="${payment.description || ''}" class="bg-transparent w-full text-white text-sm focus:outline-none" placeholder="Description...">
                                        <button onclick="window.PaymentsUpdateField('${payment.id}', 'description', document.getElementById('edit-pay-desc-${payment.id}').value)" class="text-ma-emerald hover:text-white transition ml-2"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>

                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Initiated</p>
                                    <p class="text-xs font-mono text-slate-400 bg-black/30 p-2 rounded-lg">${dateStr}</p>
                                </div>
                            </div>

                            <!-- Admin Log -->
                            <div>
                                <p class="text-[10px] font-mono uppercase text-ma-emerald tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-lock"></i> Financial Audit Log</p>
                                <div class="bg-ma-slate border border-white/5 rounded-xl p-1">
                                    <textarea id="edit-pay-notes-${payment.id}" rows="3" class="w-full bg-transparent text-sm text-slate-300 p-3 focus:outline-none resize-none leading-relaxed" placeholder="Internal notes, refund reasons, processing details...">${payment.adminNotes || ''}</textarea>
                                    <div class="flex justify-end p-2 border-t border-white/5">
                                        <button onclick="window.PaymentsUpdateField('${payment.id}', 'adminNotes', document.getElementById('edit-pay-notes-${payment.id}').value)" class="px-3 py-1.5 bg-ma-emerald/10 text-ma-emerald hover:bg-ma-emerald hover:text-ma-dark rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Push Log</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.PaymentsDeleteNode('${payment.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-trash-can group-hover:animate-bounce"></i> Void Transaction
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.PaymentsUpdateField = async (paymentId, field, value) => {
            try {
                await updateDoc(doc(db, "payments", paymentId), { [field]: value, updatedAt: serverTimestamp() });
                window.PaymentsToast(`Ledger updated: '${field}' synchronized.`);
                
                // Update local array quietly
                const item = Payments.allPayments.find(p => p.id === paymentId);
                if(item) item[field] = value;
                
                // Re-render UI seamlessly
                Payments.applyFilters(document.getElementById('payment-search')?.value.toLowerCase() || '', Payments.currentFilter);
                
                // Ensure stats update correctly without flicker if status/amount changed
                if(field === 'status' || field === 'amount') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Payments.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('payments-modal-container').innerHTML !== '') {
                            window.PaymentsInspectNode(paymentId); // Re-open
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.PaymentsToast("Ledger sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.PaymentsDeleteNode = (paymentId) => {
            const item = Payments.allPayments.find(p => p.id === paymentId);
            if(!item) return;

            const container = document.getElementById('payments-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Void Transaction</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently void transaction <span class="text-white font-bold">TX-${paymentId.substring(0,8)}</span>. This removes it entirely from revenue calculations.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "VOID" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.PaymentsInspectNode('${paymentId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.PaymentsExecuteDelete('${paymentId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.PaymentsExecuteDelete = async (paymentId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'VOID') {
                return window.PaymentsToast("Confirmation failed. Type VOID exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "payments", paymentId));
                window.PaymentsCloseModal();
                window.PaymentsToast("Transaction voided successfully.");
                Payments.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.PaymentsToast("Void failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'payments') {
        Payments.init();
    }
});