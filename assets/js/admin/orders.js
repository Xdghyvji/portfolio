import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Orders Component
 * Handles project lifecycle, fulfillment tracking, and financial monitoring
 */
const Orders = {
    allOrders: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            // Fetch all orders - sorting in memory to avoid index requirements for simple setup
            const snap = await getDocs(collection(db, "orders"));
            this.allOrders = [];
            snap.forEach(doc => {
                this.allOrders.push({ id: doc.id, ...doc.data() });
            });

            // Sort by order date (newest first)
            this.allOrders.sort((a, b) => (b.orderDate?.seconds || 0) - (a.orderDate?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderOrdersTable(this.allOrders);
            this.setupListeners();

        } catch (error) {
            console.error("Orders Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Order Queue</h2>
                        <p class="text-sm text-slate-500">Monitoring project lifecycle from initialization to final deployment.</p>
                    </div>
                    <div class="flex items-center gap-3">
                         <div class="bg-ma-slate px-4 py-2 rounded-xl border border-white/5 flex items-center gap-4">
                            <div class="text-right">
                                <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active_Workload</p>
                                <p class="text-sm font-bold text-ma-emerald">${this.allOrders.filter(o => o.status === 'processing' || o.status === 'active').length} Nodes</p>
                            </div>
                            <div class="h-8 w-[1px] bg-white/10"></div>
                            <div class="text-right">
                                <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Queue_Value</p>
                                <p class="text-sm font-bold text-white">$${this.allOrders.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Table Container -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Order_ID / Client</th>
                                    <th class="px-6 py-4 font-medium">Service_Node</th>
                                    <th class="px-6 py-4 font-medium">Investment</th>
                                    <th class="px-6 py-4 font-medium">Lifecycle_Status</th>
                                    <th class="px-6 py-4 font-medium text-right">Terminal_Ops</th>
                                </tr>
                            </thead>
                            <tbody id="orders-table-body" class="divide-y divide-white/5">
                                <!-- Data Injected Here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderOrdersTable(orders) {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Active_Projects_In_Queue</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-500 border border-white/5 group-hover:border-ma-indigo/30 transition-all">
                            <i class="fa-solid fa-terminal text-xs"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-ma-indigo uppercase truncate">#${order.id.substring(0, 8)}</p>
                            <p class="text-sm font-bold text-white truncate">${order.clientEmail || 'Direct Client'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-slate-300">${order.serviceName || 'Custom Solution'}</span>
                        <span class="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
                            Tier: ${order.plan || 'Bespoke'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-sm font-display font-bold text-white">$${Number(order.amount || 0).toLocaleString()}</p>
                </td>
                <td class="px-6 py-5">
                    <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${this.getStatusStyles(order.status)}">
                        <span class="w-1 h-1 rounded-full bg-current"></span>
                        <span class="text-[9px] font-bold uppercase tracking-widest">${order.status || 'PENDING'}</span>
                    </div>
                </td>
                <td class="px-6 py-5 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onclick="console.log('Update status logic')" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-ma-emerald hover:border-ma-emerald/50 transition-all">
                            <i class="fa-solid fa-circle-check text-xs"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <i class="fa-solid fa-ellipsis text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStatusStyles(status) {
        switch(status?.toLowerCase()) {
            case 'completed': return 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
            case 'processing': return 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20 animate-pulse';
            case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'delivered': return 'bg-ma-cyan/10 text-ma-cyan border-ma-cyan/20';
            default: return 'bg-slate-800 text-slate-500 border-white/5';
        }
    },

    setupListeners() {
        // Future listeners for status updates or filtering can be added here
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-cart-flatbed fa-fade text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Active_Pipelines...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Sync Interrupted</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('orders')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'orders') {
        Orders.init();
    }
});