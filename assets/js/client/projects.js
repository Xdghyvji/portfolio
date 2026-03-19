import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (Matching index.html)
const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app",
    messagingSenderId: "473586363516",
    appId: "1:473586363516:web:d7b9db91eba86f8809adf9",
    measurementId: "G-P25VB35JSM"
};

// Initialize or get existing Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Client Projects Component - Advanced Pipeline & Execution Tracking
 */
const Projects = {
    allProjects: [],
    filteredProjects: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('client-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchProjects();
            this.filteredProjects = [...this.allProjects];

            container.innerHTML = this.renderUI();
            this.renderProjectsGrid(this.filteredProjects);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Projects Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchProjects() {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication node disconnected.");

        // Fetch Orders (Projects) assigned to this user
        const projectsRef = collection(db, "orders");
        const q = query(projectsRef, where("clientEmail", "==", user.email));
        const snap = await getDocs(q);
        
        this.allProjects = [];
        snap.forEach(doc => {
            this.allProjects.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allProjects.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allProjects.length;
        const active = this.allProjects.filter(p => {
            const s = (p.status || '').toLowerCase();
            return s === 'active' || s.includes('progress');
        }).length;
        const completed = this.allProjects.filter(p => {
            const s = (p.status || '').toLowerCase();
            return s === 'completed' || s === 'delivered';
        }).length;
        const pending = total - active - completed;
        
        let avgProgress = 0;
        if (total > 0) {
            const totalProg = this.allProjects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0);
            avgProgress = Math.round(totalProg / total);
        }

        return { total, active, completed, pending, avgProgress };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative max-w-6xl mx-auto">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-diagram-project text-ma-indigo"></i> Active Workspace
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Track the execution status, progress, and scope of your deployed modules.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.ProjectsOpenRequestModal()" class="px-5 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-rocket"></i> Request Expansion
                        </button>
                        <button onclick="window.loadSection('projects')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Deployments</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Modules</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.active}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-laptop-code"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Completed</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.completed}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-check-double"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Mean Execution</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.avgProgress}%</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-bars-progress"></i></div>
                    </div>
                </div>

                <!-- Filters & Grid Container -->
                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition whitespace-nowrap">All Projects</button>
                            <button data-filter="active" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Active</button>
                            <button data-filter="completed" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Completed</button>
                            <button data-filter="pending" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Pending</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="project-search" placeholder="Search parameters..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <!-- Visual Grid -->
                    <div class="p-6 overflow-y-auto custom-scroll flex-1 bg-ma-dark/20">
                        <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Cards injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="projects-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="projects-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderProjectsGrid(projects) {
        const grid = document.getElementById('projects-grid');
        if (!grid) return;

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-ghost"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No active modules in your workspace.</p>
                    <p class="text-xs text-slate-600 mt-1 mb-6">Initialize a new project request to begin architecture.</p>
                    <button onclick="window.ProjectsOpenRequestModal()" class="px-6 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition">
                        Request Expansion
                    </button>
                </div>`;
            return;
        }

        grid.innerHTML = projects.map(project => {
            const status = (project.status || 'pending').toLowerCase();
            const statusData = this.getStatusStyles(status);
            const progress = project.progress || 0;
            const amount = Number(project.amount) ? `$${Number(project.amount).toLocaleString()}` : 'TBD';
            const date = project.createdAt ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : 'Legacy';

            return `
            <div class="glass-panel rounded-3xl border border-white/5 group hover:border-${statusData.rawColor}/30 transition-all flex flex-col overflow-hidden cursor-pointer h-full relative shadow-lg" onclick="window.ProjectsInspectNode('${project.id}')">
                
                <!-- Ambient Hover Glow -->
                <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-${statusData.rawColor}/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>

                <!-- Progress Background Overlay -->
                <div class="absolute bottom-0 left-0 h-1 bg-white/5 w-full z-0">
                    <div class="h-full bg-${statusData.rawColor} transition-all duration-1000 shadow-[0_0_10px_currentColor]" style="width: ${progress}%"></div>
                </div>

                <div class="p-6 flex flex-col flex-1 relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:text-${statusData.rawColor} transition-all shadow-lg">
                                <i class="fa-solid fa-layer-group text-lg"></i>
                            </div>
                            <div>
                                <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${statusData.style} flex items-center gap-1 w-fit">
                                    ${status === 'active' || status.includes('progress') ? '<span class="w-1.5 h-1.5 rounded-full bg-ma-indigo animate-pulse"></span>' : ''}
                                    ${statusData.label}
                                </span>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">ID: ${project.id.substring(0,6)}</p>
                            </div>
                        </div>
                        <button class="text-slate-500 hover:text-white transition"><i class="fa-solid fa-arrow-right -rotate-45"></i></button>
                    </div>

                    <div class="flex-1 mb-6">
                        <h4 class="text-lg font-display font-bold text-white mb-2 group-hover:text-${statusData.rawColor} transition-colors line-clamp-2">${project.title || project.service || 'Custom Module Architecture'}</h4>
                        <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${project.description || 'Module execution parameters are currently being defined.'}</p>
                    </div>

                    <!-- Progress Component -->
                    <div class="mb-5 bg-black/30 p-3 rounded-xl border border-white/5">
                        <div class="flex justify-between items-end mb-2">
                            <span class="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1"><i class="fa-solid fa-terminal"></i> Execution</span>
                            <span class="text-xs font-bold text-white">${progress}%</span>
                        </div>
                        <div class="w-full bg-ma-dark rounded-full h-1.5 border border-white/5 overflow-hidden">
                            <div class="bg-${statusData.rawColor} h-1.5 rounded-full" style="width: ${progress}%"></div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-white/5">
                        <div class="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            <i class="fa-regular fa-calendar"></i> ${date}
                        </div>
                        <div class="text-sm font-bold text-white">
                            ${amount}
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    getStatusStyles(status) {
        if (status.includes('completed') || status.includes('delivered')) {
            return { label: 'Completed', style: 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20', rawColor: 'ma-emerald' };
        } else if (status.includes('active') || status.includes('progress')) {
            return { label: 'In Progress', style: 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20', rawColor: 'ma-indigo' };
        } else if (status.includes('cancelled') || status.includes('failed') || status.includes('terminated')) {
            return { label: 'Terminated', style: 'bg-rose-500/10 text-rose-500 border-rose-500/20', rawColor: 'rose-500' };
        }
        return { label: 'Pending Setup', style: 'bg-amber-400/10 text-amber-400 border-amber-400/20', rawColor: 'amber-400' };
    },

    setupListeners() {
        const searchInput = document.getElementById('project-search');
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
                const term = document.getElementById('project-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredProjects = this.allProjects.filter(p => {
            const titleMatch = (p.title && p.title.toLowerCase().includes(searchTerm)) || (p.service && p.service.toLowerCase().includes(searchTerm));
            const descMatch = (p.description && p.description.toLowerCase().includes(searchTerm));
            const matchesSearch = titleMatch || descMatch;
            
            const pStatus = (p.status || 'pending').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'active') matchesStatus = pStatus === 'active' || pStatus.includes('progress');
            else if (statusFilter === 'completed') matchesStatus = pStatus === 'completed' || pStatus === 'delivered';
            else if (statusFilter === 'pending') matchesStatus = pStatus === 'pending' || pStatus === 'draft';
            
            return matchesSearch && matchesStatus;
        });
        this.renderProjectsGrid(this.filteredProjects);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-diagram-project fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Compiling_Workspace_Data...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Workspace Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('projects')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Compilation</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.ProjectsToast = (msg, type = 'success') => {
            const container = document.getElementById('projects-toast-container');
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

        window.ProjectsCloseModal = () => {
            const container = document.getElementById('projects-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- REQUEST PROJECT MODAL (Client Side) ---
        // Creates a Support Ticket with high priority requesting a new project
        window.ProjectsOpenRequestModal = () => {
            const container = document.getElementById('projects-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-rocket text-ma-indigo"></i> Request System Expansion</h3>
                            <button onclick="window.ProjectsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.ProjectsSubmitRequest(event)" class="p-6 space-y-4">
                            
                            <div class="bg-ma-indigo/10 border border-ma-indigo/20 rounded-xl p-4 mb-4 flex gap-3 items-start">
                                <i class="fa-solid fa-circle-info text-ma-indigo mt-0.5"></i>
                                <p class="text-xs text-slate-300 leading-relaxed">This module will transmit a direct high-priority signal to the administrative team to provision a new project node in your workspace.</p>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Proposed Module Title</label>
                                <input type="text" id="req-proj-title" required placeholder="e.g., E-Commerce App Integration" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Architectural Scope & Objectives</label>
                                <textarea id="req-proj-desc" rows="5" required placeholder="Detail the requirements, features, and desired timeline for this expansion..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4">
                                <button type="button" onclick="window.ProjectsCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="req-btn" class="px-5 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Transmit Request <i class="fa-solid fa-paper-plane"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.ProjectsSubmitRequest = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('req-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';

            try {
                const user = auth.currentUser;
                const title = document.getElementById('req-proj-title').value;
                const desc = document.getElementById('req-proj-desc').value;

                // Send request as a high-priority support ticket to bypass Firestore write restrictions on orders
                const data = {
                    clientEmail: user.email,
                    userEmail: user.email,
                    subject: `NEW PROJECT REQUEST: ${title}`,
                    priority: 'high',
                    status: 'open',
                    message: `CLIENT REQUESTED A NEW PROJECT EXPANSION:\n\nTitle: ${title}\n\nScope:\n${desc}`,
                    adminNotes: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "tickets"), data);
                
                window.ProjectsCloseModal();
                window.ProjectsToast("Signal transmitted successfully. Architecture team notified.");
            } catch (err) {
                console.error(err);
                window.ProjectsToast("Transmission failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Transmit Request <i class="fa-solid fa-paper-plane"></i>';
            }
        };

        // --- INSPECT MODAL (Client View - Read Only) ---
        window.ProjectsInspectNode = (orderId) => {
            const item = Projects.allProjects.find(o => o.id === orderId);
            if(!item) return;

            const container = document.getElementById('projects-modal-container');
            const title = item.title || item.service || 'Custom Module';
            const progress = item.progress || 0;
            const status = (item.status || 'pending').toLowerCase();
            const statusData = Projects.getStatusStyles(status);
            const amount = Number(item.amount) ? `$${Number(item.amount).toLocaleString()}` : 'TBD';
            const dateStr = item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Legacy';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-layer-group text-${statusData.rawColor}"></i> Module Inspector</h3>
                            <button onclick="window.ProjectsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6 relative">
                            <!-- Background Glow -->
                            <div class="absolute -right-20 top-0 w-64 h-64 bg-${statusData.rawColor}/5 rounded-full blur-3xl pointer-events-none z-0"></div>
                            
                            <!-- Header / Title -->
                            <div class="relative z-10">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusData.style}">
                                        ${statusData.label}
                                    </span>
                                    <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">ID: ${item.id.substring(0,8)}</span>
                                </div>
                                <h2 class="text-2xl font-display font-bold text-white leading-tight mb-2">${title}</h2>
                                <p class="text-xs text-slate-400 flex items-center gap-1.5"><i class="fa-regular fa-calendar text-slate-500"></i> Initiated on ${dateStr}</p>
                            </div>

                            <!-- Progress Visualization -->
                            <div class="p-5 rounded-2xl bg-black/30 border border-white/5 relative z-10 shadow-inner">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-2">
                                        <i class="fa-solid fa-terminal text-slate-500 text-xs"></i>
                                        <span class="text-[10px] font-mono uppercase text-slate-400 tracking-widest">Execution Metric</span>
                                    </div>
                                    <span class="text-lg font-bold text-${statusData.rawColor}">${progress}%</span>
                                </div>
                                <div class="w-full bg-ma-dark rounded-full h-2 border border-white/5 overflow-hidden shadow-inner">
                                    <div class="bg-${statusData.rawColor} h-2 rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]" style="width: ${progress}%"></div>
                                </div>
                            </div>

                            <!-- Financials -->
                            <div class="p-4 rounded-xl bg-white/5 border border-white/5 relative z-10 flex justify-between items-center">
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Allocated Budget</p>
                                <p class="text-lg font-bold text-white">${amount}</p>
                            </div>

                            <!-- Scope / Architecture -->
                            <div class="relative z-10">
                                <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-code"></i> Defined Scope & Parameters</p>
                                <div class="bg-ma-slate border border-white/5 rounded-xl p-4">
                                    <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${item.description || 'Module execution parameters are currently being defined by the engineering team.'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Client Footer Actions -->
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.loadSection('chat'); window.ProjectsCloseModal();" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-comments"></i> Ping Admin
                            </button>
                            <button onclick="window.loadSection('support'); window.ProjectsCloseModal();" class="flex-1 py-3 rounded-xl bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white text-xs font-bold uppercase tracking-widest transition shadow-lg shadow-ma-indigo/20 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-bug"></i> Report Issue
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
    if (e.detail.section === 'projects') {
        Projects.init();
    }
});