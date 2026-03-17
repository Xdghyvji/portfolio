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
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-emerald mb-4"></i>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Dashboard Data...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch Client Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const clientName = userData.displayName ? userData.displayName.split(' ')[0] : 'Client';
        const clientInterest = userData.interest || 'Ecosystem';

        // Fetch Client Stats (Mocked or real queries can be added here)
        // E.g., const projectsQuery = query(collection(db, "orders"), where("clientId", "==", user.uid));
        const activeProjectsCount = 1; // Placeholder
        const pendingInvoices = "$0.00"; // Placeholder
        const openTickets = 0; // Placeholder

        // Generate tailored welcome message based on Onboarding selection
        let focusText = "digital architecture";
        let focusIcon = "fa-layer-group";
        if(clientInterest === 'Development') { focusText = "custom architecture & web development"; focusIcon = "fa-code"; }
        if(clientInterest === 'Growth') { focusText = "digital growth & traffic scaling"; focusIcon = "fa-chart-line"; }
        if(clientInterest === 'Automation') { focusText = "AI pipelines & workflow automation"; focusIcon = "fa-robot"; }

        // Render UI
        contentArea.innerHTML = `
            <div class="max-w-6xl mx-auto space-y-6">
                
                <!-- Welcome Banner -->
                <div class="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-ma-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 class="text-2xl md:text-3xl font-display font-bold text-white mb-2">Welcome back, ${clientName}</h2>
                            <p class="text-slate-400 text-sm max-w-lg">Your command center is active. We are currently focusing your operational resources on <span class="text-ma-emerald font-semibold">${focusText}</span>.</p>
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
                    <!-- Stat 1 -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-ma-indigo/50 transition duration-300 group cursor-pointer" onclick="window.loadSection('projects')">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-10 h-10 rounded-lg bg-ma-indigo/20 flex items-center justify-center text-ma-indigo group-hover:bg-ma-indigo group-hover:text-white transition">
                                <i class="fa-solid fa-diagram-project"></i>
                            </div>
                            <span class="text-xs font-mono text-slate-500 uppercase tracking-wider">Active</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1">${activeProjectsCount}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest">Active Projects</p>
                    </div>

                    <!-- Stat 2 -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-ma-emerald/50 transition duration-300 group cursor-pointer" onclick="window.loadSection('billing')">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-10 h-10 rounded-lg bg-ma-emerald/20 flex items-center justify-center text-ma-emerald group-hover:bg-ma-emerald group-hover:text-white transition">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <span class="text-xs font-mono text-slate-500 uppercase tracking-wider">Due</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1">${pendingInvoices}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest">Pending Invoices</p>
                    </div>

                    <!-- Stat 3 -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-rose-500/50 transition duration-300 group cursor-pointer" onclick="window.loadSection('support')">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition">
                                <i class="fa-solid fa-headset"></i>
                            </div>
                            <span class="text-xs font-mono text-slate-500 uppercase tracking-wider">Open</span>
                        </div>
                        <h3 class="text-3xl font-display font-bold text-white mb-1">${openTickets}</h3>
                        <p class="text-xs text-slate-400 uppercase tracking-widest">Support Tickets</p>
                    </div>
                </div>

                <!-- Main Dashboard Content Split -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Recent Activity (Takes up 2/3) -->
                    <div class="lg:col-span-2 glass-panel rounded-2xl border border-white/5 p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-lg font-display font-bold text-white">Project Uplink</h3>
                            <button onclick="window.loadSection('projects')" class="text-xs text-ma-emerald hover:text-emerald-400 font-medium">View All</button>
                        </div>
                        
                        <!-- Empty State / Placeholder for Recent Activity -->
                        <div class="border border-dashed border-white/10 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                            <div class="w-12 h-12 rounded-full bg-ma-slate flex items-center justify-center text-slate-500 mb-4 border border-white/5">
                                <i class="fa-solid ${focusIcon} text-xl"></i>
                            </div>
                            <h4 class="text-white font-medium mb-2">Modules Initializing</h4>
                            <p class="text-sm text-slate-400 max-w-sm">Your primary workspace is currently being provisioned by the admin team. Project timelines and milestones will appear here shortly.</p>
                        </div>
                    </div>

                    <!-- Quick Actions (Takes up 1/3) -->
                    <div class="glass-panel rounded-2xl border border-white/5 p-6 flex flex-col">
                        <h3 class="text-lg font-display font-bold text-white mb-6">Quick Actions</h3>
                        
                        <div class="space-y-3 flex-1">
                            <button onclick="window.loadSection('support')" class="w-full bg-ma-slate hover:bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 transition group">
                                <div class="w-8 h-8 rounded-lg bg-ma-indigo/20 text-ma-indigo flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <i class="fa-solid fa-plus"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-sm font-medium text-white">New Request</p>
                                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Submit Support Ticket</p>
                                </div>
                            </button>

                            <button onclick="window.loadSection('billing')" class="w-full bg-ma-slate hover:bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4 transition group">
                                <div class="w-8 h-8 rounded-lg bg-ma-emerald/20 text-ma-emerald flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <i class="fa-solid fa-credit-card"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-sm font-medium text-white">Payment Methods</p>
                                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Manage Billing Setup</p>
                                </div>
                            </button>

                            <a href="https://wa.me/923701722964" target="_blank" class="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl p-4 flex items-center gap-4 transition group">
                                <div class="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <i class="fa-brands fa-whatsapp text-lg"></i>
                                </div>
                                <div class="text-left">
                                    <p class="text-sm font-medium text-white">Direct Line</p>
                                    <p class="text-[10px] text-emerald-500 uppercase tracking-widest mt-0.5">Chat with Mubashir</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Dashboard Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Connection Error</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve dashboard data. Please check your connection.</p>
                <button onclick="window.loadSection('dashboard')" class="px-6 py-2 bg-ma-slate hover:bg-white/10 text-white rounded-lg border border-white/10 transition text-sm">
                    Retry Connection
                </button>
            </div>
        `;
    }
}