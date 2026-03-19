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
 * Users Component - Advanced Node Management
 */
const Users = {
    allUsers: [],
    filteredUsers: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchUsers();
            this.filteredUsers = [...this.allUsers];

            container.innerHTML = this.renderUI();
            this.renderUserTable(this.filteredUsers);
            this.setupListeners();

            // Setup global handlers for inline HTML onclicks
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Users Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchUsers() {
        const snap = await getDocs(collection(db, "users"));
        this.allUsers = [];
        snap.forEach(doc => {
            this.allUsers.push({ id: doc.id, ...doc.data() });
        });
        // Sort by creation date (newest first)
        this.allUsers.sort((a, b) => {
            const timeA = a.createdAt?.seconds || (new Date(a.createdAt).getTime()/1000) || 0;
            const timeB = b.createdAt?.seconds || (new Date(b.createdAt).getTime()/1000) || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allUsers.length;
        const verified = this.allUsers.filter(u => u.isVerified || u.onboardingCompleted).length;
        const admins = this.allUsers.filter(u => u.role === 'admin').length;
        const pending = total - verified;
        return { total, verified, admins, pending };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-network-wired text-ma-indigo"></i> Node Registry
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Manage access hierarchies, security clearances, and client portfolios.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.UsersExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-download text-ma-emerald"></i> Export
                        </button>
                        <button onclick="window.UsersOpenProvisionModal()" class="px-4 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-indigo/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Provision Node
                        </button>
                        <button onclick="window.loadSection('users')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-indigo transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Entities</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-users"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Verified Nodes</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.verified}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-shield-check"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Admin Clearances</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.admins}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-user-shield"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Pending Setup</p>
                            <h4 class="text-2xl font-display font-bold text-rose-400">${stats.pending}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-400/10 text-rose-400 flex items-center justify-center border border-rose-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-user-clock"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-indigo text-white shadow-lg transition">All</button>
                            <button data-filter="client" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Clients</button>
                            <button data-filter="admin" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition">Admins</button>
                        </div>
                        
                        <div class="relative w-full md:w-64">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="user-search" placeholder="Search identities..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Node Identity</th>
                                    <th class="px-6 py-4 font-medium">Clearance</th>
                                    <th class="px-6 py-4 font-medium">Integrity</th>
                                    <th class="px-6 py-4 font-medium">Sector</th>
                                    <th class="px-6 py-4 font-medium">Initiated</th>
                                    <th class="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="users-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="users-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderUserTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-ghost"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No matching records found.</p>
                        <p class="text-xs text-slate-600 mt-1">Try adjusting your filters or search query.</p>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const role = (user.role || 'client').toLowerCase();
            const isAdmin = role === 'admin';
            const isVerified = user.isVerified || user.onboardingCompleted;
            const date = user.createdAt ? (user.createdAt.seconds ? new Date(user.createdAt.seconds*1000).toLocaleDateString() : new Date(user.createdAt).toLocaleDateString()) : 'Legacy';
            
            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.UsersInspectNode('${user.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl ${isAdmin ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/20'} flex items-center justify-center border group-hover:scale-110 transition-transform shrink-0">
                            <i class="fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-sm font-bold text-white truncate group-hover:text-ma-indigo transition">${user.displayName || 'Unnamed Entity'}</p>
                            <p class="text-[10px] font-mono text-slate-500 truncate lowercase">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-widest ${isAdmin ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' : 'bg-white/5 text-slate-400 border-white/10'}">
                        ${role}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <span class="relative flex h-2 w-2">
                            ${isVerified ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-ma-emerald opacity-50"></span>' : ''}
                            <span class="relative inline-flex rounded-full h-2 w-2 ${isVerified ? 'bg-ma-emerald' : 'bg-slate-600'}"></span>
                        </span>
                        <span class="text-[10px] font-mono ${isVerified ? 'text-ma-emerald' : 'text-slate-500'} uppercase">
                            ${isVerified ? 'Secure' : 'Unverified'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-xs text-slate-400 truncate max-w-[120px]">${user.interest || 'Unknown Sector'}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${date}
                    </p>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2" onclick="event.stopPropagation()">
                        <button onclick="window.UsersInspectNode('${user.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-indigo hover:border-ma-indigo/50 transition-all" title="Inspect Node">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button onclick="window.UsersDeleteNode('${user.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all" title="Terminate">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('user-search');
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
                const term = document.getElementById('user-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, roleFilter) {
        this.filteredUsers = this.allUsers.filter(u => {
            const matchesSearch = u.email.toLowerCase().includes(searchTerm) || (u.displayName && u.displayName.toLowerCase().includes(searchTerm));
            const uRole = (u.role || 'client').toLowerCase();
            const matchesRole = roleFilter === 'all' || uRole === roleFilter;
            return matchesSearch && matchesRole;
        });
        this.renderUserTable(this.filteredUsers);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-circle-nodes fa-spin text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning_Node_Registry...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-shield-virus"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Access Interrupted</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('users')" class="px-8 py-3 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Restart Scanner</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.UsersToast = (msg, type = 'success') => {
            const container = document.getElementById('users-toast-container');
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

        window.UsersExportData = () => {
            if(Users.filteredUsers.length === 0) return window.UsersToast("No data to export", "error");
            
            let csv = "ID,Name,Email,Role,Verified,Phone,Source,Created\n";
            Users.filteredUsers.forEach(u => {
                const date = u.createdAt ? (u.createdAt.seconds ? new Date(u.createdAt.seconds*1000).toISOString() : u.createdAt) : '';
                csv += `"${u.id}","${u.displayName || ''}","${u.email}","${u.role||'client'}","${u.isVerified||u.onboardingCompleted||false}","${u.phone||''}","${u.source||''}","${date}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Nodes_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.UsersToast("Registry exported successfully.");
        };

        window.UsersCloseModal = () => {
            const container = document.getElementById('users-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.UsersOpenProvisionModal = () => {
            const container = document.getElementById('users-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-satellite text-ma-indigo"></i> Provision New Node</h3>
                            <button onclick="window.UsersCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.UsersSubmitProvision(event)" class="p-6 space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="col-span-2 md:col-span-1">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Display Name</label>
                                    <input type="text" id="prov-name" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                </div>
                                <div class="col-span-2 md:col-span-1">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Clearance Role</label>
                                    <select id="prov-role" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition cursor-pointer">
                                        <option value="client">Client (Standard)</option>
                                        <option value="admin">Admin (Elevated)</option>
                                    </select>
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Email Address</label>
                                    <input type="email" id="prov-email" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                                    <p class="text-[10px] text-slate-500 mt-1">User must authenticate via this email to link to this profile.</p>
                                </div>
                            </div>
                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-4">
                                <button type="button" onclick="window.UsersCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="prov-btn" class="px-5 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">Create Record <i class="fa-solid fa-check"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.UsersSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prov-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            try {
                const data = {
                    displayName: document.getElementById('prov-name').value,
                    email: document.getElementById('prov-email').value,
                    role: document.getElementById('prov-role').value,
                    isVerified: false,
                    onboardingCompleted: true, // Bypass client onboarding
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "users"), data);
                window.UsersCloseModal();
                window.UsersToast("Node provisioned successfully.");
                Users.init(); // Reload
            } catch (err) {
                console.error(err);
                window.UsersToast("Provisioning failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Create Record';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.UsersInspectNode = (userId) => {
            const user = Users.allUsers.find(u => u.id === userId);
            if(!user) return;

            const container = document.getElementById('users-modal-container');
            const isAdmin = user.role === 'admin';
            const isVerified = user.isVerified || user.onboardingCompleted;

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2">Node Inspector</h3>
                            <button onclick="window.UsersCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="p-6 flex-1 overflow-y-auto custom-scroll space-y-6">
                            
                            <!-- Profile Hero -->
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-2xl ${isAdmin ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' : 'bg-ma-indigo/10 text-ma-indigo border-ma-indigo/30'} flex items-center justify-center text-2xl border shrink-0">
                                    <i class="fa-solid ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i>
                                </div>
                                <div>
                                    <h4 class="text-xl font-bold text-white leading-tight">${user.displayName || 'Unnamed Node'}</h4>
                                    <p class="text-xs text-slate-400 mt-1"><i class="fa-regular fa-envelope"></i> ${user.email}</p>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Clearance</p>
                                    <select onchange="window.UsersUpdateField('${user.id}', 'role', this.value)" class="bg-transparent text-white text-sm font-bold w-full focus:outline-none cursor-pointer">
                                        <option value="client" class="bg-ma-dark" ${!isAdmin ? 'selected' : ''}>Client</option>
                                        <option value="admin" class="bg-ma-dark" ${isAdmin ? 'selected' : ''}>Admin</option>
                                    </select>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                    <select onchange="window.UsersUpdateField('${user.id}', 'isVerified', this.value === 'true')" class="bg-transparent text-white text-sm font-bold w-full focus:outline-none cursor-pointer ${isVerified ? 'text-ma-emerald' : 'text-slate-400'}">
                                        <option value="true" class="bg-ma-dark text-white" ${isVerified ? 'selected' : ''}>Verified</option>
                                        <option value="false" class="bg-ma-dark text-white" ${!isVerified ? 'selected' : ''}>Pending</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Details -->
                            <div class="space-y-4">
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2">Telemetry Data</h5>
                                
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1">Phone</label>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <input type="text" id="edit-phone-${user.id}" value="${user.phone || ''}" class="bg-transparent w-full text-white text-sm focus:outline-none" placeholder="No phone registered">
                                        <button onclick="window.UsersUpdateField('${user.id}', 'phone', document.getElementById('edit-phone-${user.id}').value)" class="text-ma-indigo hover:text-white text-xs font-bold transition"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Interest / Sector</p>
                                    <p class="text-sm text-white bg-white/[0.02] p-2 rounded-lg border border-white/5">${user.interest || 'N/A'}</p>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Acquisition Source</p>
                                    <p class="text-sm text-white bg-white/[0.02] p-2 rounded-lg border border-white/5">${user.source || 'Direct'}</p>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Internal UID</p>
                                    <p class="text-xs font-mono text-slate-400 bg-black/30 p-2 rounded-lg">${user.id}</p>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0">
                            <button onclick="window.UsersDeleteNode('${user.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-skull group-hover:animate-bounce"></i> Terminate Node
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.UsersUpdateField = async (userId, field, value) => {
            try {
                await updateDoc(doc(db, "users", userId), { [field]: value });
                window.UsersToast(`Node ${field} updated.`);
                // Update local array quietly to avoid full re-render jump
                const user = Users.allUsers.find(u => u.id === userId);
                if(user) user[field] = value;
                if (field === 'role' || field === 'isVerified') Users.renderUserTable(Users.filteredUsers);
            } catch (e) {
                console.error(e);
                window.UsersToast("Update failed: " + e.message, "error");
            }
        };

        // --- DELETE MODAL ---
        window.UsersDeleteNode = (userId) => {
            const user = Users.allUsers.find(u => u.id === userId);
            if(!user) return;

            const container = document.getElementById('users-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Critical Action</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently eradicate <span class="text-white font-bold">${user.email}</span> from the database. This destroys all auth linkages.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "TERMINATE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.UsersCloseModal()" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.UsersExecuteDelete('${userId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.UsersExecuteDelete = async (userId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'TERMINATE') {
                return window.UsersToast("Confirmation failed. Type TERMINATE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "users", userId));
                window.UsersCloseModal();
                window.UsersToast("Node eradicated from registry.");
                Users.init(); // Refresh entire list to update stats
            } catch (e) {
                console.error(e);
                window.UsersToast("Eradication failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'users') {
        Users.init();
    }
});