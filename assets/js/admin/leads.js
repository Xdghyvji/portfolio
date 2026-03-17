import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Leads Component
 * Handles inbound project inquiries and CRM tracking
 */
const Leads = {
    allLeads: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "leads"));
            this.allLeads = [];
            snap.forEach(doc => {
                this.allLeads.push({ id: doc.id, ...doc.data() });
            });

            // Sort by most recent
            this.allLeads.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderLeadsTable(this.allLeads);
            this.setupListeners();

        } catch (error) {
            console.error("Leads Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Leads Monitor</h2>
                        <p class="text-sm text-slate-500">Processing inbound project inquiries and strategic growth opportunities.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <i class="fa-solid fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="lead-search" placeholder="Filter inquiries..." class="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all w-64">
                        </div>
                        <button onclick="window.loadSection('leads')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <i class="fa-solid fa-sync"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Mini-Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Total_Inbound</p>
                        <h4 class="text-xl font-bold text-white">${this.allLeads.length}</h4>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Unprocessed</p>
                        <h4 class="text-xl font-bold text-ma-indigo">${this.allLeads.filter(l => !l.status || l.status === 'new').length}</h4>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5">
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Conversion_Rate</p>
                        <h4 class="text-xl font-bold text-ma-emerald">--%</h4>
                    </div>
                </div>

                <!-- Leads Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Origin / Client</th>
                                    <th class="px-6 py-4 font-medium">Objective</th>
                                    <th class="px-6 py-4 font-medium">Timestamp</th>
                                    <th class="px-6 py-4 font-medium">Node_Status</th>
                                    <th class="px-6 py-4 font-medium text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody id="leads-table-body" class="divide-y divide-white/5">
                                <!-- Data Injected Here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderLeadsTable(leads) {
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;

        if (leads.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Active_Signals_Detected</td></tr>`;
            return;
        }

        tbody.innerHTML = leads.map(lead => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-indigo/30 transition-all">
                            <i class="fa-solid fa-envelope-open-text"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-sm font-bold text-white truncate">${lead.name || 'Anonymous'}</p>
                            <p class="text-[10px] font-mono text-slate-500 truncate lowercase">${lead.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-medium text-slate-300">${lead.goal || 'General Inquiry'}</span>
                        <p class="text-[10px] text-slate-600 line-clamp-1 italic">"${lead.details || 'No additional project documentation.'}"</p>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase">
                        ${lead.timestamp ? new Date(lead.timestamp.seconds * 1000).toLocaleString() : 'LEGACY_LOG'}
                    </p>
                </td>
                <td class="px-6 py-5">
                    <span class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${this.getStatusStyles(lead.status)}">
                        ${lead.status || 'NEW_ENTRY'}
                    </span>
                </td>
                <td class="px-6 py-5 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStatusStyles(status) {
        switch(status?.toLowerCase()) {
            case 'contacted': return 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            case 'converted': return 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
            case 'archived': return 'bg-slate-800 text-slate-500 border-white/5';
            default: return 'bg-ma-cyan/10 text-ma-cyan border-ma-cyan/20 animate-pulse';
        }
    },

    setupListeners() {
        const searchInput = document.getElementById('lead-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.allLeads.filter(l => 
                    l.email.toLowerCase().includes(term) || 
                    l.name?.toLowerCase().includes(term) ||
                    l.goal?.toLowerCase().includes(term)
                );
                this.renderLeadsTable(filtered);
            });
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-bolt fa-fade text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Intercepting_Signal_Logs...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Signal Interrupted</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('leads')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Restart Uplink</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'leads') {
        Leads.init();
    }
});
