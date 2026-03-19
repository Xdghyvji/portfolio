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
 * Automation Component - Advanced Synthetic Workflows & AI Nodes
 */
const Automation = {
    allNodes: [],
    filteredNodes: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchNodes();
            this.filteredNodes = [...this.allNodes];

            container.innerHTML = this.renderUI();
            this.renderNodeGrid(this.filteredNodes);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Automation Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchNodes() {
        const snap = await getDocs(collection(db, "automations"));
        this.allNodes = [];
        snap.forEach(doc => {
            this.allNodes.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allNodes.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allNodes.length;
        const active = this.allNodes.filter(n => (n.status || '').toLowerCase() === 'active').length;
        const offline = this.allNodes.filter(n => (n.status || '').toLowerCase() === 'offline').length;
        
        let avgEfficiency = 0;
        if(total > 0) {
            const totalEff = this.allNodes.reduce((sum, n) => sum + (Number(n.efficiency) || 0), 0);
            avgEfficiency = Math.round(totalEff / total);
        }

        return { total, active, offline, avgEfficiency };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-microchip text-ma-indigo"></i> AI Automations
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Configure autonomous project pipelines, webhooks, and synthetic content generation nodes.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.AutomationExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Fleet Data
                        </button>
                        <button onclick="window.AutomationOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Initialize Node
                        </button>
                        <button onclick="window.loadSection('automation')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Technical Specs Panel -->
                <div class="glass-panel rounded-3xl p-6 md:p-8 border border-white/5 bg-gradient-to-br from-ma-slate/50 to-ma-dark/80 relative overflow-hidden">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-ma-indigo/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="flex flex-col md:flex-row md:items-center gap-6 md:gap-12 mb-8 relative z-10">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-ma-indigo/20 flex items-center justify-center text-ma-indigo border border-ma-indigo/30 shadow-lg shadow-ma-indigo/10">
                                <i class="fa-solid fa-server text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm">System Parameters</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="w-2 h-2 rounded-full bg-ma-emerald animate-pulse"></span>
                                    <p class="text-[10px] font-mono text-ma-emerald tracking-widest">API_UPTIME: 99.9% | LATENCY: 24MS</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${this.renderParamTile("GPT-4o API", "Connected", "text-ma-emerald")}
                            ${this.renderParamTile("Stable Diffusion", "Active", "text-ma-emerald")}
                            ${this.renderParamTile("Make.com Hooks", "Listening", "text-amber-400")}
                            ${this.renderParamTile("Compute Clusters", "Optimal", "text-ma-cyan")}
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Fleet Nodes</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-network-wired"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active / Processing</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.active}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-satellite-dish"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Avg Efficiency</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.avgEfficiency}%</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-gauge-high"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Offline / Failed</p>
                            <h4 class="text-2xl font-display font-bold text-rose-500">${stats.offline}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition"><i class="fa-solid fa-plug-circle-xmark"></i></div>
                    </div>
                </div>

                <!-- Filters & Grid Container -->
                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition whitespace-nowrap">All Nodes</button>
                            <button data-filter="active" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Active</button>
                            <button data-filter="paused" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Paused</button>
                            <button data-filter="offline" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Offline</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="auto-search" placeholder="Search architecture..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <!-- Visual Grid -->
                    <div class="p-6 overflow-y-auto custom-scroll flex-1 bg-ma-dark/20">
                        <div id="automation-grid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <!-- Cards injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="automation-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="automation-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderParamTile(label, value, colorClass) {
        return `
            <div class="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                <p class="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 truncate">${label}</p>
                <p class="text-xs md:text-sm font-bold ${colorClass} uppercase tracking-tighter truncate">${value}</p>
            </div>
        `;
    },

    renderNodeGrid(nodes) {
        const grid = document.getElementById('automation-grid');
        if (!grid) return;

        if (nodes.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-robot"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No synthetic nodes detected.</p>
                    <p class="text-xs text-slate-600 mt-1">Initialize a new node to begin automated processing.</p>
                </div>`;
            return;
        }

        grid.innerHTML = nodes.map(node => {
            const status = (node.status || 'paused').toLowerCase();
            const statusData = this.getStatusStyles(status);
            const efficiency = node.efficiency || 0;
            const taskLog = node.taskLog || 'Standing by for remote instructions...';
            const icon = this.getTypeIcon(node.type);

            return `
            <div class="glass-panel p-6 rounded-3xl border border-white/5 hover:border-${statusData.rawColor}/30 transition-all group flex flex-col relative overflow-hidden cursor-pointer" onclick="window.AutomationInspectNode('${node.id}')">
                
                <!-- Ambient Glow -->
                <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-${statusData.rawColor}/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div class="flex items-start justify-between mb-6 relative z-10">
                    <div class="flex gap-4 items-center">
                        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/5 group-hover:bg-${statusData.rawColor}/10 group-hover:text-${statusData.rawColor} transition-all duration-500 shadow-lg">
                            <i class="fa-solid ${icon} text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg leading-tight group-hover:text-${statusData.rawColor} transition-colors line-clamp-1">${node.name || 'Unnamed Node'}</h4>
                            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">${node.type || 'Generic Automation'}</p>
                        </div>
                    </div>
                    <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10 shrink-0">
                        <i class="fa-solid fa-gear text-xs"></i>
                    </button>
                </div>
                
                <div class="flex-1 flex flex-col justify-end relative z-10">
                    <div class="flex items-end justify-between mb-2">
                        <span class="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${statusData.textColor}">
                            ${status === 'active' ? '<i class="fa-solid fa-satellite-dish fa-fade"></i>' : '<i class="fa-solid fa-power-off"></i>'}
                            ${statusData.label}
                        </span>
                        <span class="text-[10px] font-mono text-slate-400">EFF: ${efficiency}%</span>
                    </div>
                    <div class="w-full h-1.5 bg-ma-dark rounded-full mb-6 border border-white/5 overflow-hidden">
                        <div class="h-full bg-${statusData.rawColor} rounded-full transition-all duration-1000" style="width: ${efficiency}%"></div>
                    </div>

                    <div class="bg-black/30 rounded-2xl p-4 border border-white/[0.02]">
                        <div class="flex justify-between items-center text-[9px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
                            <span>Terminal_Output</span>
                            <span class="${status === 'active' ? 'text-ma-emerald' : 'text-slate-600'}">${status === 'active' ? 'Processing...' : 'Halted'}</span>
                        </div>
                        <p class="text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-2">${taskLog}</p>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    getTypeIcon(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('video')) return 'fa-video';
        if (t.includes('social')) return 'fa-hashtag';
        if (t.includes('scraper')) return 'fa-spider';
        if (t.includes('agent')) return 'fa-brain';
        return 'fa-robot';
    },

    getStatusStyles(status) {
        if (status === 'active') {
            return { label: 'Active', textColor: 'text-ma-emerald', rawColor: 'ma-emerald' };
        } else if (status === 'paused') {
            return { label: 'Paused', textColor: 'text-amber-400', rawColor: 'amber-400' };
        } else if (status === 'offline' || status === 'failed') {
            return { label: 'Offline / Error', textColor: 'text-rose-500', rawColor: 'rose-500' };
        }
        return { label: 'Standby', textColor: 'text-slate-400', rawColor: 'slate-500' };
    },

    setupListeners() {
        const searchInput = document.getElementById('auto-search');
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
                const term = document.getElementById('auto-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredNodes = this.allNodes.filter(n => {
            const nameMatch = (n.name && n.name.toLowerCase().includes(searchTerm));
            const typeMatch = (n.type && n.type.toLowerCase().includes(searchTerm));
            const matchesSearch = nameMatch || typeMatch;
            
            const nStatus = (n.status || 'paused').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'active') matchesStatus = nStatus === 'active';
            else if (statusFilter === 'paused') matchesStatus = nStatus === 'paused';
            else if (statusFilter === 'offline') matchesStatus = nStatus === 'offline' || nStatus === 'failed';
            
            return matchesSearch && matchesStatus;
        });
        this.renderNodeGrid(this.filteredNodes);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-microchip fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Synthetic_Workflows...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-bug"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Automation Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('automation')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Link</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.AutomationToast = (msg, type = 'success') => {
            const container = document.getElementById('automation-toast-container');
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

        window.AutomationExportData = () => {
            if(Automation.filteredNodes.length === 0) return window.AutomationToast("No data to export", "error");
            
            let csv = "ID,Name,Type,Status,Efficiency,Endpoint,Date\n";
            Automation.filteredNodes.forEach(n => {
                let dateStr = '';
                if(n.createdAt) dateStr = n.createdAt.seconds ? new Date(n.createdAt.seconds * 1000).toISOString() : n.createdAt;
                
                const safeName = (n.name || '').replace(/"/g, '""');
                
                csv += `"${n.id}","${safeName}","${n.type || ''}","${n.status||'paused'}","${n.efficiency||0}","${n.endpoint||''}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Fleet_Nodes_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.AutomationToast("Fleet telemetry exported successfully.");
        };

        window.AutomationCloseModal = () => {
            const container = document.getElementById('automation-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.AutomationOpenProvisionModal = () => {
            const container = document.getElementById('automation-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-code-branch text-ma-indigo"></i> Initialize Synthetic Node</h3>
                            <button onclick="window.AutomationCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.AutomationSubmitProvision(event)" class="p-6 overflow-y-auto custom-scroll space-y-5">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Node Designation (Name)</label>
                                    <input type="text" id="prov-auto-name" required placeholder="e.g., YouTube Cashcow Pipeline v2" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>
                                
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Operational Architecture</label>
                                    <select id="prov-auto-type" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="Video Generation">Video Generation Pipeline</option>
                                        <option value="Social Bot">Social Media Automation</option>
                                        <option value="Data Scraper">Web Data Scraper</option>
                                        <option value="AI Agent">Autonomous AI Agent</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Core Status</label>
                                    <select id="prov-auto-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="paused">Paused (Standby)</option>
                                        <option value="active">Active (Processing)</option>
                                        <option value="offline">Offline (Maintenance)</option>
                                    </select>
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">API Webhook Endpoint (Optional)</label>
                                    <input type="url" id="prov-auto-endpoint" placeholder="https://hook.us1.make.com/..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:border-ma-indigo focus:outline-none transition">
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Task Directives</label>
                                    <textarea id="prov-auto-log" rows="3" placeholder="Define startup parameters or initial terminal logs..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4 shrink-0">
                                <button type="button" onclick="window.AutomationCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Initialize Core <i class="fa-solid fa-power-off"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.AutomationSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Booting...';

            try {
                const data = {
                    name: document.getElementById('prov-auto-name').value,
                    type: document.getElementById('prov-auto-type').value,
                    status: document.getElementById('prov-auto-status').value,
                    efficiency: 100, // Starts at 100% health
                    endpoint: document.getElementById('prov-auto-endpoint').value,
                    taskLog: document.getElementById('prov-auto-log').value || 'Boot sequence initiated...',
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "automations"), data);
                window.AutomationCloseModal();
                window.AutomationToast("Synthetic node successfully booted.");
                Automation.init(); // Reload to refresh grid and stats
            } catch (err) {
                console.error(err);
                window.AutomationToast("Boot failure: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initialize Core <i class="fa-solid fa-power-off"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.AutomationInspectNode = (nodeId) => {
            const item = Automation.allNodes.find(n => n.id === nodeId);
            if(!item) return;

            const container = document.getElementById('automation-modal-container');
            const icon = Automation.getTypeIcon(item.type);
            const status = (item.status || 'paused').toLowerCase();
            const statusData = Automation.getStatusStyles(status);
            const eff = item.efficiency || 0;

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-wrench text-ma-indigo"></i> Node Configuration</h3>
                            <button onclick="window.AutomationCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Hero / Title -->
                            <div class="flex items-start gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 text-white shrink-0 shadow-lg">
                                    <i class="fa-solid ${icon}"></i>
                                </div>
                                <div class="flex-1 w-full">
                                    <input type="text" id="edit-auto-name-${item.id}" value="${item.name || ''}" class="bg-transparent w-full text-white font-display font-bold text-xl focus:outline-none focus:border-b focus:border-ma-indigo transition-colors" placeholder="Node Designation">
                                    <div class="flex items-center gap-2 mt-2">
                                        <span class="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">UID: ${item.id.substring(0,8)}</span>
                                    </div>
                                </div>
                                <button onclick="window.AutomationUpdateField('${item.id}', 'name', document.getElementById('edit-auto-name-${item.id}').value)" class="text-ma-indigo hover:text-white transition mt-1"><i class="fa-solid fa-save"></i></button>
                            </div>

                            <!-- Operational Core Controls -->
                            <div class="space-y-3">
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2">Core Controls</h5>
                                
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Architecture</p>
                                        <select onchange="window.AutomationUpdateField('${item.id}', 'type', this.value)" class="bg-transparent w-full text-white text-xs font-bold focus:outline-none cursor-pointer">
                                            <option value="Video Generation" class="bg-ma-dark" ${item.type === 'Video Generation' ? 'selected' : ''}>Video Pipeline</option>
                                            <option value="Social Bot" class="bg-ma-dark" ${item.type === 'Social Bot' ? 'selected' : ''}>Social Bot</option>
                                            <option value="Data Scraper" class="bg-ma-dark" ${item.type === 'Data Scraper' ? 'selected' : ''}>Data Scraper</option>
                                            <option value="AI Agent" class="bg-ma-dark" ${item.type === 'AI Agent' ? 'selected' : ''}>AI Agent</option>
                                        </select>
                                    </div>
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Engine Status</p>
                                        <select onchange="window.AutomationUpdateField('${item.id}', 'status', this.value)" class="bg-transparent w-full text-xs font-bold focus:outline-none cursor-pointer ${statusData.textColor}">
                                            <option value="active" class="bg-ma-dark text-white" ${status === 'active' ? 'selected' : ''}>Active</option>
                                            <option value="paused" class="bg-ma-dark text-white" ${status === 'paused' ? 'selected' : ''}>Paused</option>
                                            <option value="offline" class="bg-ma-dark text-white" ${status === 'offline' ? 'selected' : ''}>Offline</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Efficiency Tuning -->
                                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div class="flex justify-between items-center mb-3">
                                        <label class="text-[10px] font-mono uppercase text-slate-500 tracking-widest">Efficiency Output</label>
                                        <span class="text-sm font-bold text-white" id="eff-val-display">${eff}%</span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <input type="range" id="edit-auto-eff-${item.id}" min="0" max="100" value="${eff}" class="w-full h-2 bg-ma-dark rounded-lg appearance-none cursor-pointer accent-ma-indigo" oninput="document.getElementById('eff-val-display').innerText = this.value + '%'">
                                        <button onclick="window.AutomationUpdateField('${item.id}', 'efficiency', Number(document.getElementById('edit-auto-eff-${item.id}').value))" class="w-8 h-8 rounded-lg bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white transition flex items-center justify-center shrink-0"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>
                            </div>

                            <!-- Networking -->
                            <div>
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2 mb-3">Networking</h5>
                                <div>
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">API Webhook Endpoint</p>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <i class="fa-solid fa-link text-slate-500 mr-2 text-xs"></i>
                                        <input type="url" id="edit-auto-endpoint-${item.id}" value="${item.endpoint || ''}" class="bg-transparent w-full text-slate-300 font-mono text-[10px] focus:outline-none" placeholder="https://...">
                                        <button onclick="window.AutomationUpdateField('${item.id}', 'endpoint', document.getElementById('edit-auto-endpoint-${item.id}').value)" class="text-ma-indigo hover:text-white transition ml-2"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>
                            </div>

                            <!-- Terminal Logs -->
                            <div>
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2 mb-3">Terminal Environment</h5>
                                <div class="bg-black/50 border border-white/5 rounded-xl p-1">
                                    <div class="px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5">
                                        <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                        <div class="w-2 h-2 rounded-full bg-ma-emerald"></div>
                                        <span class="text-[9px] text-slate-600 font-mono ml-2 uppercase tracking-widest">Sys_Log</span>
                                    </div>
                                    <textarea id="edit-auto-log-${item.id}" rows="4" class="w-full bg-transparent text-xs font-mono text-ma-emerald p-3 focus:outline-none resize-none leading-relaxed" spellcheck="false">${item.taskLog || ''}</textarea>
                                    <div class="flex justify-end p-2 border-t border-white/5">
                                        <button onclick="window.AutomationUpdateField('${item.id}', 'taskLog', document.getElementById('edit-auto-log-${item.id}').value)" class="px-3 py-1.5 bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-2 uppercase tracking-widest"><i class="fa-solid fa-terminal"></i> Push Log</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0">
                            <button onclick="window.AutomationDeleteNode('${item.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-skull group-hover:animate-bounce"></i> Decommission Node
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    /* Inline style for slider track */
                    input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        height: 16px;
                        width: 16px;
                        border-radius: 50%;
                        background: #6366f1;
                        cursor: pointer;
                        margin-top: -4px;
                        box-shadow: 0 0 10px rgba(99,102,241,0.5);
                    }
                    input[type=range]::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 8px;
                        cursor: pointer;
                        background: rgba(255,255,255,0.05);
                        border-radius: 4px;
                    }
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.AutomationUpdateField = async (nodeId, field, value) => {
            try {
                await updateDoc(doc(db, "automations", nodeId), { [field]: value, updatedAt: serverTimestamp() });
                window.AutomationToast(`Telemetry updated: '${field}' synchronized.`);
                
                // Update local array quietly
                const item = Automation.allNodes.find(n => n.id === nodeId);
                if(item) item[field] = value;
                
                // Re-render UI seamlessly
                Automation.applyFilters(document.getElementById('auto-search')?.value.toLowerCase() || '', Automation.currentFilter);
                
                // Ensure stats update correctly without flicker if status/eff changed
                if(field === 'status' || field === 'efficiency') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Automation.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('automation-modal-container').innerHTML !== '') {
                            window.AutomationInspectNode(nodeId); // Re-open
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.AutomationToast("Telemetry sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.AutomationDeleteNode = (nodeId) => {
            const item = Automation.allNodes.find(n => n.id === nodeId);
            if(!item) return;

            const container = document.getElementById('automation-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-power-off"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Decommission Node</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate <span class="text-white font-bold">${item.name || 'this node'}</span> from the architecture. This destroys all connected hooks.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DECOMMISSION" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.AutomationInspectNode('${nodeId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.AutomationExecuteDelete('${nodeId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.AutomationExecuteDelete = async (nodeId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DECOMMISSION') {
                return window.AutomationToast("Confirmation failed. Type DECOMMISSION exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "automations", nodeId));
                window.AutomationCloseModal();
                window.AutomationToast("Node successfully eradicated.");
                Automation.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.AutomationToast("Eradication failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'automation') {
        Automation.init();
    }
});