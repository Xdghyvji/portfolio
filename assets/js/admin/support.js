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
 * Support Component - Advanced Client Ticket Management & Technical Assistance
 */
const Support = {
    allTickets: [],
    filteredTickets: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchTickets();
            this.filteredTickets = [...this.allTickets];

            container.innerHTML = this.renderUI();
            this.renderTicketsTable(this.filteredTickets);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Support Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchTickets() {
        const snap = await getDocs(collection(db, "tickets"));
        this.allTickets = [];
        snap.forEach(doc => {
            this.allTickets.push({ id: doc.id, ...doc.data() });
        });

        // Sort by priority (high first) then date
        this.allTickets.sort((a, b) => {
            const priorityOrder = { high: 0, urgent: 0, medium: 1, normal: 1, low: 2 };
            const pA = priorityOrder[a.priority?.toLowerCase()] ?? 3;
            const pB = priorityOrder[b.priority?.toLowerCase()] ?? 3;
            
            if (pA !== pB) return pA - pB;
            
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allTickets.length;
        const resolved = this.allTickets.filter(t => (t.status || '').toLowerCase() === 'resolved' || (t.status || '').toLowerCase() === 'closed').length;
        const open = this.allTickets.filter(t => (t.status || '').toLowerCase() === 'open' || (t.status || '').toLowerCase() === 'pending').length;
        const inProgress = total - resolved - open;

        return { total, open, inProgress, resolved };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-headset text-ma-indigo"></i> Support Hub
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Manage client expectations, resolve technical bottlenecks, and oversee communications.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.SupportExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Log
                        </button>
                        <button onclick="window.SupportOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Create Ticket
                        </button>
                        <button onclick="window.loadSection('support')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Tickets</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-ticket"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Unresolved (Open)</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.open}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-circle-exclamation"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Escalation</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.inProgress}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-fire"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Resolved Cases</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.resolved}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition">All</button>
                            <button data-filter="open" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Open / Pending</button>
                            <button data-filter="progress" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">In Progress</button>
                            <button data-filter="resolved" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Resolved</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="support-search" placeholder="Search subjects or emails..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Ticket ID / Client</th>
                                    <th class="px-6 py-4 font-medium">Subject Matter</th>
                                    <th class="px-6 py-4 font-medium">Priority</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium">Initiated</th>
                                    <th class="px-6 py-4 font-medium text-right">Intervention</th>
                                </tr>
                            </thead>
                            <tbody id="tickets-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="support-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="support-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderTicketsTable(tickets) {
        const tbody = document.getElementById('tickets-table-body');
        if (!tbody) return;

        if (tickets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-check-double"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No active support signals.</p>
                        <p class="text-xs text-slate-600 mt-1">The support queue is completely clear.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = tickets.map(ticket => {
            const status = (ticket.status || 'open').toLowerCase();
            const priority = (ticket.priority || 'normal').toLowerCase();
            
            let statusMarkup = '';
            if (status === 'resolved' || status === 'closed') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-ma-emerald"><span class="w-1.5 h-1.5 rounded-full bg-ma-emerald"></span> Resolved</span>`;
            } else if (status === 'in progress' || status === 'progress') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-ma-indigo"><span class="w-1.5 h-1.5 rounded-full bg-ma-indigo animate-pulse"></span> In Progress</span>`;
            } else {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Open</span>`;
            }

            const priorityStyles = this.getPriorityStyles(priority);
            const dateStr = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Legacy';

            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.SupportInspectNode('${ticket.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-indigo/30 group-hover:text-ma-indigo transition-all shrink-0">
                            <i class="fa-solid fa-headset text-xs"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-ma-indigo uppercase truncate tracking-widest mb-0.5">#${ticket.id.substring(0, 6)}</p>
                            <p class="text-sm font-bold text-white truncate group-hover:text-ma-indigo transition">${ticket.clientEmail || ticket.userEmail || 'Anonymous'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1 max-w-[200px]">
                        <span class="text-xs font-medium text-slate-300 truncate">${ticket.subject || 'Technical Inquiry'}</span>
                        <p class="text-[10px] text-slate-500 line-clamp-1 italic">"${ticket.message || ticket.description || 'No description provided.'}"</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${priorityStyles}">
                        ${priority}
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
                        <button onclick="window.SupportInspectNode('${ticket.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-indigo hover:border-ma-indigo/50 transition-all" title="Inspect Ticket">
                            <i class="fa-solid fa-reply text-xs"></i>
                        </button>
                        <button onclick="window.SupportDeleteNode('${ticket.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all" title="Discard">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    getPriorityStyles(priority) {
        switch(priority) {
            case 'high': 
            case 'urgent': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'medium': 
            case 'normal': return 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            default: return 'bg-slate-800 text-slate-400 border-white/5';
        }
    },

    setupListeners() {
        const searchInput = document.getElementById('support-search');
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
                    b.classList.remove('bg-ma-indigo', 'text-white', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-indigo', 'text-white', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('support-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredTickets = this.allTickets.filter(t => {
            const email = (t.clientEmail || t.userEmail || '').toLowerCase();
            const subject = (t.subject || '').toLowerCase();
            const matchesSearch = email.includes(searchTerm) || subject.includes(searchTerm);
            
            const tStatus = (t.status || 'open').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'open') matchesStatus = tStatus === 'open' || tStatus === 'pending';
            else if (statusFilter === 'progress') matchesStatus = tStatus === 'in progress' || tStatus === 'progress';
            else if (statusFilter === 'resolved') matchesStatus = tStatus === 'resolved' || tStatus === 'closed';
            
            return matchesSearch && matchesStatus;
        });
        this.renderTicketsTable(this.filteredTickets);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-headset fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Support_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Sync Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('support')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Connection</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.SupportToast = (msg, type = 'success') => {
            const container = document.getElementById('support-toast-container');
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

        window.SupportExportData = () => {
            if(Support.filteredTickets.length === 0) return window.SupportToast("No data to export", "error");
            
            let csv = "ID,ClientEmail,Subject,Priority,Status,Date\n";
            Support.filteredTickets.forEach(t => {
                let dateStr = '';
                if(t.createdAt) dateStr = t.createdAt.seconds ? new Date(t.createdAt.seconds * 1000).toISOString() : t.createdAt;
                
                const safeSubject = (t.subject || '').replace(/"/g, '""');
                const email = t.clientEmail || t.userEmail || '';
                
                csv += `"${t.id}","${email}","${safeSubject}","${t.priority||'normal'}","${t.status||'open'}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Support_Log_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.SupportToast("Support log exported successfully.");
        };

        window.SupportCloseModal = () => {
            const container = document.getElementById('support-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.SupportOpenProvisionModal = () => {
            const container = document.getElementById('support-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-headset text-ma-indigo"></i> Generate Support Ticket</h3>
                            <button onclick="window.SupportCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.SupportSubmitProvision(event)" class="p-6 space-y-4">
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Email</label>
                                <input type="email" id="prov-tkt-email" required placeholder="client@domain.com" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Subject Matter</label>
                                <input type="text" id="prov-tkt-subject" required placeholder="Brief description of the issue..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Priority</label>
                                    <select id="prov-tkt-priority" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High (Urgent)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Status</label>
                                    <select id="prov-tkt-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="open">Open</option>
                                        <option value="in progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Detailed Description</label>
                                <textarea id="prov-tkt-desc" rows="4" required placeholder="Full technical details or client request..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4">
                                <button type="button" onclick="window.SupportCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-5 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Initialize Ticket <i class="fa-solid fa-check"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.SupportSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            try {
                const data = {
                    clientEmail: document.getElementById('prov-tkt-email').value,
                    subject: document.getElementById('prov-tkt-subject').value,
                    priority: document.getElementById('prov-tkt-priority').value,
                    status: document.getElementById('prov-tkt-status').value,
                    message: document.getElementById('prov-tkt-desc').value,
                    adminNotes: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "tickets"), data);
                window.SupportCloseModal();
                window.SupportToast("Support ticket injected into queue.");
                Support.init(); // Reload to refresh grid and stats
            } catch (err) {
                console.error(err);
                window.SupportToast("Initialization failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initialize Ticket <i class="fa-solid fa-check"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.SupportInspectNode = (ticketId) => {
            const ticket = Support.allTickets.find(t => t.id === ticketId);
            if(!ticket) return;

            const container = document.getElementById('support-modal-container');
            const email = ticket.clientEmail || ticket.userEmail || 'Anonymous';
            const status = (ticket.status || 'open').toLowerCase();
            const priority = (ticket.priority || 'normal').toLowerCase();
            const dateStr = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleString() : 'Legacy';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-clipboard-list text-ma-indigo"></i> Node Inspector</h3>
                            <button onclick="window.SupportCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Hero / Identity -->
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 text-slate-300 shrink-0 shadow-lg">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div class="overflow-hidden w-full">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-[9px] font-mono text-ma-indigo uppercase tracking-widest bg-ma-indigo/10 px-2 py-0.5 rounded border border-ma-indigo/20">ID: #${ticket.id.substring(0,8)}</span>
                                    </div>
                                    <h4 class="text-sm font-bold text-white truncate">${email}</h4>
                                </div>
                            </div>

                            <!-- Quick Controls -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Priority</p>
                                    <select onchange="window.SupportUpdateField('${ticket.id}', 'priority', this.value)" class="bg-transparent w-full text-xs font-bold focus:outline-none cursor-pointer ${priority === 'high' ? 'text-rose-500' : 'text-white'}">
                                        <option value="low" class="bg-ma-dark text-white" ${priority === 'low' ? 'selected' : ''}>Low</option>
                                        <option value="medium" class="bg-ma-dark text-white" ${priority === 'medium' || priority === 'normal' ? 'selected' : ''}>Medium</option>
                                        <option value="high" class="bg-ma-dark text-white" ${priority === 'high' || priority === 'urgent' ? 'selected' : ''}>High (Urgent)</option>
                                    </select>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Queue Status</p>
                                    <select onchange="window.SupportUpdateField('${ticket.id}', 'status', this.value)" class="bg-transparent w-full text-xs font-bold focus:outline-none cursor-pointer ${status === 'resolved' ? 'text-ma-emerald' : 'text-amber-400'}">
                                        <option value="open" class="bg-ma-dark text-white" ${status === 'open' ? 'selected' : ''}>Open</option>
                                        <option value="in progress" class="bg-ma-dark text-white" ${status === 'in progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="resolved" class="bg-ma-dark text-white" ${status === 'resolved' || status === 'closed' ? 'selected' : ''}>Resolved</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Subject & Original Message -->
                            <div class="space-y-3 bg-black/30 rounded-2xl p-4 border border-white/[0.02]">
                                <div>
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Subject Matter</p>
                                    <p class="text-sm font-bold text-white leading-tight">${ticket.subject || 'No Subject Provided'}</p>
                                </div>
                                <div class="pt-3 border-t border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Initial Report &bull; ${dateStr}</p>
                                    <p class="text-xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">"${ticket.message || ticket.description || ''}"</p>
                                </div>
                            </div>

                            <!-- Admin Resolution Log -->
                            <div>
                                <p class="text-[10px] font-mono uppercase text-ma-indigo tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-lock"></i> Resolution Log (Internal)</p>
                                <div class="bg-ma-slate border border-white/5 rounded-xl p-1">
                                    <textarea id="edit-tkt-notes-${ticket.id}" rows="5" class="w-full bg-transparent text-sm text-slate-300 p-3 focus:outline-none resize-none leading-relaxed" placeholder="Document fixes, steps taken, or internal notes here...">${ticket.adminNotes || ''}</textarea>
                                    <div class="flex justify-end p-2 border-t border-white/5">
                                        <button onclick="window.SupportUpdateField('${ticket.id}', 'adminNotes', document.getElementById('edit-tkt-notes-${ticket.id}').value)" class="px-3 py-1.5 bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Push Log</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <a href="mailto:${email}?subject=Re: Support Ticket #${ticket.id.substring(0,6)} - ${encodeURIComponent(ticket.subject || 'Update')}" class="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 border border-white/5">
                                <i class="fa-solid fa-reply"></i> Email Client
                            </a>
                            <button onclick="window.SupportDeleteNode('${ticket.id}')" class="w-14 shrink-0 py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center justify-center group" title="Delete Ticket">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.SupportUpdateField = async (ticketId, field, value) => {
            try {
                await updateDoc(doc(db, "tickets", ticketId), { [field]: value, updatedAt: serverTimestamp() });
                window.SupportToast(`Ticket updated: '${field}' synchronized.`);
                
                // Update local array quietly
                const item = Support.allTickets.find(t => t.id === ticketId);
                if(item) item[field] = value;
                
                // Re-render UI seamlessly
                Support.applyFilters(document.getElementById('support-search')?.value.toLowerCase() || '', Support.currentFilter);
                
                // Ensure stats update correctly without flicker if status changed
                if(field === 'status') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Support.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('support-modal-container').innerHTML !== '') {
                            window.SupportInspectNode(ticketId); // Re-open
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.SupportToast("Queue sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.SupportDeleteNode = (ticketId) => {
            const item = Support.allTickets.find(t => t.id === ticketId);
            if(!item) return;

            const container = document.getElementById('support-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire-flame-curved"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Discard Ticket</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate ticket <span class="text-white font-bold">#${ticketId.substring(0,8)}</span> from the support queue. This cannot be reversed.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DELETE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.SupportInspectNode('${ticketId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.SupportExecuteDelete('${ticketId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.SupportExecuteDelete = async (ticketId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DELETE') {
                return window.SupportToast("Confirmation failed. Type DELETE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "tickets", ticketId));
                window.SupportCloseModal();
                window.SupportToast("Ticket eradicated from queue.");
                Support.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.SupportToast("Eradication failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'support') {
        Support.init();
    }
});