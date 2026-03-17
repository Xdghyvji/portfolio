import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Portfolio Component
 * Manages the Case Library, project galleries, and technical case studies
 */
const Portfolio = {
    allProjects: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "portfolio"));
            this.allProjects = [];
            snap.forEach(doc => {
                this.allProjects.push({ id: doc.id, ...doc.data() });
            });

            // Sort by order or date
            this.allProjects.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderProjectGrid(this.allProjects);
            this.setupListeners();

        } catch (error) {
            console.error("Portfolio Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Case Library</h2>
                        <p class="text-sm text-slate-500">Documenting project execution, technical architecture, and ROI proofs.</p>
                    </div>
                    <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:bg-ma-indigo/80 transition-all shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-plus"></i> Index New Project
                    </button>
                </div>

                <!-- Search & Filters -->
                <div class="flex flex-wrap items-center gap-4">
                    <div class="relative flex-1 min-w-[300px]">
                        <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                        <input type="text" id="project-search" placeholder="Search case studies..." class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="filter-chip active px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-all cursor-pointer" data-filter="all">All_Nodes</button>
                        <button class="filter-chip px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-all cursor-pointer" data-filter="web">Web_Dev</button>
                        <button class="filter-chip px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-all cursor-pointer" data-filter="seo">SEO_SMM</button>
                    </div>
                </div>

                <!-- Projects Grid -->
                <div id="portfolio-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;
    },

    renderProjectGrid(projects) {
        const grid = document.getElementById('portfolio-grid');
        if (!grid) return;

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-white/10">
                    <i class="fa-solid fa-folder-open text-3xl text-slate-700 mb-4"></i>
                    <p class="text-slate-500 font-mono text-xs uppercase tracking-widest">No_Projects_Indexed</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map(project => `
            <div class="glass-panel group rounded-3xl border border-white/5 overflow-hidden hover:border-ma-indigo/30 transition-all">
                <div class="aspect-video bg-ma-dark relative overflow-hidden">
                    <img src="${project.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-ma-dark via-transparent to-transparent"></div>
                    <div class="absolute top-4 right-4">
                        <span class="px-2 py-1 rounded-lg bg-ma-dark/80 backdrop-blur border border-white/10 text-[9px] font-bold text-ma-indigo uppercase tracking-tighter">
                            ${project.category || 'PROJECT'}
                        </span>
                    </div>
                </div>
                <div class="p-6">
                    <h4 class="text-white font-bold text-lg mb-2">${project.title}</h4>
                    <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">${project.description || 'Detailed technical breakdown pending documentation.'}</p>
                    
                    <div class="flex items-center justify-between pt-6 border-t border-white/5">
                        <div class="flex gap-2">
                             <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                             <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                        <a href="${project.link || '#'}" target="_blank" class="text-[10px] font-bold text-ma-indigo uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                            Live_Link <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    },

    setupListeners() {
        // Search Logic
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.allProjects.filter(p => 
                    p.title.toLowerCase().includes(term) || 
                    p.category?.toLowerCase().includes(term)
                );
                this.renderProjectGrid(filtered);
            });
        }

        // Filter Logic
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.filter-chip').forEach(b => {
                    b.classList.remove('bg-ma-indigo/10', 'text-ma-indigo', 'border-ma-indigo/20', 'active');
                    b.classList.add('text-slate-400');
                });
                btn.classList.add('bg-ma-indigo/10', 'text-ma-indigo', 'border-ma-indigo/20', 'active');
                btn.classList.remove('text-slate-400');

                const filter = btn.dataset.filter;
                const filtered = filter === 'all' 
                    ? this.allProjects 
                    : this.allProjects.filter(p => p.category?.toLowerCase() === filter);
                this.renderProjectGrid(filtered);
            };
        });
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-folder-tree fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning_Case_Library...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-file-circle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Access Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('portfolio')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Link</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'portfolio') {
        Portfolio.init();
    }
});