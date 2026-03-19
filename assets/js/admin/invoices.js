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

// Admin Contact Constants for Invoice Generation
const ADMIN_DETAILS = {
    name: "Mubashir Arham",
    company: "MA Digital Control Center",
    address: "Dera Ghazi Khan, Punjab, Pakistan",
    email: "mubashirarham12@gmail.com",
    phone: "+92 370 1722964"
};

/**
 * Invoices Component - Advanced Billing & Template Generation
 */
const Invoices = {
    allInvoices: [],
    filteredInvoices: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchInvoices();
            this.filteredInvoices = [...this.allInvoices];

            container.innerHTML = this.renderUI();
            this.renderInvoicesTable(this.filteredInvoices);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Invoices Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchInvoices() {
        const snap = await getDocs(collection(db, "invoices"));
        this.allInvoices = [];
        snap.forEach(doc => {
            this.allInvoices.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allInvoices.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const totalVolume = this.allInvoices.length;
        
        let totalBilled = 0;
        let totalPaid = 0;
        let pending = 0;
        let overdue = 0;

        this.allInvoices.forEach(inv => {
            const amount = Number(inv.total) || 0;
            const status = (inv.status || 'draft').toLowerCase();
            
            totalBilled += amount;
            
            if (status === 'paid' || status === 'completed') {
                totalPaid += amount;
            } else if (status === 'sent' || status === 'pending') {
                pending += amount;
            } else if (status === 'overdue') {
                overdue += amount;
            }
        });

        return { totalVolume, totalBilled, totalPaid, pending, overdue };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-file-invoice-dollar text-ma-indigo"></i> Billing & Invoices
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Generate dynamic HTML invoices, track receivables, and enforce payment schedules.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.InvoicesExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Data
                        </button>
                        <button onclick="window.InvoicesOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Generate Invoice
                        </button>
                        <button onclick="window.loadSection('invoices')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Billed</p>
                            <h4 class="text-2xl font-display font-bold text-white">$${stats.totalBilled.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-calculator"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Collected</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">$${stats.totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Pending Collection</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">$${stats.pending.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-hourglass-half"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Overdue Capital</p>
                            <h4 class="text-2xl font-display font-bold text-rose-500">$${stats.overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition">All</button>
                            <button data-filter="paid" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Paid</button>
                            <button data-filter="sent" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Sent</button>
                            <button data-filter="overdue" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Overdue</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="invoice-search" placeholder="Search client or INV ID..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Invoice ID</th>
                                    <th class="px-6 py-4 font-medium">Client Detail</th>
                                    <th class="px-6 py-4 font-medium">Total Value</th>
                                    <th class="px-6 py-4 font-medium">Due Date</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invoices-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="invoices-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="invoices-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderInvoicesTable(invoices) {
        const tbody = document.getElementById('invoices-table-body');
        if (!tbody) return;

        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-file-invoice"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No invoices generated yet.</p>
                        <p class="text-xs text-slate-600 mt-1">Initialize your first billing statement above.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = invoices.map(inv => {
            const status = (inv.status || 'draft').toLowerCase();
            const total = Number(inv.total) || 0;
            const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A';
            const shortId = `INV-${inv.id.substring(0, 6).toUpperCase()}`;
            
            let statusMarkup = '';
            if (status === 'paid') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-ma-emerald bg-ma-emerald/10 border border-ma-emerald/20 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-check"></i> Paid</span>`;
            } else if (status === 'overdue') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-triangle-exclamation animate-pulse"></i> Overdue</span>`;
            } else if (status === 'sent' || status === 'pending') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-paper-plane"></i> Sent</span>`;
            } else {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-file-pen"></i> Draft</span>`;
            }

            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.InvoicesInspectNode('${inv.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-indigo/30 group-hover:text-ma-indigo transition-all shrink-0">
                            <i class="fa-solid fa-file-invoice-dollar text-sm"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-xs font-bold text-white truncate group-hover:text-ma-indigo transition">${shortId}</p>
                            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">${inv.template || 'Default'} TPL</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1 max-w-[200px]">
                        <span class="text-sm font-medium text-white truncate">${inv.clientName || 'Unknown Client'}</span>
                        <p class="text-[10px] text-slate-500 line-clamp-1 italic">${inv.clientEmail || 'No Email'}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-sm font-bold ${status === 'paid' ? 'text-ma-emerald' : 'text-white'}">
                        $${total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${dueDate}
                    </p>
                </td>
                <td class="px-6 py-4">
                    ${statusMarkup}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2" onclick="event.stopPropagation()">
                        <button onclick="window.InvoicesPreviewNode('${inv.id}')" class="w-8 h-8 rounded-lg bg-ma-indigo/10 border border-ma-indigo/20 flex items-center justify-center text-ma-indigo hover:bg-ma-indigo hover:text-white transition-all" title="Render Template">
                            <i class="fa-solid fa-desktop text-xs"></i>
                        </button>
                        <button onclick="window.InvoicesInspectNode('${inv.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all" title="Edit Settings">
                            <i class="fa-solid fa-gear text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('invoice-search');
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
                    b.classList.remove('bg-ma-indigo', 'text-white', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-indigo', 'text-white', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('invoice-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredInvoices = this.allInvoices.filter(inv => {
            const email = (inv.clientEmail || '').toLowerCase();
            const name = (inv.clientName || '').toLowerCase();
            const id = (inv.id || '').toLowerCase();
            const matchesSearch = email.includes(searchTerm) || name.includes(searchTerm) || id.includes(searchTerm);
            
            const iStatus = (inv.status || 'draft').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'paid') matchesStatus = iStatus === 'paid' || iStatus === 'completed';
            else if (statusFilter === 'sent') matchesStatus = iStatus === 'sent' || iStatus === 'pending';
            else if (statusFilter === 'overdue') matchesStatus = iStatus === 'overdue';
            
            return matchesSearch && matchesStatus;
        });
        this.renderInvoicesTable(this.filteredInvoices);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-file-invoice fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Compiling_Financial_Templates...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Template Compilation Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('invoices')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Rendering</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // INVOICE TEMPLATE HTML GENERATORS
    // ------------------------------------------------------------------------
    generateInvoiceHTML(inv) {
        const shortId = `INV-${inv.id.substring(0, 6).toUpperCase()}`;
        const issueDate = inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString();
        const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A';
        const items = inv.items || [];
        const subtotal = Number(inv.subtotal) || 0;
        const tax = Number(inv.tax) || 0;
        const total = Number(inv.total) || 0;
        const template = (inv.template || 'cyber').toLowerCase();

        // 1. CYBER NODE (Dark Mode)
        if (template === 'cyber') {
            let rows = items.map(item => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 15px 0; color: #f8fafc;">${item.desc}</td>
                    <td style="padding: 15px 0; text-align: center; color: #94a3b8;">${item.qty}</td>
                    <td style="padding: 15px 0; text-align: right; color: #94a3b8;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 15px 0; text-align: right; color: #f8fafc; font-weight: bold;">$${(item.qty * item.price).toFixed(2)}</td>
                </tr>
            `).join('');

            return `
            <div style="background-color: #020617; color: #f8fafc; font-family: 'Inter', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; border: 1px solid rgba(99, 102, 241, 0.2); box-shadow: 0 0 40px rgba(99,102,241,0.05); border-radius: 16px; position: relative; overflow: hidden;">
                <!-- Decorative Glows -->
                <div style="position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: rgba(99,102,241,0.15); filter: blur(80px); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -100px; right: -100px; width: 300px; height: 300px; background: rgba(16,185,129,0.1); filter: blur(80px); border-radius: 50%;"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; position: relative; z-index: 10;">
                    <div>
                        <h1 style="margin: 0; font-family: 'Lexend', sans-serif; font-size: 28px; color: #6366f1; letter-spacing: -1px; display:flex; align-items:center; gap:10px;">
                            <span style="display:inline-block; width: 32px; height: 32px; background: #6366f1; color: white; border-radius: 8px; text-align: center; line-height: 32px; font-size: 16px;">MA</span>
                            ${ADMIN_DETAILS.company}
                        </h1>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${ADMIN_DETAILS.name}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${ADMIN_DETAILS.email}</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${ADMIN_DETAILS.phone}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 36px; font-family: 'Lexend', sans-serif; color: white; text-transform: uppercase; letter-spacing: 2px;">INVOICE</h2>
                        <p style="margin: 5px 0 0 0; font-family: monospace; color: #10b981; letter-spacing: 2px;">#${shortId}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; position: relative; z-index: 10;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Billed To</p>
                        <h3 style="margin: 0 0 5px 0; color: white; font-size: 16px;">${inv.clientName}</h3>
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">${inv.clientEmail}</p>
                        ${inv.clientAddress ? `<p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">${inv.clientAddress}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <p style="margin: 0 0 5px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Issue Date</p>
                        <p style="margin: 0 0 15px 0; color: white; font-size: 14px; font-weight: bold;">${issueDate}</p>
                        <p style="margin: 0 0 5px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Due Date</p>
                        <p style="margin: 0; color: #ef4444; font-size: 14px; font-weight: bold;">${dueDate}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; position: relative; z-index: 10;">
                    <thead>
                        <tr style="border-bottom: 2px solid rgba(99,102,241,0.3);">
                            <th style="text-align: left; padding-bottom: 10px; color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
                            <th style="text-align: center; padding-bottom: 10px; color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                            <th style="text-align: right; padding-bottom: 10px; color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Rate</th>
                            <th style="text-align: right; padding-bottom: 10px; color: #6366f1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div style="display: flex; justify-content: flex-end; position: relative; z-index: 10;">
                    <div style="width: 300px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #94a3b8; font-size: 14px;">
                            <span>Subtotal</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: #94a3b8; font-size: 14px;">
                            <span>Tax</span>
                            <span>$${tax.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); color: white; font-size: 20px; font-weight: bold; font-family: 'Lexend', sans-serif;">
                            <span>Total</span>
                            <span style="color: #10b981;">$${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 60px; padding-top: 20px; border-top: 1px dashed rgba(255,255,255,0.1); text-align: center; color: #64748b; font-size: 11px; position: relative; z-index: 10;">
                    <p style="margin: 0 0 5px 0;">${inv.notes || 'Thank you for your business. Payment is due within standard terms.'}</p>
                    <p style="margin: 0;">Crypto (USDT/ETH) and wire transfers accepted. Reference #${shortId} on all payments.</p>
                </div>
            </div>
            `;
        } 
        // 2. CLEAN PRINT (Light Mode)
        else if (template === 'clean') {
            let rows = items.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0; color: #0f172a;">${item.desc}</td>
                    <td style="padding: 12px 0; text-align: center; color: #475569;">${item.qty}</td>
                    <td style="padding: 12px 0; text-align: right; color: #475569;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600;">$${(item.qty * item.price).toFixed(2)}</td>
                </tr>
            `).join('');

            return `
            <div style="background-color: white; color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 50px; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px;">
                    <div>
                        <h1 style="margin: 0 0 5px 0; font-size: 24px; color: #0f172a; letter-spacing: -0.5px;">${ADMIN_DETAILS.company}</h1>
                        <p style="margin: 2px 0; font-size: 12px; color: #475569;">${ADMIN_DETAILS.address}</p>
                        <p style="margin: 2px 0; font-size: 12px; color: #475569;">${ADMIN_DETAILS.email} | ${ADMIN_DETAILS.phone}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; font-size: 32px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Invoice</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #64748b; font-weight: bold;">#${shortId}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div style="width: 50%;">
                        <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Bill To</h3>
                        <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 14px;">${inv.clientName}</p>
                        <p style="margin: 0 0 3px 0; font-size: 12px; color: #475569;">${inv.clientEmail}</p>
                        ${inv.clientAddress ? `<p style="margin: 0; font-size: 12px; color: #475569;">${inv.clientAddress}</p>` : ''}
                    </div>
                    <div style="width: 30%; text-align: right;">
                        <table style="width: 100%; font-size: 12px;">
                            <tr><td style="color: #64748b; padding: 3px 0;">Date:</td><td style="font-weight: bold;">${issueDate}</td></tr>
                            <tr><td style="color: #64748b; padding: 3px 0;">Due Date:</td><td style="font-weight: bold; color: #dc2626;">${dueDate}</td></tr>
                        </table>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #0f172a; text-align: left;">
                            <th style="padding-bottom: 10px; font-size: 12px; color: #0f172a;">Description</th>
                            <th style="padding-bottom: 10px; font-size: 12px; color: #0f172a; text-align: center;">Qty</th>
                            <th style="padding-bottom: 10px; font-size: 12px; color: #0f172a; text-align: right;">Rate</th>
                            <th style="padding-bottom: 10px; font-size: 12px; color: #0f172a; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 250px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #475569;">
                            <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #475569;">
                            <span>Tax</span><span>$${tax.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #0f172a; font-size: 18px; font-weight: bold; color: #0f172a;">
                            <span>Total Due</span><span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 60px; font-size: 11px; color: #64748b;">
                    <p style="font-weight: bold; color: #0f172a; margin: 0 0 5px 0;">Notes & Terms:</p>
                    <p style="margin: 0;">${inv.notes || 'Please send payment within the stated terms. Thank you for your business.'}</p>
                </div>
            </div>
            `;
        }
        // 3. CORPORATE (Elegant)
        else {
            let rows = items.map(item => `
                <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 15px; color: #334155;">${item.desc}</td>
                    <td style="padding: 15px; text-align: center; color: #64748b;">${item.qty}</td>
                    <td style="padding: 15px; text-align: right; color: #64748b;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 15px; text-align: right; color: #1e293b; font-weight: 600;">$${(item.qty * item.price).toFixed(2)}</td>
                </tr>
            `).join('');

            return `
            <div style="background-color: #f8fafc; color: #1e293b; font-family: 'Times New Roman', Times, serif; padding: 0; max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">
                <!-- Header Block -->
                <div style="background-color: #1e293b; color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 1px;">${ADMIN_DETAILS.company}</h1>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8; font-family: Arial, sans-serif;">${ADMIN_DETAILS.address}</p>
                    </div>
                    <div style="text-align: right; font-family: Arial, sans-serif;">
                        <h2 style="margin: 0; font-size: 14px; font-weight: normal; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Invoice No.</h2>
                        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: white;">${shortId}</p>
                    </div>
                </div>

                <div style="padding: 40px; font-family: Arial, sans-serif;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                        <div>
                            <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Prepared For</p>
                            <h3 style="margin: 0 0 4px 0; color: #1e293b; font-size: 16px;">${inv.clientName}</h3>
                            <p style="margin: 0; font-size: 13px; color: #475569;">${inv.clientEmail}</p>
                            ${inv.clientAddress ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${inv.clientAddress}</p>` : ''}
                        </div>
                        <div style="text-align: right; background: #f1f5f9; padding: 15px; border-radius: 8px;">
                            <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Issue Date: <span style="color: #1e293b; font-weight: bold; margin-left: 10px;">${issueDate}</span></p>
                            <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Due Date: <span style="color: #1e293b; font-weight: bold; margin-left: 10px;">${dueDate}</span></p>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #e2e8f0;">
                        <thead>
                            <tr style="background-color: #f1f5f9;">
                                <th style="text-align: left; padding: 15px; color: #1e293b; font-size: 12px; text-transform: uppercase;">Description</th>
                                <th style="text-align: center; padding: 15px; color: #1e293b; font-size: 12px; text-transform: uppercase;">Qty</th>
                                <th style="text-align: right; padding: 15px; color: #1e293b; font-size: 12px; text-transform: uppercase;">Price</th>
                                <th style="text-align: right; padding: 15px; color: #1e293b; font-size: 12px; text-transform: uppercase;">Total</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>

                    <div style="display: flex; justify-content: flex-end;">
                        <div style="width: 300px; background: #f1f5f9; padding: 20px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #475569; font-size: 14px;">
                                <span>Subtotal</span><span>$${subtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: #475569; font-size: 14px;">
                                <span>Tax</span><span>$${tax.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid #cbd5e1; color: #1e293b; font-size: 20px; font-weight: bold;">
                                <span>Total Due</span><span>$${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 50px; font-size: 12px; color: #475569;">
                        <p style="font-weight: bold; color: #1e293b; margin: 0 0 5px 0;">Payment Instructions</p>
                        <p style="margin: 0;">${inv.notes || 'Please process payment within the stipulated timeframe.'}</p>
                    </div>
                </div>
            </div>
            `;
        }
    },


    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.InvoicesToast = (msg, type = 'success') => {
            const container = document.getElementById('invoices-toast-container');
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

        window.InvoicesExportData = () => {
            if(Invoices.filteredInvoices.length === 0) return window.InvoicesToast("No data to export", "error");
            
            let csv = "InvoiceID,ClientName,ClientEmail,Subtotal,Tax,Total,Status,DueDate\n";
            Invoices.filteredInvoices.forEach(inv => {
                const date = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
                const safeName = (inv.clientName || '').replace(/"/g, '""');
                csv += `"${inv.id}","${safeName}","${inv.clientEmail||''}","${inv.subtotal||0}","${inv.tax||0}","${inv.total||0}","${inv.status||'draft'}","${date}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Invoices_Export_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.InvoicesToast("Billing data exported successfully.");
        };

        window.InvoicesCloseModal = () => {
            const container = document.getElementById('invoices-modal-container');
            if(container) container.innerHTML = '';
        };

        // Line Item Logic for Provision Form
        window.InvoicesAddLineItem = () => {
            const container = document.getElementById('invoice-items-container');
            const row = document.createElement('div');
            row.className = "flex gap-2 items-start invoice-line-item animate-[fadeIn_0.2s_ease-out]";
            row.innerHTML = `
                <div class="flex-1"><input type="text" placeholder="Description" required class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-desc"></div>
                <div class="w-20"><input type="number" placeholder="Qty" required min="1" value="1" class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-qty" oninput="window.InvoicesCalculateTotals()"></div>
                <div class="w-24"><input type="number" placeholder="Price" required min="0" step="0.01" class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-price" oninput="window.InvoicesCalculateTotals()"></div>
                <button type="button" onclick="this.parentElement.remove(); window.InvoicesCalculateTotals();" class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center justify-center shrink-0 border border-rose-500/20"><i class="fa-solid fa-xmark"></i></button>
            `;
            container.appendChild(row);
        };

        window.InvoicesCalculateTotals = () => {
            const rows = document.querySelectorAll('.invoice-line-item');
            let subtotal = 0;
            rows.forEach(row => {
                const qty = Number(row.querySelector('.item-qty').value) || 0;
                const price = Number(row.querySelector('.item-price').value) || 0;
                subtotal += (qty * price);
            });
            
            const taxRate = Number(document.getElementById('prov-inv-tax').value) || 0;
            const taxAmount = subtotal * (taxRate / 100);
            const total = subtotal + taxAmount;

            document.getElementById('display-subtotal').innerText = `$${subtotal.toFixed(2)}`;
            document.getElementById('display-total').innerText = `$${total.toFixed(2)}`;
        };

        // --- PROVISION MODAL (Create) ---
        window.InvoicesOpenProvisionModal = () => {
            const container = document.getElementById('invoices-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-file-invoice text-ma-indigo"></i> Generate Invoice</h3>
                            <button onclick="window.InvoicesCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.InvoicesSubmitProvision(event)" class="flex-1 overflow-y-auto custom-scroll flex flex-col">
                            <div class="p-6 space-y-6 flex-1">
                                
                                <!-- Client & Config -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Name</label>
                                        <input type="text" id="prov-inv-name" required placeholder="John Doe" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Email</label>
                                        <input type="email" id="prov-inv-email" required placeholder="client@domain.com" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Due Date</label>
                                        <input type="date" id="prov-inv-due" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition" style="color-scheme: dark;">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">HTML Graphic Template</label>
                                        <select id="prov-inv-template" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                            <option value="cyber">Cyber Node (Dark / Glassmorphism)</option>
                                            <option value="clean">Clean Print (Light / PDF Ready)</option>
                                            <option value="corporate">Corporate (Elegant / Slate)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Status</label>
                                        <select id="prov-inv-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="sent">Sent (Pending)</option>
                                            <option value="paid">Paid (Settled)</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Line Items -->
                                <div class="bg-ma-slate/50 border border-white/5 rounded-2xl p-4">
                                    <div class="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                        <p class="text-[10px] font-mono uppercase text-slate-400 tracking-widest">Line Items</p>
                                        <button type="button" onclick="window.InvoicesAddLineItem()" class="text-ma-indigo hover:text-white text-xs font-bold transition flex items-center gap-1"><i class="fa-solid fa-plus"></i> Add Item</button>
                                    </div>
                                    <div id="invoice-items-container" class="space-y-2">
                                        <!-- Initial Row -->
                                        <div class="flex gap-2 items-start invoice-line-item">
                                            <div class="flex-1"><input type="text" placeholder="Description (e.g. Web Dev Phase 1)" required class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-desc"></div>
                                            <div class="w-20"><input type="number" placeholder="Qty" required min="1" value="1" class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-qty" oninput="window.InvoicesCalculateTotals()"></div>
                                            <div class="w-24"><input type="number" placeholder="Price" required min="0" step="0.01" class="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-ma-indigo item-price" oninput="window.InvoicesCalculateTotals()"></div>
                                            <button type="button" onclick="this.parentElement.remove(); window.InvoicesCalculateTotals();" class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center justify-center shrink-0 border border-rose-500/20"><i class="fa-solid fa-xmark"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Calculations & Notes -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Payment Notes / Terms</label>
                                        <textarea id="prov-inv-notes" rows="4" placeholder="Bank details, wire instructions..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                                    </div>
                                    <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="text-xs text-slate-400">Subtotal:</span>
                                            <span id="display-subtotal" class="text-sm text-white font-mono">$0.00</span>
                                        </div>
                                        <div class="flex justify-between items-center mb-4">
                                            <span class="text-xs text-slate-400">Tax (%):</span>
                                            <input type="number" id="prov-inv-tax" value="0" min="0" max="100" class="w-16 bg-black/50 border border-white/10 rounded px-2 py-1 text-white text-xs text-right focus:outline-none focus:border-ma-indigo" oninput="window.InvoicesCalculateTotals()">
                                        </div>
                                        <div class="flex justify-between items-center pt-3 border-t border-white/10">
                                            <span class="text-sm font-bold text-white uppercase tracking-widest">Total Due:</span>
                                            <span id="display-total" class="text-xl font-display font-bold text-ma-emerald">$0.00</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex justify-end gap-3">
                                <button type="button" onclick="window.InvoicesCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Compile Invoice <i class="fa-solid fa-file-export"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.InvoicesSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling...';

            try {
                // Gather line items
                const rows = document.querySelectorAll('.invoice-line-item');
                const items = [];
                let subtotal = 0;
                rows.forEach(row => {
                    const desc = row.querySelector('.item-desc').value;
                    const qty = Number(row.querySelector('.item-qty').value) || 0;
                    const price = Number(row.querySelector('.item-price').value) || 0;
                    items.push({ desc, qty, price });
                    subtotal += (qty * price);
                });

                if(items.length === 0) throw new Error("At least one line item is required.");

                const taxRate = Number(document.getElementById('prov-inv-tax').value) || 0;
                const taxAmount = subtotal * (taxRate / 100);
                const total = subtotal + taxAmount;

                const data = {
                    clientName: document.getElementById('prov-inv-name').value,
                    clientEmail: document.getElementById('prov-inv-email').value,
                    dueDate: document.getElementById('prov-inv-due').value,
                    template: document.getElementById('prov-inv-template').value,
                    status: document.getElementById('prov-inv-status').value,
                    notes: document.getElementById('prov-inv-notes').value,
                    items: items,
                    subtotal: subtotal,
                    tax: taxAmount,
                    total: total,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "invoices"), data);
                window.InvoicesCloseModal();
                window.InvoicesToast("Invoice successfully compiled and stored.");
                Invoices.init(); // Reload
            } catch (err) {
                console.error(err);
                window.InvoicesToast(err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Compile Invoice <i class="fa-solid fa-file-export"></i>';
            }
        };

        // --- PREVIEW MODAL (The HTML Graphic Renderer) ---
        window.InvoicesPreviewNode = (invoiceId) => {
            const inv = Invoices.allInvoices.find(i => i.id === invoiceId);
            if(!inv) return;

            const htmlContent = Invoices.generateInvoiceHTML(inv);
            const container = document.getElementById('invoices-modal-container');

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col h-[95vh] overflow-hidden">
                        
                        <!-- Header / Controls -->
                        <div class="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between bg-ma-slate shrink-0 gap-4">
                            <div>
                                <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-desktop text-ma-indigo"></i> Graphic Preview</h3>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Template: ${inv.template || 'Cyber'}</p>
                            </div>
                            <div class="flex gap-3">
                                <button onclick="window.InvoicesPrintPreview()" class="px-5 py-2.5 rounded-xl bg-ma-emerald text-ma-dark text-xs font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">
                                    <i class="fa-solid fa-print"></i> Print / PDF
                                </button>
                                <button onclick="window.InvoicesCloseModal()" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                        </div>
                        
                        <!-- Canvas / Render Area -->
                        <div class="flex-1 overflow-y-auto p-4 md:p-8 bg-ma-dark" id="invoice-print-area">
                            ${htmlContent}
                        </div>
                    </div>
                </div>
            `;
        };

        window.InvoicesPrintPreview = () => {
            const printContent = document.getElementById('invoice-print-area').innerHTML;
            const originalBody = document.body.innerHTML;
            
            // Swap body for printing
            document.body.innerHTML = printContent;
            window.print();
            
            // Restore app
            document.body.innerHTML = originalBody;
            
            // Re-bind events by softly reloading section
            window.loadSection('invoices');
        };

        // --- INSPECT MODAL (Settings / Settings Edit) ---
        window.InvoicesInspectNode = (invoiceId) => {
            const inv = Invoices.allInvoices.find(i => i.id === invoiceId);
            if(!inv) return;

            const container = document.getElementById('invoices-modal-container');
            const status = (inv.status || 'draft').toLowerCase();

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-gear text-ma-indigo"></i> Config Inspector</h3>
                            <button onclick="window.InvoicesCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Hero / Total -->
                            <div class="flex flex-col items-center justify-center py-6 border-b border-white/5">
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Invoice Total</p>
                                <h2 class="text-4xl font-display font-bold text-white mb-2">$${Number(inv.total||0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                                <span class="text-[10px] font-mono text-ma-indigo uppercase tracking-widest bg-ma-indigo/10 px-3 py-1 rounded border border-ma-indigo/20">INV-${inv.id.substring(0,8)}</span>
                            </div>

                            <!-- Controls -->
                            <div class="space-y-4">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">State / Status</p>
                                    <select onchange="window.InvoicesUpdateField('${inv.id}', 'status', this.value)" class="bg-transparent w-full text-sm font-bold focus:outline-none cursor-pointer ${status === 'paid' ? 'text-ma-emerald' : status === 'overdue' ? 'text-rose-500' : status === 'sent' ? 'text-amber-400' : 'text-white'}">
                                        <option value="draft" class="bg-ma-dark text-white" ${status === 'draft' ? 'selected' : ''}>Draft</option>
                                        <option value="sent" class="bg-ma-dark text-white" ${status === 'sent' ? 'selected' : ''}>Sent (Pending)</option>
                                        <option value="overdue" class="bg-ma-dark text-white" ${status === 'overdue' ? 'selected' : ''}>Overdue</option>
                                        <option value="paid" class="bg-ma-dark text-white" ${status === 'paid' ? 'selected' : ''}>Paid (Settled)</option>
                                    </select>
                                </div>

                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">HTML Template Override</p>
                                    <select onchange="window.InvoicesUpdateField('${inv.id}', 'template', this.value)" class="bg-transparent w-full text-sm font-bold text-white focus:outline-none cursor-pointer">
                                        <option value="cyber" class="bg-ma-dark text-white" ${inv.template === 'cyber' ? 'selected' : ''}>Cyber Node (Dark)</option>
                                        <option value="clean" class="bg-ma-dark text-white" ${inv.template === 'clean' ? 'selected' : ''}>Clean Print (Light)</option>
                                        <option value="corporate" class="bg-ma-dark text-white" ${inv.template === 'corporate' ? 'selected' : ''}>Corporate (Elegant)</option>
                                    </select>
                                </div>

                                <div>
                                    <p class="text-[9px] font-mono uppercase text-slate-500 mb-1">Due Date</p>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <input type="date" id="edit-inv-due-${inv.id}" value="${inv.dueDate || ''}" class="bg-transparent w-full text-white text-sm focus:outline-none" style="color-scheme: dark;">
                                        <button onclick="window.InvoicesUpdateField('${inv.id}', 'dueDate', document.getElementById('edit-inv-due-${inv.id}').value)" class="text-ma-indigo hover:text-white transition ml-2"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.InvoicesDeleteNode('${inv.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-trash-can group-hover:animate-bounce"></i> Void Document
                            </button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.InvoicesUpdateField = async (invoiceId, field, value) => {
            try {
                await updateDoc(doc(db, "invoices", invoiceId), { [field]: value, updatedAt: serverTimestamp() });
                window.InvoicesToast(`Invoice updated: '${field}' synchronized.`);
                
                const inv = Invoices.allInvoices.find(i => i.id === invoiceId);
                if(inv) inv[field] = value;
                
                Invoices.applyFilters(document.getElementById('invoice-search')?.value.toLowerCase() || '', Invoices.currentFilter);
                
                if(field === 'status' || field === 'total') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Invoices.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('invoices-modal-container').innerHTML !== '') {
                            window.InvoicesInspectNode(invoiceId);
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.InvoicesToast("Sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.InvoicesDeleteNode = (invoiceId) => {
            const inv = Invoices.allInvoices.find(i => i.id === invoiceId);
            if(!inv) return;

            const container = document.getElementById('invoices-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Void Document</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently destroy invoice <span class="text-white font-bold">INV-${invoiceId.substring(0,8)}</span>.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "VOID" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.InvoicesInspectNode('${invoiceId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.InvoicesExecuteDelete('${invoiceId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.InvoicesExecuteDelete = async (invoiceId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'VOID') {
                return window.InvoicesToast("Confirmation failed.", "error");
            }

            try {
                await deleteDoc(doc(db, "invoices", invoiceId));
                window.InvoicesCloseModal();
                window.InvoicesToast("Document voided successfully.");
                Invoices.init();
            } catch (e) {
                console.error(e);
                window.InvoicesToast("Void failed.", "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'invoices') {
        Invoices.init();
    }
});