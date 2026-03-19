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
 * Blog Component - Advanced Content Management System (Lab Articles)
 */
const Blog = {
    allArticles: [],
    filteredArticles: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchArticles();
            this.filteredArticles = [...this.allArticles];

            container.innerHTML = this.renderUI();
            this.renderArticlesTable(this.filteredArticles);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Blog Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchArticles() {
        const snap = await getDocs(collection(db, "articles"));
        this.allArticles = [];
        snap.forEach(doc => {
            this.allArticles.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allArticles.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allArticles.length;
        const published = this.allArticles.filter(a => (a.status || 'draft').toLowerCase() === 'published').length;
        const drafts = total - published;
        const uniqueCategories = new Set(this.allArticles.map(a => (a.category || 'General').toLowerCase())).size;

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
                            <i class="fa-solid fa-rss text-ma-indigo"></i> Lab Articles
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Manage insights, experiments, and technical publications for the public vault.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.BlogExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Log
                        </button>
                        <button onclick="window.BlogOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-pen-nib"></i> Compose Article
                        </button>
                        <button onclick="window.loadSection('blog')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Articles</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Published (Live)</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.published}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-globe"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Drafts / Hidden</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.drafts}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-eye-slash"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Categories</p>
                            <h4 class="text-2xl font-display font-bold text-ma-cyan">${stats.uniqueCategories}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-cyan/10 text-ma-cyan flex items-center justify-center border border-ma-cyan/20 group-hover:scale-110 transition"><i class="fa-solid fa-tags"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition">All</button>
                            <button data-filter="published" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Published</button>
                            <button data-filter="draft" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Drafts</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="blog-search" placeholder="Search titles or authors..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Title & Author</th>
                                    <th class="px-6 py-4 font-medium">Category</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium">Published Date</th>
                                    <th class="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="blog-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="blog-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="blog-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderArticlesTable(articles) {
        const tbody = document.getElementById('blog-table-body');
        if (!tbody) return;

        if (articles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-file-signature"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No articles documented.</p>
                        <p class="text-xs text-slate-600 mt-1">Compose your first lab article to populate the vault.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = articles.map(article => {
            const status = (article.status || 'draft').toLowerCase();
            const dateStr = article.createdAt ? new Date(article.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
            
            let statusMarkup = '';
            if (status === 'published') {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-ma-emerald bg-ma-emerald/10 border border-ma-emerald/20 px-2.5 py-1 rounded w-fit"><span class="w-1.5 h-1.5 rounded-full bg-ma-emerald"></span> Published</span>`;
            } else {
                statusMarkup = `<span class="flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded w-fit"><i class="fa-solid fa-eye-slash"></i> Draft</span>`;
            }

            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.BlogInspectNode('${article.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-ma-slate flex items-center justify-center text-slate-400 border border-white/5 group-hover:border-ma-indigo/30 group-hover:text-ma-indigo transition-all shrink-0 overflow-hidden relative">
                            ${article.imageUrl ? `<img src="${article.imageUrl}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity">` : `<i class="fa-solid fa-newspaper text-sm"></i>`}
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-sm font-bold text-white truncate group-hover:text-ma-indigo transition">${article.title || 'Untitled Article'}</p>
                            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">By ${article.author || 'Admin'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-xs font-medium text-slate-300 bg-white/5 px-3 py-1 rounded-lg border border-white/10">${article.category || 'General'}</span>
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
                        <button onclick="window.BlogInspectNode('${article.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all" title="Edit Article">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="window.BlogDeleteNode('${article.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all" title="Delete">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('blog-search');
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
                const term = document.getElementById('blog-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredArticles = this.allArticles.filter(a => {
            const title = (a.title || '').toLowerCase();
            const author = (a.author || '').toLowerCase();
            const matchesSearch = title.includes(searchTerm) || author.includes(searchTerm);
            
            const aStatus = (a.status || 'draft').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'published') matchesStatus = aStatus === 'published';
            else if (statusFilter === 'draft') matchesStatus = aStatus === 'draft';
            
            return matchesSearch && matchesStatus;
        });
        this.renderArticlesTable(this.filteredArticles);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-rss fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Content_Vault...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Vault Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('blog')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Rendering</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.BlogToast = (msg, type = 'success') => {
            const container = document.getElementById('blog-toast-container');
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

        window.BlogExportData = () => {
            if(Blog.filteredArticles.length === 0) return window.BlogToast("No data to export", "error");
            
            let csv = "ArticleID,Title,Author,Category,Status,Date\n";
            Blog.filteredArticles.forEach(a => {
                let dateStr = '';
                if(a.createdAt) dateStr = a.createdAt.seconds ? new Date(a.createdAt.seconds * 1000).toISOString() : a.createdAt;
                
                const safeTitle = (a.title || '').replace(/"/g, '""');
                csv += `"${a.id}","${safeTitle}","${a.author||''}","${a.category||''}","${a.status||'draft'}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Lab_Articles_Export_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.BlogToast("Article log exported successfully.");
        };

        window.BlogCloseModal = () => {
            const container = document.getElementById('blog-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.BlogOpenProvisionModal = () => {
            const container = document.getElementById('blog-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-pen-nib text-ma-indigo"></i> Compose Article</h3>
                            <button onclick="window.BlogCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.BlogSubmitProvision(event)" class="flex-1 overflow-y-auto custom-scroll flex flex-col">
                            <div class="p-6 space-y-6 flex-1">
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div class="md:col-span-2">
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Article Title</label>
                                        <input type="text" id="prov-blog-title" required placeholder="e.g. The Future of AI Automations" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Category / Tag</label>
                                        <input type="text" id="prov-blog-cat" required placeholder="Automation" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Author</label>
                                        <input type="text" id="prov-blog-author" required value="Mubashir Arham" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Cover Image URL</label>
                                        <input type="url" id="prov-blog-image" placeholder="https://..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-slate-300 text-xs font-mono focus:border-ma-indigo focus:outline-none transition">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Status</label>
                                        <select id="prov-blog-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="published">Published (Live)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="flex-1 flex flex-col">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5 flex justify-between">
                                        <span>Content Body (Markdown Supported)</span>
                                    </label>
                                    <textarea id="prov-blog-content" required class="w-full h-64 bg-ma-slate border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:border-ma-indigo focus:outline-none transition resize-none custom-scroll leading-relaxed font-mono" placeholder="Write your technical insight here..."></textarea>
                                </div>
                            </div>
                            <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex justify-end gap-3">
                                <button type="button" onclick="window.BlogCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Commit to Vault <i class="fa-solid fa-save"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.BlogSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Committing...';

            try {
                const data = {
                    title: document.getElementById('prov-blog-title').value,
                    category: document.getElementById('prov-blog-cat').value,
                    author: document.getElementById('prov-blog-author').value,
                    imageUrl: document.getElementById('prov-blog-image').value,
                    status: document.getElementById('prov-blog-status').value,
                    content: document.getElementById('prov-blog-content').value,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "articles"), data);
                window.BlogCloseModal();
                window.BlogToast("Article compiled and stored.");
                Blog.init(); // Reload
            } catch (err) {
                console.error(err);
                window.BlogToast(err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Commit to Vault <i class="fa-solid fa-save"></i>';
            }
        };


        // --- INSPECT MODAL (Settings / Edit) ---
        window.BlogInspectNode = (articleId) => {
            const article = Blog.allArticles.find(a => a.id === articleId);
            if(!article) return;

            const container = document.getElementById('blog-modal-container');
            const status = (article.status || 'draft').toLowerCase();
            const bgImage = article.imageUrl ? `url('${article.imageUrl}')` : 'none';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[95vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out] overflow-hidden">
                        
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-pen-to-square text-ma-indigo"></i> Editor Node</h3>
                            <button onclick="window.BlogCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll">
                            
                            <!-- Cover Image Header -->
                            <div class="h-40 w-full relative bg-cover bg-center border-b border-white/5" style="background-image: ${bgImage}; background-color: #0f172a;">
                                <div class="absolute inset-0 bg-gradient-to-t from-ma-dark to-transparent"></div>
                                ${!article.imageUrl ? '<div class="absolute inset-0 flex items-center justify-center opacity-30"><i class="fa-solid fa-image text-4xl text-white"></i></div>' : ''}
                            </div>

                            <div class="p-6 space-y-6 relative z-10 -mt-16">
                                
                                <div class="bg-ma-dark/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
                                    <input type="text" id="edit-blog-title-${article.id}" value="${article.title || ''}" class="bg-transparent w-full text-xl font-display font-bold text-white focus:outline-none focus:border-b border-white/10 pb-1 mb-2" placeholder="Article Title">
                                    <div class="flex items-center justify-between mt-2">
                                        <div class="flex items-center gap-3 w-full">
                                            <input type="text" id="edit-blog-cat-${article.id}" value="${article.category || ''}" class="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none w-32" placeholder="Category">
                                            <input type="text" id="edit-blog-author-${article.id}" value="${article.author || ''}" class="bg-transparent text-xs text-slate-500 font-mono focus:outline-none w-32" placeholder="Author">
                                        </div>
                                        <button onclick="window.BlogUpdateMultipleFields('${article.id}')" class="px-3 py-1.5 rounded-lg bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white transition text-[10px] font-bold uppercase tracking-widest shrink-0"><i class="fa-solid fa-save"></i> Save Meta</button>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Visibility Status</p>
                                        <select onchange="window.BlogUpdateField('${article.id}', 'status', this.value)" class="bg-transparent w-full text-sm font-bold focus:outline-none cursor-pointer ${status === 'published' ? 'text-ma-emerald' : 'text-amber-400'}">
                                            <option value="draft" class="bg-ma-dark text-white" ${status === 'draft' ? 'selected' : ''}>Draft (Hidden)</option>
                                            <option value="published" class="bg-ma-dark text-white" ${status === 'published' ? 'selected' : ''}>Published (Live)</option>
                                        </select>
                                    </div>
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Cover Image URL</p>
                                        <div class="flex items-center">
                                            <input type="url" id="edit-blog-image-${article.id}" value="${article.imageUrl || ''}" class="bg-transparent w-full text-slate-300 font-mono text-[10px] focus:outline-none" placeholder="https://...">
                                            <button onclick="window.BlogUpdateField('${article.id}', 'imageUrl', document.getElementById('edit-blog-image-${article.id}').value)" class="text-ma-indigo hover:text-white transition ml-2"><i class="fa-solid fa-save"></i></button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Content Body -->
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest flex items-center gap-2"><i class="fa-solid fa-align-left"></i> Content Editor</p>
                                        <span class="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400">Markdown Supported</span>
                                    </div>
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-1 shadow-inner">
                                        <textarea id="edit-blog-content-${article.id}" rows="15" class="w-full bg-transparent text-sm text-slate-300 p-4 focus:outline-none resize-y leading-relaxed font-mono custom-scroll" placeholder="Write article content...">${article.content || ''}</textarea>
                                        <div class="flex justify-end p-2 border-t border-white/5 bg-white/[0.02]">
                                            <button onclick="window.BlogUpdateField('${article.id}', 'content', document.getElementById('edit-blog-content-${article.id}').value)" class="px-4 py-2 bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Commit Changes</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.BlogDeleteNode('${article.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-trash-can group-hover:animate-bounce"></i> Eradicate Article
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.BlogUpdateField = async (articleId, field, value) => {
            try {
                await updateDoc(doc(db, "articles", articleId), { [field]: value, updatedAt: serverTimestamp() });
                window.BlogToast(`Article updated: '${field}' synchronized.`);
                
                const art = Blog.allArticles.find(a => a.id === articleId);
                if(art) art[field] = value;
                
                Blog.applyFilters(document.getElementById('blog-search')?.value.toLowerCase() || '', Blog.currentFilter);
                
                if(field === 'status' || field === 'imageUrl') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Blog.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('blog-modal-container').innerHTML !== '') {
                            window.BlogInspectNode(articleId);
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.BlogToast("Sync failed.", "error");
            }
        };

        // Helper for the top bar meta save in inspector
        window.BlogUpdateMultipleFields = async (articleId) => {
            const title = document.getElementById(`edit-blog-title-${articleId}`).value;
            const category = document.getElementById(`edit-blog-cat-${articleId}`).value;
            const author = document.getElementById(`edit-blog-author-${articleId}`).value;
            
            try {
                await updateDoc(doc(db, "articles", articleId), { title, category, author, updatedAt: serverTimestamp() });
                window.BlogToast("Article metadata synchronized.");
                
                const art = Blog.allArticles.find(a => a.id === articleId);
                if(art) {
                    art.title = title;
                    art.category = category;
                    art.author = author;
                }
                Blog.applyFilters(document.getElementById('blog-search')?.value.toLowerCase() || '', Blog.currentFilter);
            } catch(e) {
                console.error(e);
                window.BlogToast("Metadata sync failed.", "error");
            }
        }

        // --- DELETE MODAL ---
        window.BlogDeleteNode = (articleId) => {
            const art = Blog.allArticles.find(a => a.id === articleId);
            if(!art) return;

            const container = document.getElementById('blog-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Eradicate Article</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently destroy <span class="text-white font-bold">${art.title || 'this article'}</span>.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DELETE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.BlogInspectNode('${articleId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.BlogExecuteDelete('${articleId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.BlogExecuteDelete = async (articleId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DELETE') {
                return window.BlogToast("Confirmation failed.", "error");
            }

            try {
                await deleteDoc(doc(db, "articles", articleId));
                window.BlogCloseModal();
                window.BlogToast("Article eradicated successfully.");
                Blog.init();
            } catch (e) {
                console.error(e);
                window.BlogToast("Deletion failed.", "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'blog') {
        Blog.init();
    }
});