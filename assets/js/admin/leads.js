import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Leads Component - Advanced Inbound CRM & Pipeline Management
 */
const Leads = {
    allLeads: [],
    filteredLeads: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchLeads();
            this.filteredLeads = [...this.allLeads];

            container.innerHTML = this.renderUI();
            this.renderLeadsTable(this.filteredLeads);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Leads Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchLeads() {
        const snap = await getDocs(collection(db, "leads"));
        this.allLeads = [];
        snap.forEach(doc => {
            this.allLeads.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allLeads.sort((a, b) => {
            const timeA = a.timestamp?.seconds || (new Date(a.timestamp).getTime()/1000) || a.createdAt?.seconds || 0;
            const timeB = b.timestamp?.seconds || (new Date(b.timestamp).getTime()/1000) || b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allLeads.length;
        const newLeads = this.allLeads.filter(l => !l.status || l.status === 'new').length;
        const contacted = this.allLeads.filter(l => l.status === 'contacted').length;
        const converted = this.allLeads.filter(l => l.status === 'converted').length;
        
        let conversionRate = "0.0";
        if(total > 0) {
            conversionRate = ((converted / total) * 100).toFixed(1);
        }

        return { total, newLeads, contacted, converted, conversionRate };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-bolt text-amber-400"></i> Leads Monitor
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Process inbound project inquiries, track conversions, and monitor CRM pipelines.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.LeadsExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Pipeline
                        </button>
                        <button onclick="window.loadSection('leads')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-amber-400 transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Inbound</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-inbox"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Unprocessed Signals</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.newLeads}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-star"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Engagements</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.contacted}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-handshake"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Conversion Rate</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.conversionRate}%</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-bullseye"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-ma-dark shadow-lg transition">All</button>
                            <button data-filter="new" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">New</button>
                            <button data-filter="contacted" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Contacted</button>
                            <button data-filter="converted" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Converted</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="lead-search" placeholder="Search identities or goals..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Origin Node / Client</th>
                                    <th class="px-6 py-4 font-medium">Primary Objective</th>
                                    <th class="px-6 py-4 font-medium">Pipeline Status</th>
                                    <th class="px-6 py-4 font-medium">Timestamp</th>
                                    <th class="px-6 py-4 font-medium text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody id="leads-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="leads-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="leads-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderLeadsTable(leads) {
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;

        if (leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-satellite-dish"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No active signals detected.</p>
                        <p class="text-xs text-slate-600 mt-1">Adjust filters or await new inbound inquiries.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = leads.map(lead => {
            const status = (lead.status || 'new').toLowerCase();
            const statusData = this.getStatusStyles(status);
            
            // Handle multiple potential timestamp formats
            let dateStr = 'Unknown';
            if(lead.timestamp) {
                dateStr = lead.timestamp.seconds ? new Date(lead.timestamp.seconds * 1000).toLocaleString() : new Date(lead.timestamp).toLocaleString();
            } else if (lead.createdAt) {
                dateStr = lead.createdAt.seconds ? new Date(lead.createdAt.seconds * 1000).toLocaleString() : new Date(lead.createdAt).toLocaleString();
            }

            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.LeadsInspectNode('${lead.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-400/30 transition-all shrink-0">
                            <i class="fa-solid fa-envelope-open-text"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-sm font-bold text-white truncate group-hover:text-amber-400 transition">${lead.name || 'Anonymous'}</p>
                            <p class="text-[10px] font-mono text-slate-500 truncate lowercase">${lead.email || 'No email provided'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1 max-w-xs">
                        <span class="text-xs font-medium text-slate-300 truncate">${lead.goal || 'General Inquiry'}</span>
                        <p class="text-[10px] text-slate-500 line-clamp-1 italic">"${lead.details || lead.message || 'No additional documentation.'}"</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${statusData.style} flex w-fit items-center gap-1.5">
                        ${status === 'new' ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>' : ''}
                        ${statusData.label}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${dateStr}
                    </p>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2" onclick="event.stopPropagation()">
                        <button onclick="window.LeadsInspectNode('${lead.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/50 transition-all" title="Inspect Signal">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button onclick="window.LeadsDeleteNode('${lead.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all" title="Discard">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    getStatusStyles(status) {
        switch(status) {
            case 'contacted': return { label: 'Contacted', style: 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20' };
            case 'converted': return { label: 'Converted', style: 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20' };
            case 'archived': return { label: 'Archived', style: 'bg-slate-800 text-slate-500 border-white/5' };
            case 'new':
            default: return { label: 'New / Unread', style: 'bg-amber-400/10 text-amber-400 border-amber-400/30' };
        }
    },

    setupListeners() {
        const searchInput = document.getElementById('lead-search');
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
                    b.classList.remove('bg-amber-500', 'text-ma-dark', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-amber-500', 'text-ma-dark', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('lead-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredLeads = this.allLeads.filter(l => {
            const matchesSearch = (l.email && l.email.toLowerCase().includes(searchTerm)) || 
                                  (l.name && l.name.toLowerCase().includes(searchTerm)) ||
                                  (l.goal && l.goal.toLowerCase().includes(searchTerm));
            
            const lStatus = (l.status || 'new').toLowerCase();
            const matchesStatus = statusFilter === 'all' || lStatus === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        this.renderLeadsTable(this.filteredLeads);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-bolt fa-fade text-4xl text-amber-400"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Intercepting_Signal_Logs...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Signal Interrupted</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('leads')" class="px-8 py-3 rounded-xl bg-amber-500 text-ma-dark text-xs font-bold uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all">Restart Uplink</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.LeadsToast = (msg, type = 'success') => {
            const container = document.getElementById('leads-toast-container');
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

        window.LeadsExportData = () => {
            if(Leads.filteredLeads.length === 0) return window.LeadsToast("No data to export", "error");
            
            let csv = "ID,Name,Email,Goal,Details,Status,Date\n";
            Leads.filteredLeads.forEach(l => {
                let dateStr = '';
                if(l.timestamp) dateStr = l.timestamp.seconds ? new Date(l.timestamp.seconds * 1000).toISOString() : l.timestamp;
                else if (l.createdAt) dateStr = l.createdAt.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : l.createdAt;
                
                const safeDetails = (l.details || l.message || '').replace(/"/g, '""'); // Escape quotes
                csv += `"${l.id}","${l.name || ''}","${l.email || ''}","${l.goal || ''}","${safeDetails}","${l.status||'new'}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Pipeline_Export_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.LeadsToast("Pipeline exported successfully.");
        };

        window.LeadsCloseModal = () => {
            const container = document.getElementById('leads-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.LeadsInspectNode = (leadId) => {
            const lead = Leads.allLeads.find(l => l.id === leadId);
            if(!lead) return;

            const container = document.getElementById('leads-modal-container');
            const status = (lead.status || 'new').toLowerCase();
            
            let dateStr = 'Unknown';
            if(lead.timestamp) {
                dateStr = lead.timestamp.seconds ? new Date(lead.timestamp.seconds * 1000).toLocaleString() : new Date(lead.timestamp).toLocaleString();
            } else if (lead.createdAt) {
                dateStr = lead.createdAt.seconds ? new Date(lead.createdAt.seconds * 1000).toLocaleString() : new Date(lead.createdAt).toLocaleString();
            }

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-radar text-amber-400"></i> Signal Inspector</h3>
                            <button onclick="window.LeadsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="p-6 flex-1 overflow-y-auto custom-scroll space-y-6">
                            
                            <!-- Hero -->
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-2xl bg-amber-400/10 flex items-center justify-center text-3xl border border-amber-400/20 text-amber-400 shrink-0 shadow-lg">
                                    <i class="fa-solid fa-user-astronaut"></i>
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <h4 class="text-xl font-bold text-white leading-tight truncate">${lead.name || 'Anonymous Inquiry'}</h4>
                                    <p class="text-xs text-slate-400 mt-1 truncate"><i class="fa-regular fa-envelope"></i> ${lead.email || 'N/A'}</p>
                                </div>
                            </div>

                            <!-- Pipeline Control -->
                            <div class="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Pipeline Status</p>
                                <select onchange="window.LeadsUpdateStatus('${lead.id}', this.value)" class="w-full bg-ma-dark border border-white/10 text-sm font-bold text-white p-3 rounded-xl focus:outline-none focus:border-amber-400 cursor-pointer">
                                    <option value="new" ${status === 'new' ? 'selected' : ''}>New / Unprocessed</option>
                                    <option value="contacted" ${status === 'contacted' ? 'selected' : ''}>Active / Contacted</option>
                                    <option value="converted" ${status === 'converted' ? 'selected' : ''}>Converted (Success)</option>
                                    <option value="archived" ${status === 'archived' ? 'selected' : ''}>Archived / Dead</option>
                                </select>
                            </div>

                            <!-- Signal Data -->
                            <div class="space-y-4">
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2">Transmission Data</h5>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Primary Objective</p>
                                    <div class="bg-ma-slate border border-white/5 rounded-lg px-3 py-2 text-sm text-white">
                                        ${lead.goal || 'General Inquiry'}
                                    </div>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Message / Details</p>
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                                        "${lead.details || lead.message || 'No additional message body provided.'}"
                                    </div>
                                </div>

                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Timestamp</p>
                                    <p class="text-xs font-mono text-slate-400 bg-black/30 p-2 rounded-lg">${dateStr}</p>
                                </div>
                            </div>

                            <!-- Admin Notes Area -->
                            <div class="space-y-2 pt-4 border-t border-white/5">
                                <p class="text-[10px] font-mono uppercase text-ma-indigo tracking-widest flex items-center gap-2"><i class="fa-solid fa-lock"></i> Internal Admin Log</p>
                                <textarea id="lead-notes-${lead.id}" rows="4" placeholder="Add private notes regarding this lead..." class="w-full bg-ma-dark border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-ma-indigo transition resize-none">${lead.notes || ''}</textarea>
                                <div class="flex justify-end">
                                    <button onclick="window.LeadsUpdateNotes('${lead.id}')" class="px-4 py-2 bg-ma-indigo hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">
                                        <i class="fa-solid fa-save"></i> Save Log
                                    </button>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex flex-wrap gap-3">
                            <button id="analyze-btn-${lead.id}" onclick="window.LeadsAnalyzeSentiment('${lead.id}')" class="w-full sm:w-auto flex-1 py-3 rounded-xl bg-amber-400/10 hover:bg-amber-400 hover:text-ma-dark text-amber-400 border border-amber-400/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2">
                                <i class="fa-solid fa-brain"></i> AI Analyze
                            </button>
                            <button id="gen-prop-btn-${lead.id}" onclick="window.LeadsGenerateProposal('${lead.id}')" class="w-full sm:w-auto flex-1 py-3 rounded-xl bg-ma-emerald/10 hover:bg-ma-emerald hover:text-ma-dark text-ma-emerald border border-ma-emerald/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> AI Proposal
                            </button>
                            <a href="mailto:${lead.email}" target="_blank" class="w-full sm:w-auto flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 border border-white/5">
                                <i class="fa-solid fa-reply"></i> Reply
                            </a>
                            <button onclick="window.LeadsDeleteNode('${lead.id}')" class="w-14 shrink-0 py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition flex items-center justify-center group">
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

        window.LeadsUpdateStatus = async (leadId, newStatus) => {
            try {
                await updateDoc(doc(db, "leads", leadId), { status: newStatus, updatedAt: serverTimestamp() });
                window.LeadsToast(`Pipeline status moved to '${newStatus}'.`);
                
                // Update local array quietly
                const lead = Leads.allLeads.find(l => l.id === leadId);
                if(lead) lead.status = newStatus;
                
                // Update specific filters/UI seamlessly
                Leads.applyFilters(document.getElementById('lead-search')?.value.toLowerCase() || '', Leads.currentFilter);
                
                // Re-render UI block for Stats
                const stats = Leads.getStats();
                // Instead of full re-render, we just trigger init but keep the modal open
                const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                Leads.init().then(() => {
                    const scroller = document.querySelector('.custom-scroll');
                    if(scroller) scroller.scrollTop = scrollPos;
                    if(document.getElementById('leads-modal-container').innerHTML !== '') {
                        window.LeadsInspectNode(leadId); // Re-open
                    }
                });

            } catch (e) {
                console.error(e);
                window.LeadsToast("Status update failed.", "error");
            }
        };

        window.LeadsUpdateNotes = async (leadId) => {
            const notesVal = document.getElementById(`lead-notes-${leadId}`).value;
            try {
                await updateDoc(doc(db, "leads", leadId), { notes: notesVal, updatedAt: serverTimestamp() });
                window.LeadsToast(`Admin log updated securely.`);
                const lead = Leads.allLeads.find(l => l.id === leadId);
                if(lead) lead.notes = notesVal;
            } catch (e) {
                console.error(e);
                window.LeadsToast("Failed to save notes.", "error");
            }
        };

        // --- ANALYZE SENTIMENT ---
        window.LeadsAnalyzeSentiment = async (leadId) => {
            const lead = Leads.allLeads.find(l => l.id === leadId);
            if(!lead) return;

            const btn = document.getElementById(`analyze-btn-${leadId}`);
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...';
            }

            try {
                const response = await fetch('/.netlify/functions/analyze-sentiment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        textToAnalyze: `Client: ${lead.name}\nGoal: ${lead.goal}\nMessage: ${lead.details || lead.message}`
                    })
                });

                if(!response.ok) throw new Error("AI Core failed to respond.");

                const data = await response.json();
                
                // Append analysis to Admin Notes
                const notesEl = document.getElementById(`lead-notes-${leadId}`);
                const currentNotes = notesEl.value;
                const timestamp = new Date().toLocaleString();
                const analysisText = `[AI SENTIMENT ANALYSIS - ${timestamp}]\n${data.analysis}`;
                
                notesEl.value = currentNotes ? currentNotes + '\n\n' + analysisText : analysisText;
                
                // Auto-save the updated notes
                await window.LeadsUpdateNotes(leadId);
                
                window.LeadsToast("Sentiment analysis complete and logged.");

            } catch (err) {
                console.error(err);
                window.LeadsToast("Sentiment analysis failed.", "error");
            } finally {
                if(btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-brain"></i> AI Analyze';
                }
            }
        };

        // --- GENERATE AI PROPOSAL ---
        window.LeadsGenerateProposal = async (leadId) => {
            const lead = Leads.allLeads.find(l => l.id === leadId);
            if(!lead) return;

            const btn = document.getElementById(`gen-prop-btn-${leadId}`);
            if(btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating...';
            }

            try {
                const response = await fetch('/.netlify/functions/generate-proposal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leadData: {
                            name: lead.name || 'Client',
                            goal: lead.goal || 'General Inquiry',
                            details: lead.details || lead.message || 'No additional details provided.'
                        }
                    })
                });

                if(!response.ok) throw new Error("AI Core failed to respond.");

                const data = await response.json();
                
                // Overlay the Proposal Preview Modal
                const container = document.getElementById('leads-modal-container');
                container.innerHTML = `
                    <div class="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                        <div class="bg-ma-dark border border-ma-emerald/30 rounded-3xl w-full max-w-4xl h-[95vh] shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col overflow-hidden">
                            <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                                <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-wand-magic-sparkles text-ma-emerald"></i> AI Generated Proposal</h3>
                                <div class="flex gap-3">
                                    <button onclick="window.printProposal()" class="px-5 py-2.5 bg-ma-indigo hover:bg-indigo-500 rounded-xl text-white text-xs font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">
                                        <i class="fa-solid fa-print"></i> Export to PDF
                                    </button>
                                    <button onclick="window.LeadsInspectNode('${leadId}')" class="w-10 h-10 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="proposal-print-area" class="flex-1 overflow-y-auto custom-scroll p-4 sm:p-8 bg-ma-slate">
                                ${data.proposalHtml}
                            </div>
                        </div>
                    </div>
                `;

                // Attach Print Utility
                window.printProposal = () => {
                    const printContent = document.getElementById('proposal-print-area').innerHTML;
                    const originalBody = document.body.innerHTML;
                    document.body.innerHTML = printContent;
                    window.print();
                    document.body.innerHTML = originalBody;
                    window.location.reload(); // Quick reset to restore SPA state seamlessly
                };

            } catch (err) {
                console.error(err);
                window.LeadsToast("Proposal generation failed.", "error");
                if(btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Proposal';
                }
            }
        };

        // --- DELETE MODAL ---
        window.LeadsDeleteNode = (leadId) => {
            const lead = Leads.allLeads.find(l => l.id === leadId);
            if(!lead) return;

            const container = document.getElementById('leads-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire-flame-curved"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Discard Signal</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate this lead record from the CRM pipeline. This cannot be undone.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DELETE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.LeadsInspectNode('${leadId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.LeadsExecuteDelete('${leadId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.LeadsExecuteDelete = async (leadId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DELETE') {
                return window.LeadsToast("Confirmation failed. Type DELETE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "leads", leadId));
                window.LeadsCloseModal();
                window.LeadsToast("Lead signal eradicated.");
                Leads.init(); // Refresh entire list
            } catch (e) {
                console.error(e);
                window.LeadsToast("Deletion failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'leads') {
        Leads.init();
    }
});