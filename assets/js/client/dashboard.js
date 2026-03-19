import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// Helper: Dynamically load Chart.js to keep index.html clean
function loadChartJS() {
    return new Promise((resolve) => {
        if (window.Chart) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

// Listen for navigation events from the main layout
window.addEventListener('client-section-load', (e) => {
    if (e.detail.section === 'dashboard') {
        renderDashboard();
    }
});

async function renderDashboard() {
    const contentArea = document.getElementById('client-content');
    
    // Loading State
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px]">
            <div class="text-center">
                <div class="relative w-16 h-16 mx-auto mb-6">
                    <div class="absolute inset-0 border-t-2 border-ma-indigo rounded-full animate-spin"></div>
                    <div class="absolute inset-2 border-b-2 border-ma-emerald rounded-full animate-spin" style="animation-direction: reverse;"></div>
                    <i class="fa-solid fa-satellite-dish absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-xl"></i>
                </div>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Telemetry Data...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // 1. Fetch Client Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const clientName = userData.displayName ? userData.displayName.split(' ')[0] : 'Client';
        const clientInterest = userData.interest || 'Ecosystem';

        // 2. Fetch Live Client Stats (Orders, Invoices, Tickets)
        let activeProjectsCount = 0;
        let completedProjectsCount = 0;
        let pendingProjectsCount = 0;
        let pendingInvoicesTotal = 0;
        let openTicketsCount = 0;
        const recentProjects = [];

        // Fetch Orders (Projects)
        const ordersSnap = await getDocs(query(collection(db, "orders"), where("clientEmail", "==", user.email)));
        ordersSnap.forEach(doc => {
            const data = doc.data();
            const status = (data.status || 'pending').toLowerCase();
            
            recentProjects.push({ id: doc.id, ...data });

            if (status === 'completed' || status === 'delivered') {
                completedProjectsCount++;
            } else if (status === 'active' || status.includes('progress')) {
                activeProjectsCount++;
            } else {
                pendingProjectsCount++;
            }
        });

        // Fetch Invoices
        const invoicesSnap = await getDocs(query(collection(db, "invoices"), where("clientEmail", "==", user.email)));
        invoicesSnap.forEach(doc => {
            const data = doc.data();
            const status = (data.status || 'draft').toLowerCase();
            // Count pending, sent, or overdue invoices
            if (status !== 'paid' && status !== 'draft') {
                pendingInvoicesTotal += (Number(data.total) || 0);
            }
        });

        // Fetch Support Tickets
        const ticketsSnap = await getDocs(query(collection(db, "tickets"), where("clientEmail", "==", user.email)));
        ticketsSnap.forEach(doc => {
            const data = doc.data();
            const status = (data.status || 'open').toLowerCase();
            if (status !== 'resolved' && status !== 'closed') {
                openTicketsCount++;
            }
        });

        // Sort projects by newest for the feed
        recentProjects.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        // 3. Generate tailored welcome message based on Onboarding selection
        let focusText = "digital architecture";
        let focusIcon = "fa-layer-group";
        if(clientInterest === 'Development') { focusText = "custom architecture & web development"; focusIcon = "fa-code"; }
        if(clientInterest === 'Growth') { focusText = "digital growth & traffic scaling"; focusIcon = "fa-chart-line"; }
        if(clientInterest === 'Automation') { focusText = "AI pipelines & workflow automation"; focusIcon = "fa-robot"; }

        // 4. Render Primary UI
        contentArea.innerHTML = `
            <div class="max-w-6xl mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
                
                <!-- Welcome Banner -->
                <div class="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-ma-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 class="text-2xl md:text-3xl font-display font-bold text-white mb-2">Welcome back, ${clientName}</h2>
                            <p class="text-slate-400 text-sm max-w-lg">Your command center is active. Operational resources are currently focused on <span class="text-ma-emerald font-semibold">${focusText}</span>.</p>
                        </div>
                        <div class="shrink-0 flex gap-3">
                            <button onclick="window.loadSection('projects')" class="px-6 py-2.5 bg-ma-emerald hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">
                                View Projects <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Stat 1: Active Projects -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-ma-indigo/50 hover:bg-white/[0.03] transition duration-300 group cursor-pointer relative overflow-hidden" onclick="window.loadSection('projects')">
                        <div class="absolute -right-6 -top-6 w-24 h-24 bg-ma-indigo/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <div class="w-10 h-10 rounded-xl bg-ma-indigo/20 flex items-center justify-center text-ma-indigo group-hover:bg-ma-indigo group-hover:text-white transition shadow-lg shadow-ma-indigo/10">
                                <i class="fa-solid fa-diagram-project"></i>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1 relative z-10">${activeProjectsCount}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest relative z-10">Active Modules</p>
                    </div>

                    <!-- Stat 2: Billing -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-ma-emerald/50 hover:bg-white/[0.03] transition duration-300 group cursor-pointer relative overflow-hidden" onclick="window.loadSection('billing')">
                        <div class="absolute -right-6 -top-6 w-24 h-24 bg-ma-emerald/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <div class="w-10 h-10 rounded-xl bg-ma-emerald/20 flex items-center justify-center text-ma-emerald group-hover:bg-ma-emerald group-hover:text-white transition shadow-lg shadow-ma-emerald/10">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Due</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1 relative z-10">$${pendingInvoicesTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest relative z-10">Pending Invoices</p>
                    </div>

                    <!-- Stat 3: Support -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-rose-500/50 hover:bg-white/[0.03] transition duration-300 group cursor-pointer relative overflow-hidden" onclick="window.loadSection('support')">
                        <div class="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div class="flex justify-between items-start mb-4 relative z-10">
                            <div class="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition shadow-lg shadow-rose-500/10">
                                <i class="fa-solid fa-headset"></i>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Open</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1 relative z-10">${openTicketsCount}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest relative z-10">Support Tickets</p>
                    </div>
                </div>

                <!-- Main Dashboard Content Split -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Live Project Feed (Takes up 2/3) -->
                    <div class="lg:col-span-2 glass-panel rounded-3xl border border-white/5 p-6 md:p-8 flex flex-col h-[400px]">
                        <div class="flex items-center justify-between mb-6 shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-layer-group text-ma-indigo"></i> Project Uplink</h3>
                            <button onclick="window.loadSection('projects')" class="text-xs text-ma-emerald hover:text-emerald-400 font-bold uppercase tracking-widest transition">View All <i class="fa-solid fa-arrow-right ml-1"></i></button>
                        </div>
                        
                        <div id="recent-projects-feed" class="flex-1 overflow-y-auto custom-scroll pr-2 space-y-4">
                            <!-- Project Nodes injected here -->
                        </div>
                    </div>

                    <!-- Side Panel: Chart & Actions (Takes up 1/3) -->
                    <div class="flex flex-col gap-6 h-[400px]">
                        
                        <!-- Project Health Chart -->
                        <div class="glass-panel rounded-3xl border border-white/5 p-6 relative overflow-hidden flex-1 flex flex-col">
                            <h3 class="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 shrink-0">Module Health</h3>
                            <div class="flex-1 relative w-full h-full min-h-[120px] flex items-center justify-center">
                                ${recentProjects.length > 0 ? '<canvas id="clientProjectChart"></canvas>' : '<i class="fa-solid fa-chart-pie text-4xl text-slate-700 opacity-50"></i>'}
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="glass-panel rounded-3xl border border-white/5 p-4 flex flex-col shrink-0">
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="window.loadSection('support')" class="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition group text-center">
                                    <div class="text-ma-indigo group-hover:scale-110 transition-transform"><i class="fa-solid fa-life-ring"></i></div>
                                    <p class="text-[9px] font-bold text-white uppercase tracking-widest">Get Help</p>
                                </button>
                                <button onclick="window.loadSection('chat')" class="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition group text-center">
                                    <div class="text-ma-emerald group-hover:scale-110 transition-transform"><i class="fa-solid fa-comment-dots"></i></div>
                                    <p class="text-[9px] font-bold text-white uppercase tracking-widest">Direct Chat</p>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        // 5. Populate Live Project Feed
        const feedContainer = document.getElementById('recent-projects-feed');
        if (recentProjects.length === 0) {
            feedContainer.innerHTML = `
                <div class="border border-dashed border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center h-full">
                    <div class="w-12 h-12 rounded-full bg-ma-slate flex items-center justify-center text-slate-500 mb-4 border border-white/5 shadow-lg">
                        <i class="fa-solid ${focusIcon} text-xl"></i>
                    </div>
                    <h4 class="text-white font-bold mb-2">Modules Initializing</h4>
                    <p class="text-xs text-slate-400 max-w-xs">Your primary workspace is currently being provisioned by the admin team. Active timelines will appear here shortly.</p>
                </div>
            `;
        } else {
            feedContainer.innerHTML = recentProjects.slice(0, 5).map(project => {
                const title = project.title || project.service || 'Custom Module';
                const status = (project.status || 'pending').toLowerCase();
                const progress = project.progress || 0;
                
                let statusColor = "bg-amber-400";
                if(status.includes('active') || status.includes('progress')) statusColor = "bg-ma-indigo";
                if(status.includes('completed') || status.includes('delivered')) statusColor = "bg-ma-emerald";

                return `
                    <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-colors cursor-pointer" onclick="window.loadSection('projects')">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-sm font-bold text-white truncate pr-4">${title}</h4>
                            <span class="text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0">${progress}%</span>
                        </div>
                        <div class="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                            <div class="${statusColor} h-1.5 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>
                        <div class="flex justify-between mt-2">
                            <span class="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Status: <span class="text-white">${status}</span></span>
                            <span class="text-[9px] text-slate-600 font-mono uppercase tracking-widest">ID: #${project.id.substring(0,6)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 6. Initialize Chart.js
        if (recentProjects.length > 0) {
            await loadChartJS();
            const projCtx = document.getElementById('clientProjectChart');
            if (projCtx) {
                new Chart(projCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Active', 'Completed', 'Pending Setup'],
                        datasets: [{
                            data: [activeProjectsCount, completedProjectsCount, pendingProjectsCount],
                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
                            borderColor: '#0f172a',
                            borderWidth: 3,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                bodyFont: { family: 'Inter' },
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: 1
                            }
                        }
                    }
                });
            }
        }

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Connection Error</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve telemetry data. Please check your connection.</p>
                <button onclick="window.loadSection('dashboard')" class="px-6 py-2.5 bg-ma-slate hover:bg-white/10 text-white rounded-xl border border-white/10 transition text-xs font-bold uppercase tracking-widest">
                    Retry Connection
                </button>
            </div>
        `;
    }
}