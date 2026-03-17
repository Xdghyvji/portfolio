import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, query, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (Matching portfolio-8e083)
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
 * Payments Component
 * Handles revenue tracking, transaction history, and financial analytics
 */
const Payments = {
    allTransactions: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "payments"));
            this.allTransactions = [];
            snap.forEach(doc => {
                this.allTransactions.push({ id: doc.id, ...doc.data() });
            });

            // Sort by most recent
            this.allTransactions.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderTransactionTable(this.allTransactions);

        } catch (error) {
            console.error("Payments Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        const totalRevenue = this.allTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Revenue Stream</h2>
                        <p class="text-sm text-slate-500">Real-time monitoring of global project investments and capital flow.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="window.loadSection('payments')" class="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                            <i class="fa-solid fa-download mr-2"></i> Export CSV
                        </button>
                    </div>
                </div>

                <!-- Financial Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-ma-slate to-ma-dark group">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Total_Net_Revenue</p>
                        <h4 class="text-3xl font-display font-bold text-white">$${totalRevenue.toLocaleString()}</h4>
                        <div class="mt-4 flex items-center gap-2">
                            <span class="text-[10px] font-bold text-ma-emerald bg-ma-emerald/10 px-2 py-0.5 rounded-full">+18.4%</span>
                            <span class="text-[10px] text-slate-600 font-mono italic uppercase">LTD_Performance</span>
                        </div>
                    </div>
                    
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-ma-slate/30">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Pending_Clearance</p>
                        <h4 class="text-3xl font-display font-bold text-slate-300">$0.00</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-4 italic uppercase">SECURE_ESCROW_NODES</p>
                    </div>

                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-ma-slate/30">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Active_Retainers</p>
                        <h4 class="text-3xl font-display font-bold text-ma-indigo">${this.allTransactions.filter(t => t.type === 'retainer').length}</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-4 italic uppercase">RECURRING_FLOW_STABLE</p>
                    </div>
                </div>

                <!-- Transaction Log -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h3 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Transaction_Ledger</h3>
                        <span class="text-[10px] font-mono text-ma-emerald uppercase">Sync_Successful</span>
                    </div>
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium text-center">Type</th>
                                    <th class="px-6 py-4 font-medium">Identifier / Client</th>
                                    <th class="px-6 py-4 font-medium">Value</th>
                                    <th class="px-6 py-4 font-medium">Gateway</th>
                                    <th class="px-6 py-4 font-medium">Timeline</th>
                                    <th class="px-6 py-4 font-medium text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody id="payments-table-body" class="divide-y divide-white/5">
                                <!-- Transaction Rows -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderTransactionTable(txs) {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Financial_Records_Located</td></tr>`;
            return;
        }

        tbody.innerHTML = txs.map(tx => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5 text-center">
                    <div class="w-8 h-8 rounded-lg ${tx.amount > 0 ? 'bg-ma-emerald/10 text-ma-emerald' : 'bg-rose-500/10 text-rose-500'} flex items-center justify-center mx-auto border border-white/5">
                        <i class="fa-solid ${tx.amount > 0 ? 'fa-arrow-down' : 'fa-arrow-up'} text-[10px]"></i>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex flex-col">
                        <p class="text-sm font-bold text-white truncate">${tx.clientName || 'Digital Client'}</p>
                        <p class="text-[10px] font-mono text-slate-500 truncate uppercase">#${tx.id.substring(0, 10)}</p>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-sm font-display font-bold text-white">$${Number(tx.amount || 0).toLocaleString()}</p>
                </td>
                <td class="px-6 py-5">
                    <span class="px-2 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-slate-400 uppercase">
                        ${tx.gateway || 'Stripe_API'}
                    </span>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase">
                        ${tx.timestamp ? new Date(tx.timestamp.seconds * 1000).toLocaleDateString() : 'NODATE'}
                    </p>
                </td>
                <td class="px-6 py-5 text-right">
                    <span class="px-2 py-1 rounded-lg bg-ma-emerald/10 text-ma-emerald text-[9px] font-bold uppercase tracking-widest border border-ma-emerald/20">
                        Confirmed
                    </span>
                </td>
            </tr>
        `).join('');
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-wallet fa-fade text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Accessing_Financial_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-vault"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Vault Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('payments')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Authorization</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'payments') {
        Payments.init();
    }
});