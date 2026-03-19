import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Client Billing Component - Advanced Financial Ledgers & Invoice Tracking
 */
const Billing = {
    allInvoices: [],
    filteredInvoices: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('client-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchInvoices();
            this.filteredInvoices = [...this.allInvoices];

            container.innerHTML = this.renderUI();
            this.renderInvoicesList(this.filteredInvoices);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Billing Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchInvoices() {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication node disconnected.");

        // Fetch Invoices assigned to this client
        const invoicesRef = collection(db, "invoices");
        // Ensure you have an index for clientEmail if needed, but simple equality works.
        const q = query(invoicesRef, where("clientEmail", "==", user.email));
        const snap = await getDocs(q);
        
        this.allInvoices = [];
        snap.forEach(doc => {
            this.allInvoices.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent issue date
        this.allInvoices.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        let totalBilled = 0;
        let totalSettled = 0;
        let outstanding = 0;
        let overdue = 0;

        this.allInvoices.forEach(inv => {
            const amount = Number(inv.total) || 0;
            const status = (inv.status || 'draft').toLowerCase();
            
            // Only count non-drafts for client visibility
            if (status !== 'draft') {
                totalBilled += amount;
                if (status === 'paid' || status === 'completed') {
                    totalSettled += amount;
                } else if (status === 'overdue') {
                    overdue += amount;
                    outstanding += amount;
                } else {
                    outstanding += amount;
                }
            }
        });

        return { totalBilled, totalSettled, outstanding, overdue };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative max-w-6xl mx-auto">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-file-invoice-dollar text-ma-emerald"></i> Financial Ledger
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Manage your payment methods, view past transactions, and settle outstanding balances.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.BillingExportData()" class="px-5 py-2.5 bg-ma-slate hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition flex items-center gap-2">
                            <i class="fa-solid fa-download text-ma-emerald"></i> Export Ledger
                        </button>
                        <button onclick="window.loadSection('billing')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-emerald transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Billed</p>
                            <h4 class="text-2xl font-display font-bold text-white">$${stats.totalBilled.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-calculator"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-ma-emerald/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Settled</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">$${stats.totalSettled.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border ${stats.outstanding > 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/5'} flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Outstanding Balance</p>
                            <h4 class="text-2xl font-display font-bold ${stats.outstanding > 0 ? 'text-amber-400' : 'text-white'}">$${stats.outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-hourglass-half"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border ${stats.overdue > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5'} flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Overdue Capital</p>
                            <h4 class="text-2xl font-display font-bold ${stats.overdue > 0 ? 'text-rose-500' : 'text-white'}">$${stats.overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    </div>
                </div>

                <!-- Filters & List Container -->
                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-emerald text-ma-dark shadow-lg transition whitespace-nowrap">All Invoices</button>
                            <button data-filter="pending" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Pending</button>
                            <button data-filter="paid" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Settled</button>
                            <button data-filter="overdue" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Overdue</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="billing-search" placeholder="Search INV ID or details..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-emerald/50 transition-all">
                        </div>
                    </div>

                    <!-- Invoices List -->
                    <div class="overflow-y-auto custom-scroll flex-1 bg-ma-dark/20 p-6">
                        <div id="invoices-list" class="space-y-4">
                            <!-- Rows injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="billing-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="billing-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderInvoicesList(invoices) {
        const list = document.getElementById('invoices-list');
        if (!list) return;

        // Filter out drafts for the client view
        const visibleInvoices = invoices.filter(inv => (inv.status || 'draft').toLowerCase() !== 'draft');

        if (visibleInvoices.length === 0) {
            list.innerHTML = `
                <div class="py-20 text-center flex flex-col items-center justify-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mb-4 shadow-lg">
                        <i class="fa-solid fa-receipt"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No active billing records found.</p>
                    <p class="text-xs text-slate-600 mt-1">Your financial ledger is currently clear.</p>
                </div>`;
            return;
        }

        list.innerHTML = visibleInvoices.map(inv => {
            const status = (inv.status || 'sent').toLowerCase();
            const total = Number(inv.total) || 0;
            const date = inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A';
            const shortId = `INV-${inv.id.substring(0, 6).toUpperCase()}`;

            let statusStyles = '';
            if (status === 'paid' || status === 'completed') {
                statusStyles = 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
            } else if (status === 'overdue') {
                statusStyles = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            } else {
                statusStyles = 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            }

            return `
            <div class="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-ma-emerald/30 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg" onclick="window.BillingInspectNode('${inv.id}')">
                
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-ma-emerald group-hover:scale-110 transition-all shrink-0 shadow-inner">
                        <i class="fa-solid fa-file-invoice"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-mono text-ma-emerald uppercase tracking-widest">${shortId}</span>
                            <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${statusStyles}">${status}</span>
                        </div>
                        <h4 class="text-sm font-bold text-white group-hover:text-ma-emerald transition-colors line-clamp-1">${inv.items && inv.items[0] ? inv.items[0].desc : 'Consulting & Services'}</h4>
                    </div>
                </div>

                <div class="flex items-center justify-between md:justify-end gap-8 border-t border-white/5 md:border-0 pt-4 md:pt-0">
                    <div class="text-left md:text-right">
                        <p class="text-[9px] font-mono uppercase text-slate-500 tracking-widest mb-0.5">Total Due</p>
                        <p class="text-lg font-display font-bold ${status === 'paid' ? 'text-ma-emerald' : 'text-white'}">$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <div class="text-left md:text-right hidden sm:block">
                        <p class="text-[9px] font-mono uppercase text-slate-500 tracking-widest mb-0.5">Due Date</p>
                        <p class="text-xs font-mono text-slate-300">${dueDate}</p>
                    </div>
                    <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-ma-emerald group-hover:text-ma-dark group-hover:border-ma-emerald transition-all shrink-0">
                        <i class="fa-solid fa-arrow-right -rotate-45"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('billing-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.applyFilters(term, this.currentFilter);
            });
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-ma-emerald', 'text-ma-dark', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-emerald', 'text-ma-dark', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('billing-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredInvoices = this.allInvoices.filter(inv => {
            const idMatch = (inv.id || '').toLowerCase().includes(searchTerm);
            const descMatch = inv.items && inv.items[0] && inv.items[0].desc.toLowerCase().includes(searchTerm);
            const matchesSearch = idMatch || descMatch;
            
            const iStatus = (inv.status || 'draft').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'paid') matchesStatus = iStatus === 'paid' || iStatus === 'completed';
            else if (statusFilter === 'pending') matchesStatus = iStatus === 'sent' || iStatus === 'pending';
            else if (statusFilter === 'overdue') matchesStatus = iStatus === 'overdue';
            
            return matchesSearch && matchesStatus;
        });
        this.renderInvoicesList(this.filteredInvoices);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-file-invoice-dollar fa-fade text-4xl text-ma-emerald"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Decrypting_Financial_Ledger...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Ledger Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('billing')" class="px-8 py-3 rounded-xl bg-ma-emerald text-ma-dark text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-emerald/20 transition-all">Retry Decryption</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.BillingToast = (msg, type = 'success') => {
            const container = document.getElementById('billing-toast-container');
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

        window.BillingExportData = () => {
            const visible = Billing.filteredInvoices.filter(inv => (inv.status || 'draft').toLowerCase() !== 'draft');
            if(visible.length === 0) return window.BillingToast("No data to export", "error");
            
            let csv = "InvoiceID,PrimaryItem,Total,Status,DueDate\n";
            visible.forEach(inv => {
                const date = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
                const item = inv.items && inv.items[0] ? inv.items[0].desc.replace(/"/g, '""') : 'Services';
                csv += `"${inv.id}","${item}","${inv.total||0}","${inv.status||'sent'}","${date}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `My_Billing_History_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.BillingToast("Financial ledger exported successfully.");
        };

        window.BillingCloseModal = () => {
            const container = document.getElementById('billing-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- SIMULATED STRIPE CHECKOUT ---
        window.BillingProcessPayment = (invoiceId) => {
            const btn = document.getElementById('pay-now-btn');
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing Gateway...';
            }
            
            // Because clients shouldn't directly update invoice status via a blind click (security risk),
            // this simulates a redirect to a secure payment processor (like Stripe Checkout).
            setTimeout(() => {
                window.BillingCloseModal();
                window.BillingToast("Redirecting to secure 256-bit payment gateway...");
            }, 1500);
        };

        // --- INSPECT MODAL (Client View - Read Only & Pay) ---
        window.BillingInspectNode = (invoiceId) => {
            const inv = Billing.allInvoices.find(i => i.id === invoiceId);
            if(!inv) return;

            const container = document.getElementById('billing-modal-container');
            const status = (inv.status || 'sent').toLowerCase();
            const shortId = `INV-${inv.id.substring(0, 6).toUpperCase()}`;
            const subtotal = Number(inv.subtotal) || 0;
            const tax = Number(inv.tax) || 0;
            const total = Number(inv.total) || 0;
            const issueDate = inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A';
            const items = inv.items || [];

            let statusStyles = '';
            let isPaid = false;
            if (status === 'paid' || status === 'completed') {
                statusStyles = 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
                isPaid = true;
            } else if (status === 'overdue') {
                statusStyles = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            } else {
                statusStyles = 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            }

            const itemRows = items.map(item => `
                <div class="flex justify-between items-start py-3 border-b border-white/5 last:border-0">
                    <div class="flex-1 pr-4">
                        <p class="text-sm text-slate-300">${item.desc}</p>
                        <p class="text-[10px] text-slate-500 font-mono mt-1">Qty: ${item.qty} &times; $${Number(item.price).toFixed(2)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-white">$${(item.qty * item.price).toFixed(2)}</p>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-file-invoice-dollar text-ma-emerald"></i> Billing Statement</h3>
                            <button onclick="window.BillingCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6 relative">
                            <!-- Background Glow -->
                            <div class="absolute -right-20 top-0 w-64 h-64 bg-ma-emerald/5 rounded-full blur-3xl pointer-events-none z-0"></div>
                            
                            <!-- Header / Title -->
                            <div class="relative z-10 text-center pb-6 border-b border-white/5">
                                <span class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${statusStyles} mb-4 inline-block">
                                    ${status}
                                </span>
                                <p class="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Total Amount Due</p>
                                <h2 class="text-4xl font-display font-bold ${isPaid ? 'text-ma-emerald' : 'text-white'}">$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">${shortId}</p>
                            </div>

                            <!-- Dates -->
                            <div class="grid grid-cols-2 gap-4 relative z-10">
                                <div class="bg-black/30 rounded-xl p-3 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Issue Date</p>
                                    <p class="text-sm font-bold text-slate-300">${issueDate}</p>
                                </div>
                                <div class="bg-black/30 rounded-xl p-3 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Due Date</p>
                                    <p class="text-sm font-bold ${status === 'overdue' ? 'text-rose-500' : 'text-slate-300'}">${dueDate}</p>
                                </div>
                            </div>

                            <!-- Line Items -->
                            <div class="relative z-10">
                                <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-list"></i> Detailed Deliverables</p>
                                <div class="bg-ma-slate border border-white/5 rounded-xl p-2 px-4 shadow-inner">
                                    ${itemRows}
                                </div>
                            </div>

                            <!-- Calculations -->
                            <div class="relative z-10 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <div class="flex justify-between items-center mb-2 text-sm text-slate-400">
                                    <span>Subtotal</span>
                                    <span class="font-mono">$${subtotal.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between items-center mb-4 text-sm text-slate-400">
                                    <span>Tax</span>
                                    <span class="font-mono">$${tax.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between items-center pt-3 border-t border-white/10">
                                    <span class="text-sm font-bold text-white uppercase tracking-widest">Total</span>
                                    <span class="text-xl font-display font-bold ${isPaid ? 'text-ma-emerald' : 'text-white'}">$${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <!-- Notes / Terms -->
                            <div class="relative z-10 text-center pt-4">
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Official Terms</p>
                                <p class="text-xs text-slate-400 italic">"${inv.notes || 'Payment is securely processed via 256-bit encryption. Thank you for your business.'}"</p>
                            </div>

                        </div>
                        
                        <!-- Client Footer Actions -->
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.loadSection('support'); window.BillingCloseModal();" class="w-14 shrink-0 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center justify-center group" title="Dispute / Question">
                                <i class="fa-solid fa-flag"></i>
                            </button>
                            ${isPaid 
                                ? `<button disabled class="flex-1 py-3 rounded-xl bg-ma-emerald/10 text-ma-emerald text-sm font-bold uppercase tracking-widest border border-ma-emerald/20 cursor-not-allowed flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-check"></i> Settled
                                   </button>`
                                : `<button id="pay-now-btn" onclick="window.BillingProcessPayment('${inv.id}')" class="flex-1 py-3 rounded-xl bg-ma-emerald hover:bg-emerald-500 text-ma-dark text-sm font-bold uppercase tracking-widest transition shadow-lg shadow-ma-emerald/20 flex items-center justify-center gap-2">
                                    <i class="fa-brands fa-stripe"></i> Process Payment
                                   </button>`
                            }
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };
    }
};

// Listen for Section Loads
window.addEventListener('client-section-load', (e) => {
    if (e.detail.section === 'billing') {
        Billing.init();
    }
});