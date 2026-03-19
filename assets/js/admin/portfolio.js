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
 * Portfolio Component - Advanced Case Library Management
 */
const Portfolio = {
    allCases: [],
    filteredCases: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchCases();
            this.filteredCases = [...this.allCases];

            container.innerHTML = this.renderUI();
            this.renderCasesGrid(this.filteredCases);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Portfolio Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchCases() {
        const snap = await getDocs(collection(db, "portfolio"));
        this.allCases = [];
        snap.forEach(doc => {
            this.allCases.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allCases.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allCases.length;
        const published = this.allCases.filter(c => c.status === 'published').length;
        const drafts = total - published;
        const uniqueCategories = new Set(this.allCases.map(c => (c.category || 'Uncategorized').toLowerCase())).size;

        return { total, published, drafts, uniqueCategories };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-folder-tree text-ma-cyan"></i> Case Library
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Curate, publish, and analyze your public portfolio artifacts and success stories.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.PortfolioExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Log
                        </button>
                        <button onclick="window.PortfolioOpenProvisionModal()" class="px-4 py-2.5 bg-ma-cyan hover:bg-cyan-500 text-ma-dark rounded-xl text-xs font-bold shadow-lg shadow-ma-cyan/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Provision Artifact
                        </button>
                        <button onclick="window.loadSection('portfolio')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-cyan transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Artifacts</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Published</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.published}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-globe"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Sectors</p>
                            <h4 class="text-2xl font-display font-bold text-ma-cyan">${stats.uniqueCategories}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-cyan/10 text-ma-cyan flex items-center justify-center border border-ma-cyan/20 group-hover:scale-110 transition"><i class="fa-solid fa-chart-pie"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Hidden / Drafts</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.drafts}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-eye-slash"></i></div>
                    </div>
                </div>

                <!-- Filters & Grid Container -->
                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-cyan text-ma-dark shadow-lg transition whitespace-nowrap">All Work</button>
                            <button data-filter="web dev" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Web Dev</button>
                            <button data-filter="seo" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">SEO & SMM</button>
                            <button data-filter="automation" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Automation</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="portfolio-search" placeholder="Search titles, clients..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-cyan/50 transition-all">
                        </div>
                    </div>

                    <!-- Visual Grid -->
                    <div class="p-6 overflow-y-auto custom-scroll flex-1">
                        <div id="portfolio-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Cards injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="portfolio-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="portfolio-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderCasesGrid(cases) {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;

        if (cases.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-ghost"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No artifacts found in the registry.</p>
                    <p class="text-xs text-slate-600 mt-1">Adjust filters or provision a new case study.</p>
                </div>`;
            return;
        }

        grid.innerHTML = cases.map(item => {
            const isPublished = item.status === 'published';
            const statusColor = isPublished ? 'ma-emerald' : 'amber-400';
            const bgImage = item.imageUrl ? `url('${item.imageUrl}')` : 'none';
            const fallbackBg = `linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(15,23,42,0.8) 100%)`;

            return `
            <div class="glass-panel rounded-3xl border border-white/5 group hover:border-ma-cyan/30 transition-all flex flex-col overflow-hidden cursor-pointer h-full shadow-lg" onclick="window.PortfolioInspectNode('${item.id}')">
                <!-- Image Header -->
                <div class="h-40 w-full relative border-b border-white/5 bg-cover bg-center overflow-hidden" style="background-image: ${bgImage}; background-color: #0f172a;">
                    ${!item.imageUrl ? `<div class="absolute inset-0" style="background: ${fallbackBg};"></div><div class="absolute inset-0 flex items-center justify-center opacity-30"><i class="fa-solid fa-image text-4xl text-white"></i></div>` : ''}
                    <div class="absolute inset-0 bg-gradient-to-t from-ma-dark to-transparent opacity-80"></div>
                    <div class="absolute top-4 right-4 flex gap-2">
                        <span class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${isPublished ? 'bg-ma-emerald/20 text-ma-emerald border-ma-emerald/30' : 'bg-amber-400/20 text-amber-400 border-amber-400/30'} backdrop-blur-md">
                            ${isPublished ? 'Published' : 'Draft'}
                        </span>
                    </div>
                    <div class="absolute bottom-4 left-4">
                        <span class="px-2 py-1 rounded bg-ma-dark/80 text-white text-[10px] font-mono uppercase tracking-widest border border-white/10 backdrop-blur-sm">
                            ${item.category || 'Uncategorized'}
                        </span>
                    </div>
                </div>

                <!-- Body -->
                <div class="p-6 flex flex-col flex-1 relative">
                    <div class="flex-1">
                        <h4 class="text-lg font-display font-bold text-white mb-1 group-hover:text-ma-cyan transition-colors">${item.title || 'Untitled Project'}</h4>
                        <p class="text-xs text-ma-indigo font-mono mb-3"><i class="fa-solid fa-briefcase"></i> Client: ${item.clientName || 'Confidential'}</p>
                        <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">${item.description || 'No description provided.'}</p>
                    </div>

                    <!-- ROI/Result Footer -->
                    <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div>
                            <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">Primary Result</p>
                            <p class="text-sm font-bold text-ma-emerald"><i class="fa-solid fa-arrow-trend-up"></i> ${item.roi || 'N/A'}</p>
                        </div>
                        <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                            <button onclick="window.PortfolioDeleteNode('${item.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all" title="Delete Artifact">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('portfolio-search');
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
                    b.classList.remove('bg-ma-cyan', 'text-ma-dark', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-cyan', 'text-ma-dark', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('portfolio-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, categoryFilter) {
        this.filteredCases = this.allCases.filter(c => {
            const titleMatch = (c.title && c.title.toLowerCase().includes(searchTerm));
            const clientMatch = (c.clientName && c.clientName.toLowerCase().includes(searchTerm));
            const matchesSearch = titleMatch || clientMatch;
            
            const cCategory = (c.category || 'uncategorized').toLowerCase();
            const matchesCategory = categoryFilter === 'all' || cCategory === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
        this.renderCasesGrid(this.filteredCases);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-folder-tree fa-fade text-4xl text-ma-cyan"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Decrypting_Artifact_Vault...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Vault Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('portfolio')" class="px-8 py-3 rounded-xl bg-ma-cyan text-ma-dark text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-cyan/20 transition-all">Retry Decryption</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.PortfolioToast = (msg, type = 'success') => {
            const container = document.getElementById('portfolio-toast-container');
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

        window.PortfolioExportData = () => {
            if(Portfolio.filteredCases.length === 0) return window.PortfolioToast("No data to export", "error");
            
            let csv = "ID,Title,Client,Category,Status,ROI,Date\n";
            Portfolio.filteredCases.forEach(c => {
                let dateStr = '';
                if(c.createdAt) dateStr = c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000).toISOString() : c.createdAt;
                
                const safeTitle = (c.title || '').replace(/"/g, '""');
                const safeClient = (c.clientName || '').replace(/"/g, '""');
                const safeRoi = (c.roi || '').replace(/"/g, '""');

                csv += `"${c.id}","${safeTitle}","${safeClient}","${c.category || ''}","${c.status||'draft'}","${safeRoi}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_CaseLibrary_Export_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.PortfolioToast("Vault log exported successfully.");
        };

        window.PortfolioCloseModal = () => {
            const container = document.getElementById('portfolio-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.PortfolioOpenProvisionModal = () => {
            const container = document.getElementById('portfolio-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-wand-magic-sparkles text-ma-cyan"></i> Provision New Artifact</h3>
                            <button onclick="window.PortfolioCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.PortfolioSubmitProvision(event)" class="p-6 overflow-y-auto custom-scroll space-y-5">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Project Title</label>
                                    <input type="text" id="prov-port-title" required placeholder="e.g., Global E-Com Scale" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                                </div>
                                
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Name</label>
                                    <input type="text" id="prov-port-client" required placeholder="e.g., TechStart Inc." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Sector / Category</label>
                                    <select id="prov-port-cat" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition cursor-pointer">
                                        <option value="Web Dev">Web Development</option>
                                        <option value="SEO">SEO & SMM</option>
                                        <option value="Automation">AI & Automation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Result / ROI</label>
                                    <input type="text" id="prov-port-roi" placeholder="e.g., +200% Traffic, $50k MRR" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Publication Status</label>
                                    <select id="prov-port-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition cursor-pointer">
                                        <option value="published">Published (Live)</option>
                                        <option value="draft">Draft (Hidden)</option>
                                    </select>
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Cover Image URL (Optional)</label>
                                    <input type="url" id="prov-port-image" placeholder="https://..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition font-mono text-xs">
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Detailed Narrative</label>
                                    <textarea id="prov-port-desc" rows="4" required placeholder="Describe the challenge, solution, and execution..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-cyan focus:outline-none transition resize-none"></textarea>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4 shrink-0">
                                <button type="button" onclick="window.PortfolioCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-cyan hover:bg-cyan-500 text-ma-dark text-sm font-bold transition shadow-lg shadow-ma-cyan/20 flex items-center gap-2">Initialize Artifact <i class="fa-solid fa-check"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.PortfolioSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling...';

            try {
                const data = {
                    title: document.getElementById('prov-port-title').value,
                    clientName: document.getElementById('prov-port-client').value,
                    category: document.getElementById('prov-port-cat').value,
                    roi: document.getElementById('prov-port-roi').value,
                    status: document.getElementById('prov-port-status').value,
                    imageUrl: document.getElementById('prov-port-image').value,
                    description: document.getElementById('prov-port-desc').value,
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "portfolio"), data);
                window.PortfolioCloseModal();
                window.PortfolioToast("Artifact securely stored in vault.");
                Portfolio.init(); // Reload to refresh grid and stats
            } catch (err) {
                console.error(err);
                window.PortfolioToast("Compilation failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initialize Artifact <i class="fa-solid fa-check"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.PortfolioInspectNode = (caseId) => {
            const item = Portfolio.allCases.find(c => c.id === caseId);
            if(!item) return;

            const container = document.getElementById('portfolio-modal-container');
            const isPublished = item.status === 'published';
            const bgImage = item.imageUrl ? `url('${item.imageUrl}')` : 'none';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-microscope text-ma-cyan"></i> Artifact Inspector</h3>
                            <button onclick="window.PortfolioCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll">
                            <!-- Image Header -->
                            <div class="h-32 w-full relative bg-cover bg-center" style="background-image: ${bgImage}; background-color: #0f172a;">
                                <div class="absolute inset-0 bg-gradient-to-t from-ma-dark to-transparent"></div>
                            </div>
                            
                            <div class="p-6 space-y-6 -mt-10 relative z-10">
                                
                                <!-- Title & Status -->
                                <div>
                                    <div class="flex items-center gap-3 mb-2">
                                        <select onchange="window.PortfolioUpdateField('${item.id}', 'status', this.value)" class="bg-ma-slate border border-white/10 text-xs font-bold px-3 py-1 rounded-lg focus:outline-none cursor-pointer ${isPublished ? 'text-ma-emerald' : 'text-amber-400'}">
                                            <option value="published" class="text-white" ${isPublished ? 'selected' : ''}>Published</option>
                                            <option value="draft" class="text-white" ${!isPublished ? 'selected' : ''}>Draft</option>
                                        </select>
                                        <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded">ID: ${item.id.substring(0,6)}</span>
                                    </div>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-xl px-3 py-2 mt-2">
                                        <input type="text" id="edit-port-title-${item.id}" value="${item.title || ''}" class="bg-transparent w-full text-white font-display font-bold text-lg focus:outline-none" placeholder="Project Title">
                                        <button onclick="window.PortfolioUpdateField('${item.id}', 'title', document.getElementById('edit-port-title-${item.id}').value)" class="text-ma-cyan hover:text-white transition"><i class="fa-solid fa-save text-sm"></i></button>
                                    </div>
                                </div>

                                <!-- Metadata Grid -->
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Client Node</p>
                                        <div class="flex items-center">
                                            <input type="text" id="edit-port-client-${item.id}" value="${item.clientName || ''}" class="bg-transparent w-full text-white text-xs font-bold focus:outline-none">
                                            <button onclick="window.PortfolioUpdateField('${item.id}', 'clientName', document.getElementById('edit-port-client-${item.id}').value)" class="text-ma-cyan hover:text-white transition"><i class="fa-solid fa-check text-[10px]"></i></button>
                                        </div>
                                    </div>
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Category</p>
                                        <select onchange="window.PortfolioUpdateField('${item.id}', 'category', this.value)" class="bg-transparent w-full text-white text-xs font-bold focus:outline-none cursor-pointer">
                                            <option value="Web Dev" class="bg-ma-dark" ${item.category === 'Web Dev' ? 'selected' : ''}>Web Dev</option>
                                            <option value="SEO" class="bg-ma-dark" ${item.category === 'SEO' ? 'selected' : ''}>SEO & SMM</option>
                                            <option value="Automation" class="bg-ma-dark" ${item.category === 'Automation' ? 'selected' : ''}>Automation</option>
                                            <option value="Other" class="bg-ma-dark" ${item.category === 'Other' ? 'selected' : ''}>Other</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- ROI & Image -->
                                <div class="space-y-3">
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-3 flex items-center justify-between">
                                        <div class="flex-1 mr-2">
                                            <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Primary ROI</p>
                                            <input type="text" id="edit-port-roi-${item.id}" value="${item.roi || ''}" placeholder="e.g. +30% Sales" class="bg-transparent w-full text-ma-emerald text-sm font-bold focus:outline-none">
                                        </div>
                                        <button onclick="window.PortfolioUpdateField('${item.id}', 'roi', document.getElementById('edit-port-roi-${item.id}').value)" class="w-8 h-8 rounded-lg bg-ma-emerald/10 text-ma-emerald hover:bg-ma-emerald hover:text-white transition flex items-center justify-center shrink-0"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                    
                                    <div>
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Cover Image URL</p>
                                        <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                            <input type="url" id="edit-port-image-${item.id}" value="${item.imageUrl || ''}" class="bg-transparent w-full text-slate-300 text-xs font-mono focus:outline-none" placeholder="https://...">
                                            <button onclick="window.PortfolioUpdateField('${item.id}', 'imageUrl', document.getElementById('edit-port-image-${item.id}').value)" class="text-ma-cyan hover:text-white text-xs font-bold transition ml-2"><i class="fa-solid fa-save"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Description -->
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Artifact Narrative</p>
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-1">
                                        <textarea id="edit-port-desc-${item.id}" rows="5" class="w-full bg-transparent text-sm text-slate-300 p-3 focus:outline-none resize-none leading-relaxed">${item.description || ''}</textarea>
                                        <div class="flex justify-end p-2 border-t border-white/5">
                                            <button onclick="window.PortfolioUpdateField('${item.id}', 'description', document.getElementById('edit-port-desc-${item.id}').value)" class="px-3 py-1.5 bg-ma-cyan/10 text-ma-cyan hover:bg-ma-cyan hover:text-ma-dark rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Commit Log</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0">
                            <button onclick="window.PortfolioDeleteNode('${item.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-skull group-hover:animate-bounce"></i> Eradicate Artifact
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.PortfolioUpdateField = async (caseId, field, value) => {
            try {
                await updateDoc(doc(db, "portfolio", caseId), { [field]: value, updatedAt: serverTimestamp() });
                window.PortfolioToast(`Vault updated: '${field}' synchronized.`);
                
                // Update local array quietly
                const item = Portfolio.allCases.find(c => c.id === caseId);
                if(item) item[field] = value;
                
                // Re-render UI seamlessly
                Portfolio.applyFilters(document.getElementById('portfolio-search')?.value.toLowerCase() || '', Portfolio.currentFilter);
                
                // If updating status, ensure stats at the top update correctly
                if(field === 'status' || field === 'category') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Portfolio.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('portfolio-modal-container').innerHTML !== '') {
                            window.PortfolioInspectNode(caseId); // Re-open
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.PortfolioToast("Vault sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.PortfolioDeleteNode = (caseId) => {
            const item = Portfolio.allCases.find(c => c.id === caseId);
            if(!item) return;

            const container = document.getElementById('portfolio-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire-flame-curved"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Discard Artifact</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate <span class="text-white font-bold">${item.title}</span> from the portfolio vault. This cannot be reversed.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DELETE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.PortfolioInspectNode('${caseId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.PortfolioExecuteDelete('${caseId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.PortfolioExecuteDelete = async (caseId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DELETE') {
                return window.PortfolioToast("Confirmation failed. Type DELETE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "portfolio", caseId));
                window.PortfolioCloseModal();
                window.PortfolioToast("Artifact eradicated from vault.");
                Portfolio.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.PortfolioToast("Eradication failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'portfolio') {
        Portfolio.init();
    }
});