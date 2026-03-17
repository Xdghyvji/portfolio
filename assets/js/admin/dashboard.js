import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Dashboard Component
 * Handles the rendering and data logic for the primary admin overview
 */
const Dashboard = {
    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        // Show Loading State inside the content area
        container.innerHTML = this.renderLoading();

        try {
            // Fetch necessary data for stats
            const [ordersSnap, leadsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, "orders")),
                getDocs(collection(db, "leads")),
                getDocs(collection(db, "users"))
            ]);

            let totalRevenue = 0;
            let activeProjects = 0;

            ordersSnap.forEach(doc => {
                const data = doc.data();
                if (data.status === 'completed') totalRevenue += (Number(data.amount) || 0);
                if (data.status === 'active' || data.status === 'in-progress') activeProjects++;
            });

            // Render the full dashboard UI
            container.innerHTML = this.renderUI({
                revenue: totalRevenue,
                projects: activeProjects,
                leads: leadsSnap.size,
                clients: usersSnap.size
            });

            // Populate tables or charts if needed
            this.loadRecentActivity();

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI(stats) {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this.renderStatCard("Total Revenue", `$${stats.revenue.toLocaleString()}`, "fa-wallet", "text-ma-emerald", "bg-ma-emerald/10")}
                    ${this.renderStatCard("Active Projects", stats.projects, "fa-diagram-project", "text-ma-indigo", "bg-ma-indigo/10")}
                    ${this.renderStatCard("Inbound Leads", stats.leads, "fa-bolt", "text-amber-400", "bg-amber-400/10")}
                    ${this.renderStatCard("Total Clients", stats.clients, "fa-users", "text-ma-cyan", "bg-ma-cyan/10")}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Growth Chart Placeholder -->
                    <div class="lg:col-span-2 glass-panel rounded-3xl p-8 min-h-[350px] flex flex-col">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm">Revenue Trajectory</h3>
                            <select class="bg-white/5 border border-white/10 text-xs rounded-lg px-3 py-1 text-slate-400 focus:outline-none">
                                <option>Last 30 Days</option>
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                        <div class="flex-1 flex items-center justify-center border-t border-white/5 mt-auto">
                            <p class="text-slate-600 font-mono text-[10px] uppercase tracking-[0.2em]">Visualizer_Node_Standby</p>
                        </div>
                    </div>

                    <!-- Recent Actions Panel -->
                    <div class="glass-panel rounded-3xl p-8 flex flex-col">
                        <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm mb-6">Live Logs</h3>
                        <div id="recent-activity-list" class="space-y-6">
                            <div class="flex gap-4 items-start opacity-50">
                                <div class="w-2 h-2 rounded-full bg-ma-indigo mt-1.5 animate-pulse"></div>
                                <div>
                                    <p class="text-xs text-slate-300 font-medium">Fetching terminal data...</p>
                                    <p class="text-[10px] text-slate-600 font-mono mt-1">WAITING_FOR_STREAM</p>
                                </div>
                            </div>
                        </div>
                        <button class="w-full mt-auto py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                            View Security Audit
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatCard(title, value, icon, iconColor, bgColor) {
        return `
            <div class="glass-panel p-6 rounded-3xl group hover:border-ma-indigo/50 transition-all duration-300">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">${title}</p>
                        <h4 class="text-2xl font-display font-bold text-white">${value}</h4>
                    </div>
                    <div class="w-10 h-10 rounded-2xl ${bgColor} ${iconColor} flex items-center justify-center text-lg border border-white/5">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-center gap-2">
                    <span class="text-[10px] font-bold text-ma-emerald">+12.5%</span>
                    <div class="h-[1px] flex-1 bg-white/5"></div>
                </div>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-spinner fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-widest">Syncing_Realtime_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-bold text-lg mb-2">Sync Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('dashboard')" class="px-6 py-2 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
            </div>
        `;
    },

    async loadRecentActivity() {
        const listContainer = document.getElementById('recent-activity-list');
        if (!listContainer) return;

        try {
            // Fetch last 5 leads as "Recent Activity"
            const q = query(collection(db, "leads"), limit(5));
            const snap = await getDocs(q);
            
            if (snap.empty) {
                listContainer.innerHTML = '<p class="text-xs text-slate-600 italic">No recent system events.</p>';
                return;
            }

            listContainer.innerHTML = '';
            snap.forEach(doc => {
                const data = doc.data();
                const item = `
                    <div class="flex gap-4 items-start group">
                        <div class="w-2 h-2 rounded-full bg-ma-emerald mt-1.5 group-hover:scale-125 transition-transform"></div>
                        <div class="flex-1 overflow-hidden">
                            <p class="text-xs text-slate-300 font-medium truncate">${data.name || 'New Lead'} expressed interest</p>
                            <p class="text-[10px] text-slate-500 font-mono mt-0.5">${data.goal || 'General Inquiry'}</p>
                        </div>
                        <span class="text-[9px] font-mono text-slate-700 whitespace-nowrap">JUST_NOW</span>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', item);
            });
        } catch (e) {
            listContainer.innerHTML = '<p class="text-xs text-rose-500/50">Stream failed.</p>';
        }
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'dashboard') {
        Dashboard.init();
    }
});