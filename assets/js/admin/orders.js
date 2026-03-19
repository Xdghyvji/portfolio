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
 * Orders Component - Advanced Project & Pipeline Management
 */
const Orders = {
    allOrders: [],
    filteredOrders: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchOrders();
            this.filteredOrders = [...this.allOrders];

            container.innerHTML = this.renderUI();
            this.renderOrdersGrid(this.filteredOrders);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Orders Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchOrders() {
        const snap = await getDocs(collection(db, "orders"));
        this.allOrders = [];
        snap.forEach(doc => {
            this.allOrders.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allOrders.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allOrders.length;
        const active = this.allOrders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'active' || s.includes('progress');
        }).length;
        const completed = this.allOrders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'completed' || s === 'delivered';
        }).length;
        const pending = total - active - completed;

        return { total, active, completed, pending };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-terminal text-ma-indigo"></i> Active Projects
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Monitor project pipelines, deliverables, and execution progress.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.OrdersExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-emerald"></i> Export Pipeline
                        </button>
                        <button onclick="window.OrdersOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Provision Project
                        </button>
                        <button onclick="window.loadSection('orders')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Projects</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Execution</p>
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
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Pending Setup</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.pending}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-hourglass-half"></i></div>
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
                            <input type="text" id="order-search" placeholder="Search title or client..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <!-- Visual Grid -->
                    <div class="p-6 overflow-y-auto custom-scroll flex-1 bg-ma-dark/20">
                        <div id="orders-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <!-- Cards injected here -->
                        </div>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="orders-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="orders-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderOrdersGrid(orders) {
        const grid = document.getElementById('orders-grid');
        if (!grid) return;

        if (orders.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-ghost"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No projects found in the pipeline.</p>
                    <p class="text-xs text-slate-600 mt-1">Adjust filters or provision a new project.</p>
                </div>`;
            return;
        }

        grid.innerHTML = orders.map(order => {
            const status = (order.status || 'pending').toLowerCase();
            const statusData = this.getStatusStyles(status);
            const progress = order.progress || 0;
            const amount = Number(order.amount) ? `$${Number(order.amount).toLocaleString()}` : 'TBD';
            const date = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Legacy';

            return `
            <div class="glass-panel rounded-3xl border border-white/5 group hover:border-${statusData.rawColor}/30 transition-all flex flex-col overflow-hidden cursor-pointer h-full relative" onclick="window.OrdersInspectNode('${order.id}')">
                
                <!-- Progress Background Overlay -->
                <div class="absolute bottom-0 left-0 h-1 bg-white/5 w-full z-0">
                    <div class="h-full bg-${statusData.rawColor} transition-all duration-1000" style="width: ${progress}%"></div>
                </div>

                <div class="p-6 flex flex-col flex-1 relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:text-${statusData.rawColor} transition-all shadow-lg">
                                <i class="fa-solid fa-layer-group text-lg"></i>
                            </div>
                            <div>
                                <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${statusData.style}">
                                    ${statusData.label}
                                </span>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">ID: ${order.id.substring(0,6)}</p>
                            </div>
                        </div>
                        <button class="text-slate-500 hover:text-white transition"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                    </div>

                    <div class="flex-1">
                        <h4 class="text-lg font-display font-bold text-white mb-1 group-hover:text-${statusData.rawColor} transition-colors line-clamp-1">${order.title || order.service || 'Custom Module'}</h4>
                        <p class="text-xs text-slate-400 mb-4 flex items-center gap-1.5 truncate"><i class="fa-regular fa-envelope text-slate-500"></i> ${order.clientEmail || 'No Client Assigned'}</p>
                    </div>

                    <!-- Progress Bar Component -->
                    <div class="mb-5">
                        <div class="flex justify-between items-end mb-1.5">
                            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Execution</span>
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
        } else if (status.includes('cancelled') || status.includes('failed')) {
            return { label: 'Terminated', style: 'bg-rose-500/10 text-rose-500 border-rose-500/20', rawColor: 'rose-500' };
        }
        return { label: 'Pending Setup', style: 'bg-amber-400/10 text-amber-400 border-amber-400/20', rawColor: 'amber-400' };
    },

    setupListeners() {
        const searchInput = document.getElementById('order-search');
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
                const term = document.getElementById('order-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, statusFilter) {
        this.filteredOrders = this.allOrders.filter(o => {
            const titleMatch = (o.title && o.title.toLowerCase().includes(searchTerm)) || (o.service && o.service.toLowerCase().includes(searchTerm));
            const clientMatch = (o.clientEmail && o.clientEmail.toLowerCase().includes(searchTerm));
            const matchesSearch = titleMatch || clientMatch;
            
            const oStatus = (o.status || 'pending').toLowerCase();
            let matchesStatus = false;
            
            if (statusFilter === 'all') matchesStatus = true;
            else if (statusFilter === 'active') matchesStatus = oStatus === 'active' || oStatus.includes('progress');
            else if (statusFilter === 'completed') matchesStatus = oStatus === 'completed' || oStatus === 'delivered';
            else if (statusFilter === 'pending') matchesStatus = oStatus === 'pending' || oStatus === 'draft';
            
            return matchesSearch && matchesStatus;
        });
        this.renderOrdersGrid(this.filteredOrders);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-terminal fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Compiling_Pipeline_Data...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Pipeline Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('orders')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Compilation</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.OrdersToast = (msg, type = 'success') => {
            const container = document.getElementById('orders-toast-container');
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

        window.OrdersExportData = () => {
            if(Orders.filteredOrders.length === 0) return window.OrdersToast("No data to export", "error");
            
            let csv = "ID,Title/Service,ClientEmail,Amount,Status,Progress,Date\n";
            Orders.filteredOrders.forEach(o => {
                let dateStr = '';
                if(o.createdAt) dateStr = o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000).toISOString() : o.createdAt;
                
                const safeTitle = (o.title || o.service || '').replace(/"/g, '""');
                
                csv += `"${o.id}","${safeTitle}","${o.clientEmail || ''}","${o.amount || 0}","${o.status||'pending'}","${o.progress||0}","${dateStr}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Pipeline_Export_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.OrdersToast("Pipeline data exported successfully.");
        };

        window.OrdersCloseModal = () => {
            const container = document.getElementById('orders-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.OrdersOpenProvisionModal = () => {
            const container = document.getElementById('orders-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-folder-plus text-ma-indigo"></i> Provision New Project</h3>
                            <button onclick="window.OrdersCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.OrdersSubmitProvision(event)" class="p-6 overflow-y-auto custom-scroll space-y-5">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Project Title</label>
                                    <input type="text" id="prov-ord-title" required placeholder="e.g., Custom Shopify Theme Build" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>
                                
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Client Email</label>
                                    <input type="email" id="prov-ord-email" required placeholder="client@domain.com" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Budget / Amount ($)</label>
                                    <input type="number" id="prov-ord-amount" required placeholder="1500" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>

                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Execution Status</label>
                                    <select id="prov-ord-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="pending">Pending Setup</option>
                                        <option value="active">Active (In Progress)</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Progress (%)</label>
                                    <input type="number" id="prov-ord-progress" min="0" max="100" value="0" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>

                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Detailed Scope / Notes</label>
                                    <textarea id="prov-ord-desc" rows="4" placeholder="Define the scope, deliverables, and timeline..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition resize-none"></textarea>
                                </div>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4 shrink-0">
                                <button type="button" onclick="window.OrdersCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Initialize Project <i class="fa-solid fa-check"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.OrdersSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling...';

            try {
                const data = {
                    title: document.getElementById('prov-ord-title').value,
                    clientEmail: document.getElementById('prov-ord-email').value,
                    amount: Number(document.getElementById('prov-ord-amount').value),
                    status: document.getElementById('prov-ord-status').value,
                    progress: Number(document.getElementById('prov-ord-progress').value) || 0,
                    description: document.getElementById('prov-ord-desc').value,
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "orders"), data);
                window.OrdersCloseModal();
                window.OrdersToast("Project securely injected into pipeline.");
                Orders.init(); // Reload to refresh grid and stats
            } catch (err) {
                console.error(err);
                window.OrdersToast("Compilation failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initialize Project <i class="fa-solid fa-check"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.OrdersInspectNode = (orderId) => {
            const item = Orders.allOrders.find(o => o.id === orderId);
            if(!item) return;

            const container = document.getElementById('orders-modal-container');
            const title = item.title || item.service || 'Custom Module';
            const progress = item.progress || 0;

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-microscope text-ma-indigo"></i> Project Inspector</h3>
                            <button onclick="window.OrdersCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Header / Title -->
                            <div>
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">ID: ${item.id}</span>
                                </div>
                                <div class="flex items-center bg-ma-slate border border-white/5 rounded-xl px-3 py-2">
                                    <input type="text" id="edit-ord-title-${item.id}" value="${title}" class="bg-transparent w-full text-white font-display font-bold text-lg focus:outline-none" placeholder="Project Title">
                                    <button onclick="window.OrdersUpdateField('${item.id}', 'title', document.getElementById('edit-ord-title-${item.id}').value)" class="text-ma-indigo hover:text-white transition"><i class="fa-solid fa-save text-sm"></i></button>
                                </div>
                                <p class="text-xs text-slate-400 mt-2 flex items-center gap-1.5 ml-1"><i class="fa-regular fa-envelope"></i> ${item.clientEmail || 'Unassigned Client'}</p>
                            </div>

                            <!-- Progress Slider -->
                            <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                                <div class="flex justify-between items-center mb-3">
                                    <label class="text-[10px] font-mono uppercase text-slate-500 tracking-widest">Execution Progress</label>
                                    <span class="text-sm font-bold text-white" id="progress-val-display">${progress}%</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <input type="range" id="edit-ord-progress-${item.id}" min="0" max="100" value="${progress}" class="w-full h-2 bg-ma-dark rounded-lg appearance-none cursor-pointer accent-ma-indigo" oninput="document.getElementById('progress-val-display').innerText = this.value + '%'">
                                    <button onclick="window.OrdersUpdateField('${item.id}', 'progress', Number(document.getElementById('edit-ord-progress-${item.id}').value))" class="w-8 h-8 rounded-lg bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white transition flex items-center justify-center shrink-0"><i class="fa-solid fa-save"></i></button>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                    <select onchange="window.OrdersUpdateField('${item.id}', 'status', this.value)" class="bg-transparent w-full text-white text-xs font-bold focus:outline-none cursor-pointer">
                                        <option value="pending" class="bg-ma-dark" ${item.status === 'pending' ? 'selected' : ''}>Pending Setup</option>
                                        <option value="active" class="bg-ma-dark" ${item.status === 'active' || item.status === 'in progress' ? 'selected' : ''}>Active (Progress)</option>
                                        <option value="completed" class="bg-ma-dark" ${item.status === 'completed' || item.status === 'delivered' ? 'selected' : ''}>Completed</option>
                                        <option value="cancelled" class="bg-ma-dark" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5 relative group">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Budget ($)</p>
                                    <div class="flex items-center">
                                        <input type="number" id="edit-ord-amount-${item.id}" value="${item.amount || 0}" class="bg-transparent w-full text-white text-sm font-bold focus:outline-none">
                                        <button onclick="window.OrdersUpdateField('${item.id}', 'amount', Number(document.getElementById('edit-ord-amount-${item.id}').value))" class="text-ma-indigo hover:text-white transition"><i class="fa-solid fa-check text-[10px]"></i></button>
                                    </div>
                                </div>
                            </div>

                            <!-- Internal Scope/Notes -->
                            <div>
                                <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Scope & Internal Notes</p>
                                <div class="bg-ma-slate border border-white/5 rounded-xl p-1">
                                    <textarea id="edit-ord-desc-${item.id}" rows="5" class="w-full bg-transparent text-sm text-slate-300 p-3 focus:outline-none resize-none leading-relaxed">${item.description || ''}</textarea>
                                    <div class="flex justify-end p-2 border-t border-white/5">
                                        <button onclick="window.OrdersUpdateField('${item.id}', 'description', document.getElementById('edit-ord-desc-${item.id}').value)" class="px-3 py-1.5 bg-ma-indigo/10 text-ma-indigo hover:bg-ma-indigo hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Commit Log</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0">
                            <button onclick="window.OrdersDeleteNode('${item.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-skull group-hover:animate-bounce"></i> Terminate Project
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
                </style>
            `;
        };

        window.OrdersUpdateField = async (orderId, field, value) => {
            try {
                await updateDoc(doc(db, "orders", orderId), { [field]: value, updatedAt: serverTimestamp() });
                window.OrdersToast(`Project updated: '${field}' synchronized.`);
                
                // Update local array quietly
                const item = Orders.allOrders.find(o => o.id === orderId);
                if(item) item[field] = value;
                
                // Re-render UI seamlessly
                Orders.applyFilters(document.getElementById('order-search')?.value.toLowerCase() || '', Orders.currentFilter);
                
                // If updating status, ensure stats at the top update correctly
                if(field === 'status') {
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Orders.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('orders-modal-container').innerHTML !== '') {
                            window.OrdersInspectNode(orderId); // Re-open
                        }
                    });
                }
            } catch (e) {
                console.error(e);
                window.OrdersToast("Pipeline sync failed.", "error");
            }
        };

        // --- DELETE MODAL ---
        window.OrdersDeleteNode = (orderId) => {
            const item = Orders.allOrders.find(o => o.id === orderId);
            if(!item) return;

            const container = document.getElementById('orders-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire-flame-curved"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Discard Project</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate <span class="text-white font-bold">${item.title || item.service || 'this project'}</span> from the pipeline. This cannot be reversed.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "TERMINATE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.OrdersInspectNode('${orderId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.OrdersExecuteDelete('${orderId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.OrdersExecuteDelete = async (orderId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'TERMINATE') {
                return window.OrdersToast("Confirmation failed. Type TERMINATE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "orders", orderId));
                window.OrdersCloseModal();
                window.OrdersToast("Project eradicated from pipeline.");
                Orders.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.OrdersToast("Eradication failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'orders') {
        Orders.init();
    }
});