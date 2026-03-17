import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Users Component
 * Handles client base management and role assignments
 */
const Users = {
    allUsers: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "users"));
            this.allUsers = [];
            snap.forEach(doc => {
                this.allUsers.push({ id: doc.id, ...doc.data() });
            });

            // Sort by creation date (newest first)
            this.allUsers.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderUserTable(this.allUsers);
            this.setupListeners();

        } catch (error) {
            console.error("Users Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Client Base</h2>
                        <p class="text-sm text-slate-500">Manage access levels and monitor registered portfolio accounts.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="user-search" placeholder="Search by email..." class="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-ma-indigo/50 transition-all w-64">
                        </div>
                        <button onclick="window.loadSection('users')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Identity / Email</th>
                                    <th class="px-6 py-4 font-medium">Privileges</th>
                                    <th class="px-6 py-4 font-medium">Status</th>
                                    <th class="px-6 py-4 font-medium">Linked_On</th>
                                    <th class="px-6 py-4 font-medium text-right">Direct_Ops</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body" class="divide-y divide-white/5">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderUserTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-600 italic">No users matching current criteria.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-ma-indigo/20 to-ma-indigo/5 flex items-center justify-center text-ma-indigo border border-ma-indigo/20 group-hover:scale-110 transition-transform">
                            <i class="fa-solid ${user.role === 'admin' ? 'fa-user-shield' : 'fa-user'}"></i>
                        </div>
                        <div class="overflow-hidden max-w-[200px]">
                            <p class="text-sm font-bold text-white truncate">${user.displayName || 'Unnamed Node'}</p>
                            <p class="text-[10px] font-mono text-slate-500 truncate lowercase">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${user.role === 'admin' ? 'bg-ma-indigo/10 text-ma-indigo border border-ma-indigo/20' : 'bg-white/5 text-slate-400 border border-white/5'}">
                        ${user.role || 'Client'}
                    </span>
                </td>
                <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                        <span class="w-1.5 h-1.5 rounded-full ${user.isVerified ? 'bg-ma-emerald shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-700'}"></span>
                        <span class="text-[10px] font-mono ${user.isVerified ? 'text-ma-emerald' : 'text-slate-600'} uppercase">
                            ${user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                        ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'LEGACY_NODE'}
                    </p>
                </td>
                <td class="px-6 py-5 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-cyan hover:border-ma-cyan/50 transition-all" title="Edit Permissions">
                            <i class="fa-solid fa-user-pen text-xs"></i>
                        </button>
                        <button class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all" title="Terminate Node">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    setupListeners() {
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.allUsers.filter(u => 
                    u.email.toLowerCase().includes(term) || 
                    (u.displayName && u.displayName.toLowerCase().includes(term))
                );
                this.renderUserTable(filtered);
            });
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-circle-nodes fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Scanning_User_Database...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-shield-virus"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Access Interrupted</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('users')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-ma-indigo/20">Restart Scanner</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'users') {
        Users.init();
    }
});