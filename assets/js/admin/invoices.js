import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (Matching your portfolio-8e083 environment)
const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app",
    messagingSenderId: "473586363516",
    appId: "1:473586363516:web:d7b9db91eba86f8809adf9",
    measurementId: "G-P25VB35JSM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Invoices Component
 * Handles the generation, tracking, and settlement of client billing nodes
 */
const Invoices = {
    allInvoices: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "invoices"));
            this.allInvoices = [];
            snap.forEach(doc => {
                this.allInvoices.push({ id: doc.id, ...doc.data() });
            });

            // Sort by due date or timestamp
            this.allInvoices.sort((a, b) => (b.dueDate?.seconds || 0) - (a.dueDate?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderInvoicesTable(this.allInvoices);

        } catch (error) {
            console.error("Invoices Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        const unpaid = this.allInvoices.filter(i => i.status !== 'paid');
        const totalPending = unpaid.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Invoicing</h2>
                        <p class="text-sm text-slate-500">Managing project billing cycles and financial settlement nodes.</p>
                    </div>
                    <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:bg-ma-indigo/80 transition-all shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-file-invoice-dollar"></i> Generate Invoice
                    </button>
                </div>

                <!-- Billing Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-ma-slate/20">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Outstanding_Balance</p>
                        <h4 class="text-2xl font-display font-bold text-rose-400">$${totalPending.toLocaleString()}</h4>
                        <p class="text-[9px] text-slate-600 font-mono mt-2 uppercase">${unpaid.length} Unsettled Nodes</p>
                    </div>
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-ma-slate/20">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Settlement_Ratio</p>
                        <h4 class="text-2xl font-display font-bold text-ma-emerald">92%</h4>
                        <p class="text-[9px] text-slate-600 font-mono mt-2 uppercase">Healthy_Cashflow</p>
                    </div>
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-ma-slate/20">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Projected_EOY</p>
                        <h4 class="text-2xl font-display font-bold text-ma-indigo">$24,500</h4>
                        <p class="text-[9px] text-slate-600 font-mono mt-2 uppercase">Growth_Optimized</p>
                    </div>
                </div>

                <!-- Invoices Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Invoice_ID / Client</th>
                                    <th class="px-6 py-4 font-medium">Amount</th>
                                    <th class="px-6 py-4 font-medium">Due_Date</th>
                                    <th class="px-6 py-4 font-medium">Status_Bit</th>
                                    <th class="px-6 py-4 font-medium text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody id="invoices-table-body" class="divide-y divide-white/5">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderInvoicesTable(invoices) {
        const tbody = document.getElementById('invoices-table-body');
        if (!tbody) return;

        if (invoices.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Invoicing_Data_Synchronized</td></tr>`;
            return;
        }

        tbody.innerHTML = invoices.map(inv => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-500 border border-white/5 group-hover:border-ma-indigo/30 transition-all">
                            <i class="fa-solid fa-file-lines text-xs"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-ma-indigo uppercase truncate">INV-${inv.id.substring(0, 6).toUpperCase()}</p>
                            <p class="text-sm font-bold text-white truncate">${inv.clientName || 'Private Node'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-sm font-display font-bold text-white">$${Number(inv.amount || 0).toLocaleString()}</p>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${inv.dueDate ? new Date(inv.dueDate.seconds * 1000).toLocaleDateString() : 'NO_DEADLINE'}
                    </p>
                </td>
                <td class="px-6 py-5">
                    <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${this.getStatusStyles(inv.status)}">
                        <span class="w-1 h-1 rounded-full bg-current"></span>
                        <span class="text-[9px] font-bold uppercase tracking-widest">${inv.status || 'UNSENT'}</span>
                    </div>
                </td>
                <td class="px-6 py-5 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <i class="fa-solid fa-download text-xs"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-emerald transition-all">
                            <i class="fa-solid fa-paper-plane text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStatusStyles(status) {
        switch(status?.toLowerCase()) {
            case 'paid': return 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
            case 'overdue': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse';
            case 'pending': return 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            default: return 'bg-slate-800 text-slate-500 border-white/5';
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-receipt fa-fade text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Ledger_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-file-circle-xmark"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Ledger Sync Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('invoices')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'invoices') {
        Invoices.init();
    }
});