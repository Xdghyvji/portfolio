import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Client Support Component - Advanced Ticket & Assistance Management
 */
const Support = {
    allTickets: [],
    filteredTickets: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('client-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchTickets();
            this.filteredTickets = [...this.allTickets];

            container.innerHTML = this.renderUI();
            this.renderTicketsList(this.filteredTickets);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Support Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchTickets() {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication node disconnected.");

        // Fetch Support Tickets assigned to this client
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, where("clientEmail", "==", user.email));
        const snap = await getDocs(q);
        
        this.allTickets = [];
        snap.forEach(doc => {
            this.allTickets.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent issue date
        this.allTickets.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allTickets.length;
        let active = 0;
        let resolved = 0;
        let pendingAdmin = 0;

        this.allTickets.forEach(t => {
            const status = (t.status || 'open').toLowerCase();
            
            if (status === 'resolved' || status === 'closed') {
                resolved++;
            } else if (status === 'in progress') {
                active++;
            } else {
                pendingAdmin++;
            }
        });

        return { total, active, pendingAdmin, resolved };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative max-w-6xl mx-auto">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-headset text-ma-indigo"></i> Support Desk
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Submit technical requests, report issues, and monitor secure communication threads.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.SupportOpenProvisionModal()" class="px-5 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> New Request
                        </button>
                        <button onclick="window.loadSection('support')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Awaiting Admin</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.pendingAdmin}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-clock"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-ma-indigo/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Investigation</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.active}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-magnifying-glass"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-ma-emerald/10 rounded-full blur-xl pointer-events-none"></div>
                        <div class="relative z-10">
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Resolved Issues</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.resolved}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition relative z-10"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                </div>

                <!-- Filters & List Container -->
                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition whitespace-nowrap">All Threads</button>
                            <button data-filter="open" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Open / Active</button>
                            <button data-filter="resolved" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Resolved</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="support-search" placeholder="Search topics or TKT ID..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <!-- Tickets List -->
                    <div class="overflow-y-auto custom-scroll flex-1 bg-ma-dark/20 p-6">
                        <div id="tickets-list" class="space-y-4">
                            <!-- Rows injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="support-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="support-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderTicketsList(tickets) {
        const list = document.getElementById('tickets-list');
        if (!list) return;

        if (tickets.length === 0) {
            list.innerHTML = `
                <div class="py-20 text-center flex flex-col items-center justify-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mb-4 shadow-lg">
                        <i class="fa-solid fa-clipboard-check"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No active support requests.</p>
                    <p class="text-xs text-slate-600 mt-1">Your command center operations are running smoothly.</p>
                </div>`;
            return;
        }

        list.innerHTML = tickets.map(ticket => {
            const status = (ticket.status || 'open').toLowerCase();
            const priority = (ticket.priority || 'normal').toLowerCase();
            const date = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            const shortId = `TKT-${ticket.id.substring(0, 6).toUpperCase()}`;

            let statusStyles = '';
            if (status === 'resolved' || status === 'closed') {
                statusStyles = 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
            } else if (status === 'in progress') {
                statusStyles = 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            } else {
                statusStyles = 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            }

            let priorityIcon = '<i class="fa-solid fa-circle text-slate-500 text-[8px]" title="Normal Priority"></i>';
            if (priority === 'high' || priority === 'urgent') {
                priorityIcon = '<i class="fa-solid fa-circle text-rose-500 text-[8px] animate-pulse" title="High Priority"></i>';
            }

            return `
            <div class="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-ma-indigo/30 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg" onclick="window.SupportInspectNode('${ticket.id}')">
                
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-ma-indigo group-hover:scale-110 transition-all shrink-0 shadow-inner">
                        <i class="fa-solid fa-message"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            ${priorityIcon}
                            <span class="text-[10px] font-mono text-ma-indigo uppercase tracking-widest">${shortId}</span>
                            <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${statusStyles}">${status}</span>
                        </div>
                        <h4 class="text-sm font-bold text-white group-hover:text-ma-indigo transition-colors line-clamp-1">${ticket.subject || 'General Technical Inquiry'}</h4>
                    </div>
                </div>

                <div class="flex items-center justify-between md:justify-end gap-8 border-t border-white/5 md:border-0 pt-4 md:pt-0">
                    <div class="text-left md:text-right hidden sm:block">
                        <p class="text-[9px] font-mono uppercase text-slate-500 tracking-widest mb-0.5">Last Updated</p>
                        <p class="text-xs font-mono text-slate-300">${date}</p>
                    </div>
                    <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-ma-indigo group-hover:text-white group-hover:border-ma-indigo transition-all shrink-0">
                        <i class="fa-solid fa-arrow-right -rotate-45"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
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
            const idMatch = (t.id || '').toLowerCase().includes(searchTerm);
            const subjMatch = (t.subject || '').toLowerCase().includes(searchTerm);
            const matchesSearch = idMatch || subjMatch;
            
            const tStatus = (t.status || 'open').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'resolved') matchesStatus = tStatus === 'resolved' || tStatus === 'closed';
            else if (statusFilter === 'open') matchesStatus = tStatus !== 'resolved' && tStatus !== 'closed';
            
            return matchesSearch && matchesStatus;
        });
        this.renderTicketsList(this.filteredTickets);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-headset fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Establishing_Secure_Comms...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Comms Disconnected</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('support')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Uplink</button>
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

        window.SupportCloseModal = () => {
            const container = document.getElementById('support-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create Request) ---
        window.SupportOpenProvisionModal = () => {
            const container = document.getElementById('support-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-paper-plane text-ma-indigo"></i> New Technical Request</h3>
                            <button onclick="window.SupportCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.SupportSubmitProvision(event)" class="p-6 space-y-4">
                            
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Subject Matter</label>
                                <input type="text" id="prov-tkt-subject" required placeholder="Brief description of the issue..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Urgency Level</label>
                                <select id="prov-tkt-priority" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                    <option value="low">Low (General Query)</option>
                                    <option value="medium" selected>Medium (Standard Support)</option>
                                    <option value="high">High (Critical Issue / Downtime)</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Detailed Report</label>
                                <textarea id="prov-tkt-desc" rows="5" required placeholder="Please provide steps to reproduce the issue, module names, or links..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4">
                                <button type="button" onclick="window.SupportCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Transmit Request <i class="fa-solid fa-paper-plane"></i></button>
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
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';

            try {
                const user = auth.currentUser;
                if(!user) throw new Error("Unauthenticated.");

                const data = {
                    clientEmail: user.email,
                    userEmail: user.email, // Legacy support
                    subject: document.getElementById('prov-tkt-subject').value,
                    priority: document.getElementById('prov-tkt-priority').value,
                    status: 'open',
                    message: document.getElementById('prov-tkt-desc').value,
                    adminNotes: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "tickets"), data);
                window.SupportCloseModal();
                window.SupportToast("Support signal securely transmitted to admin.");
                Support.init(); // Reload
            } catch (err) {
                console.error(err);
                window.SupportToast("Transmission failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Transmit Request <i class="fa-solid fa-paper-plane"></i>';
            }
        };

        // --- INSPECT MODAL (Client View - Read Thread) ---
        // Note: Clients have read access but cannot overwrite the document.
        window.SupportInspectNode = (ticketId) => {
            const ticket = Support.allTickets.find(t => t.id === ticketId);
            if(!ticket) return;

            const container = document.getElementById('support-modal-container');
            const status = (ticket.status || 'open').toLowerCase();
            const priority = (ticket.priority || 'normal').toLowerCase();
            const shortId = `TKT-${ticket.id.substring(0, 6).toUpperCase()}`;
            const issueDate = ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleString() : 'N/A';

            let statusStyles = '';
            let isResolved = false;
            if (status === 'resolved' || status === 'closed') {
                statusStyles = 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20';
                isResolved = true;
            } else if (status === 'in progress') {
                statusStyles = 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20';
            } else {
                statusStyles = 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            }

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-satellite-dish text-ma-indigo"></i> Thread Inspector</h3>
                            <button onclick="window.SupportCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6 relative">
                            <!-- Background Glow -->
                            <div class="absolute -right-20 top-0 w-64 h-64 bg-ma-indigo/5 rounded-full blur-3xl pointer-events-none z-0"></div>
                            
                            <!-- Header / Title -->
                            <div class="relative z-10 text-left pb-4 border-b border-white/5">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusStyles}">
                                        ${status}
                                    </span>
                                    <span class="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">${shortId}</span>
                                </div>
                                <h2 class="text-xl font-display font-bold text-white leading-tight">${ticket.subject || 'Technical Inquiry'}</h2>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2"><i class="fa-regular fa-clock"></i> Logged: ${issueDate}</p>
                            </div>

                            <!-- Thread Data -->
                            <div class="relative z-10 space-y-4">
                                
                                <!-- Client Initial Message -->
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-user"></i> Your Report</p>
                                    <div class="bg-black/30 border border-white/5 rounded-xl p-4 shadow-inner">
                                        <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap italic">"${ticket.message || ticket.description || 'No detailed message provided.'}"</p>
                                    </div>
                                </div>

                                <!-- Admin Response Box -->
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-ma-emerald tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-shield-halved"></i> Official Admin Response</p>
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-4 shadow-lg border-l-2 border-l-ma-emerald">
                                        ${ticket.adminNotes 
                                            ? `<p class="text-sm text-white leading-relaxed whitespace-pre-wrap">${ticket.adminNotes}</p>` 
                                            : `<p class="text-sm text-slate-500 italic">This request is currently queued for administrative review. An operative will reply shortly.</p>`
                                        }
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <!-- Client Footer Actions -->
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.loadSection('chat'); window.SupportCloseModal();" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-comments text-ma-indigo"></i> Escalate via Chat
                            </button>
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
    if (e.detail.section === 'support') {
        Support.init();
    }
});