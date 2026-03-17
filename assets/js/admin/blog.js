import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Blog Component
 * Manages "The Lab" articles, editorial workflows, and content distribution
 */
const Blog = {
    allArticles: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "blog"));
            this.allArticles = [];
            snap.forEach(doc => {
                this.allArticles.push({ id: doc.id, ...doc.data() });
            });

            // Sort by published date (newest first)
            this.allArticles.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderBlogGrid(this.allArticles);
            this.setupListeners();

        } catch (error) {
            console.error("Blog Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">The Lab (Blog)</h2>
                        <p class="text-sm text-slate-500">Publishing technical insights, agency strategies, and ecosystem updates.</p>
                    </div>
                    <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:bg-ma-indigo/80 transition-all shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-pen-nib"></i> Compose Article
                    </button>
                </div>

                <!-- Search and Filters -->
                <div class="flex flex-wrap items-center gap-4">
                    <div class="relative flex-1 min-w-[300px]">
                        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                        <input type="text" id="blog-search" placeholder="Filter articles..." class="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                    </div>
                </div>

                <!-- Blog Grid -->
                <div id="blog-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Article cards injected here -->
                </div>
            </div>
        `;
    },

    renderBlogGrid(articles) {
        const grid = document.getElementById('blog-grid');
        if (!grid) return;

        if (articles.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-white/10">
                    <i class="fa-solid fa-newspaper text-3xl text-slate-700 mb-4"></i>
                    <p class="text-slate-500 font-mono text-xs uppercase tracking-widest">No_Articles_Detected_In_Stream</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = articles.map(article => `
            <div class="glass-panel group rounded-3xl border border-white/5 overflow-hidden hover:border-ma-indigo/30 transition-all flex flex-col">
                <div class="aspect-[16/9] bg-ma-slate relative overflow-hidden">
                    <img src="${article.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80'}" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-ma-dark via-transparent to-transparent"></div>
                    <div class="absolute top-4 left-4">
                        <span class="px-2 py-1 rounded-lg bg-ma-dark/80 backdrop-blur border border-white/10 text-[9px] font-bold text-ma-emerald uppercase tracking-widest">
                            ${article.category || 'INSIGHT'}
                        </span>
                    </div>
                </div>
                <div class="p-6 flex-1 flex flex-col">
                    <div class="flex items-center gap-2 mb-3 text-[10px] font-mono text-slate-500 uppercase">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${article.date ? new Date(article.date.seconds * 1000).toLocaleDateString() : 'DRAFT'}</span>
                        <span class="mx-1">•</span>
                        <i class="fa-regular fa-clock"></i>
                        <span>${article.readTime || '5m'} Read</span>
                    </div>
                    <h4 class="text-white font-bold text-lg mb-2 group-hover:text-ma-indigo transition-colors">${article.title}</h4>
                    <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">${article.excerpt || 'No summary available for this node.'}</p>
                    
                    <div class="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div class="flex gap-2">
                             <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                <i class="fa-solid fa-edit text-xs"></i>
                            </button>
                             <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </div>
                        <span class="text-[9px] font-bold ${article.status === 'published' ? 'text-ma-emerald' : 'text-amber-500'} uppercase tracking-widest">
                            ${article.status || 'DRAFT'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.allArticles.filter(a => 
                    a.title.toLowerCase().includes(term) || 
                    a.category?.toLowerCase().includes(term)
                );
                this.renderBlogGrid(filtered);
            });
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-rss fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Lab_Archives...</p>
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
                <button onclick="window.loadSection('blog')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'blog') {
        Blog.init();
    }
});