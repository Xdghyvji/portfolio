import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Support Component
 * Handles client ticket management and technical assistance workflows
 */
const Support = {
    allTickets: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "support_tickets"));
            this.allTickets = [];
            snap.forEach(doc => {
                this.allTickets.push({ id: doc.id, ...doc.data() });
            });

            // Sort by priority (high first) then date
            this.allTickets.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const pA = priorityOrder[a.priority?.toLowerCase()] ?? 3;
                const pB = priorityOrder[b.priority?.toLowerCase()] ?? 3;
                return pA - pB || (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
            });

            container.innerHTML = this.renderUI();
            this.renderTicketsTable(this.allTickets);
            this.setupListeners();

        } catch (error) {
            console.error("Support Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Support Hub</h2>
                        <p class="text-sm text-slate-500">Managing client expectations and resolving technical bottlenecks.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="bg-ma-slate px-4 py-2 rounded-xl border border-white/5">
                            <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active_Tickets</p>
                            <p class="text-sm font-bold text-rose-500">${this.allTickets.filter(t => t.status !== 'resolved').length} Open</p>
                        </div>
                    </div>
                </div>

                <!-- Tickets Container -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Ticket_ID / Sender</th>
                                    <th class="px-6 py-4 font-medium">Subject_Matter</th>
                                    <th class="px-6 py-4 font-medium">Priority</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium text-right">Intervention</th>
                                </tr>
                            </thead>
                            <tbody id="tickets-table-body" class="divide-y divide-white/5">
                                <!-- Data Injected Here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderTicketsTable(tickets) {
        const tbody = document.getElementById('tickets-table-body');
        if (!tbody) return;

        if (tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Active_Support_Signals</td></tr>`;
            return;
        }

        tbody.innerHTML = tickets.map(ticket => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-indigo/30 transition-all">
                            <i class="fa-solid fa-headset text-xs"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-ma-indigo uppercase truncate">#${ticket.id.substring(0, 8)}</p>
                            <p class="text-sm font-bold text-white truncate">${ticket.userEmail || 'Anonymous'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-slate-300">${ticket.subject || 'Technical Issue'}</span>
                        <span class="text-[9px] font-mono text-slate-600 uppercase tracking-tighter truncate max-w-[200px]">
                            ${ticket.message || 'No description provided.'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <span class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${this.getPriorityStyles(ticket.priority)}">
                        ${ticket.priority || 'NORMAL'}
                    </span>
                </td>
                <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${ticket.status === 'resolved' ? 'bg-ma-emerald' : 'bg-amber-500 animate-pulse'}"></span>
                        <span class="text-[10px] font-mono ${ticket.status === 'resolved' ? 'text-ma-emerald' : 'text-amber-500'} uppercase">
                            ${ticket.status || 'OPEN'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-5 text-right">
                    <button class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:border-ma-indigo transition-all uppercase tracking-widest">
                        Respond
                    </button>
                </td>
            </tr>
        `).join('');
    },

    getPriorityStyles(priority) {
        switch(priority?.toLowerCase()) {
            case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'medium': return 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            default: return 'bg-slate-800 text-slate-500 border-white/5';
        }
    },

    setupListeners() {
        // Response and status update logic will go here
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-headset fa-fade text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Support_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Sync Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('support')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'support') {
        Support.init();
    }
});