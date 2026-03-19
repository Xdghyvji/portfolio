import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
            // 1. Fetch necessary data concurrently for maximum speed
            const [ordersSnap, leadsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, "orders")),
                getDocs(collection(db, "leads")),
                getDocs(collection(db, "users"))
            ]);

            // 2. Process Statistics & Group Revenue by Date
            let totalRevenue = 0;
            let activeProjects = 0;
            let completedProjects = 0;
            let pendingProjects = 0;

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let revenueByMonth = {};
            
            // Initialize last 6 months to 0
            let d = new Date();
            for(let i=5; i>=0; i--) {
                let m = new Date(d.getFullYear(), d.getMonth() - i, 1);
                revenueByMonth[`${monthNames[m.getMonth()]} ${m.getFullYear()}`] = 0;
            }

            ordersSnap.forEach(doc => {
                const data = doc.data();
                const amount = Number(data.amount) || 0;
                const status = (data.status || 'pending').toLowerCase();
                const dateObj = data.createdAt ? new Date(data.createdAt) : new Date();
                
                // If it's paid/completed, add to revenue and plot on chart
                if (status === 'completed' || status === 'paid') {
                    totalRevenue += amount;
                    completedProjects++;

                    const monthKey = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                    if(revenueByMonth[monthKey] !== undefined) {
                        revenueByMonth[monthKey] += amount;
                    }
                } else if (status === 'active' || status === 'in progress' || status === 'progress') {
                    activeProjects++;
                } else {
                    pendingProjects++;
                }
            });

            // Calculate Conversion Rate (Clients / Leads)
            const leadsCount = leadsSnap.size;
            const clientsCount = usersSnap.docs.filter(d => d.data().role === 'client').length;
            const conversionRate = leadsCount > 0 ? ((clientsCount / leadsCount) * 100).toFixed(1) : 0;

            // Prepare Export Data
            window.dashboardExportData = {
                Revenue: totalRevenue,
                Active_Projects: activeProjects,
                Leads: leadsCount,
                Clients: clientsCount,
                Conversion_Rate: `${conversionRate}%`
            };

            // 3. Render the full dashboard UI
            container.innerHTML = this.renderUI({
                revenue: totalRevenue,
                projects: activeProjects,
                leads: leadsCount,
                conversion: conversionRate
            });

            // 4. Load Chart.js and initialize beautiful graphs with REAL data
            await loadChartJS();
            this.initCharts(
                Object.keys(revenueByMonth), 
                Object.values(revenueByMonth), 
                activeProjects, 
                completedProjects, 
                pendingProjects
            );

            // 5. Populate Live Activity Logs
            this.loadRecentActivity();

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI(stats) {
        return `
            <div class="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                
                <!-- Quick Actions / Header Extension -->
                <div class="flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-sm gap-4">
                    <p class="text-sm text-slate-400 font-medium flex items-center"><i class="fa-solid fa-satellite-dish text-ma-emerald animate-pulse mr-2"></i> Command Center Uplink Established</p>
                    <div class="flex gap-3">
                        <button onclick="window.loadSection('invoices')" class="px-4 py-2 bg-ma-indigo/10 hover:bg-ma-indigo/20 text-ma-indigo border border-ma-indigo/30 rounded-lg text-xs font-bold transition">Generate Invoice</button>
                        <button onclick="window.exportDashboardReport()" class="px-4 py-2 bg-ma-emerald/10 hover:bg-ma-emerald/20 text-ma-emerald border border-ma-emerald/30 rounded-lg text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-download"></i> Export Report
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this.renderStatCard("Total Revenue", `$${stats.revenue.toLocaleString()}`, "fa-wallet", "text-ma-emerald", "bg-ma-emerald/10", "Lifetime")}
                    ${this.renderStatCard("Active Projects", stats.projects, "fa-diagram-project", "text-ma-indigo", "bg-ma-indigo/10", "In Pipeline")}
                    ${this.renderStatCard("Inbound Leads", stats.leads, "fa-bolt", "text-amber-400", "bg-amber-400/10", "Unprocessed")}
                    ${this.renderStatCard("Conversion Rate", `${stats.conversion}%`, "fa-bullseye", "text-rose-400", "bg-rose-400/10", "Leads to Clients")}
                </div>

                <!-- Charts & Activity Split -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <!-- Main Chart Area (Spans 2 columns) -->
                    <div class="lg:col-span-2 space-y-8">
                        
                        <!-- Revenue Trajectory Chart -->
                        <div class="glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden h-[350px]">
                            <div class="absolute -right-20 -top-20 w-64 h-64 bg-ma-indigo/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div class="flex items-center justify-between mb-6 relative z-10">
                                <div>
                                    <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm">Revenue Trajectory</h3>
                                    <p class="text-[10px] text-slate-500 font-mono tracking-widest mt-1">LAST 6 MONTHS</p>
                                </div>
                            </div>
                            
                            <div class="flex-1 w-full relative z-10">
                                <canvas id="revenueChart"></canvas>
                            </div>
                        </div>

                        <!-- Project Distribution Chart -->
                        <div class="glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden h-[300px]">
                            <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-ma-emerald/10 rounded-full blur-3xl pointer-events-none"></div>
                            <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm mb-6 relative z-10">Project Ecosystem</h3>
                            <div class="w-full h-full relative z-10 flex items-center justify-center">
                                <canvas id="projectChart"></canvas>
                            </div>
                        </div>

                    </div>

                    <!-- Recent Actions Panel (Spans 1 column) -->
                    <div class="glass-panel rounded-3xl p-6 flex flex-col h-full max-h-[680px]">
                        <div class="flex items-center justify-between mb-6 shrink-0">
                            <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm">Live Logs</h3>
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        </div>
                        
                        <!-- Added scroll bar container constraints -->
                        <div id="recent-activity-list" class="space-y-4 flex-1 overflow-y-auto custom-scroll pr-3">
                            <!-- Skeleton Loader for Logs -->
                            <div class="flex gap-4 items-start opacity-50">
                                <div class="w-2 h-2 rounded-full bg-ma-indigo mt-1.5 animate-pulse"></div>
                                <div>
                                    <div class="h-3 w-32 bg-slate-700 rounded mb-2"></div>
                                    <div class="h-2 w-20 bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        </div>
                        
                        <button onclick="window.loadSection('audit')" class="w-full mt-6 shrink-0 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                            View Full Audit <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderStatCard(title, value, icon, iconColor, bgColor, subtitle) {
        return `
            <div class="glass-panel p-6 rounded-3xl group hover:border-ma-indigo/30 hover:bg-white/[0.03] transition-all duration-300 relative overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 ${bgColor} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex items-start justify-between relative z-10">
                    <div>
                        <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">${title}</p>
                        <h4 class="text-2xl font-display font-bold text-white">${value}</h4>
                    </div>
                    <div class="w-10 h-10 rounded-2xl ${bgColor} ${iconColor} flex items-center justify-center text-lg border border-white/5 shadow-lg">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                </div>
                <div class="mt-4 flex items-center gap-2 relative z-10">
                    <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1">${subtitle}</span>
                    <div class="h-[1px] flex-1 bg-white/10"></div>
                </div>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-6">
                <div class="relative w-16 h-16">
                    <div class="absolute inset-0 border-t-2 border-ma-indigo rounded-full animate-spin"></div>
                    <div class="absolute inset-2 border-b-2 border-ma-emerald rounded-full animate-spin" style="animation-direction: reverse;"></div>
                    <i class="fa-solid fa-network-wired absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500"></i>
                </div>
                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Visualizers & Real Data...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2 uppercase tracking-wider">Telemetry Failure</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('dashboard')" class="px-6 py-2.5 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition shadow-lg shadow-ma-indigo/20">Restart Sequence</button>
            </div>
        `;
    },

    initCharts(revenueLabels, revenueData, active, completed, pending) {
        // 1. Revenue Line Chart Setup
        const revCtx = document.getElementById('revenueChart');
        if (revCtx) {
            new Chart(revCtx, {
                type: 'line',
                data: {
                    labels: revenueLabels,
                    datasets: [{
                        label: 'Revenue ($)',
                        data: revenueData,
                        borderColor: '#6366f1', // ma-indigo
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#10b981', // ma-emerald
                        pointBorderColor: '#020617', // ma-dark
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4 // Smooth curves
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { family: 'Lexend' },
                            bodyFont: { family: 'Inter' },
                            padding: 12,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return '$' + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                            ticks: { 
                                color: '#64748b', 
                                font: { family: 'Inter', size: 10 },
                                callback: function(value) {
                                    return '$' + value;
                                }
                            }
                        },
                        x: {
                            grid: { display: false, drawBorder: false },
                            ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
                        }
                    }
                }
            });
        }

        // 2. Project Distribution Doughnut Chart Setup
        const projCtx = document.getElementById('projectChart');
        if (projCtx) {
            new Chart(projCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Active', 'Completed', 'Pending'],
                    datasets: [{
                        data: [active || 0, completed || 0, pending || 0],
                        backgroundColor: [
                            '#6366f1', // ma-indigo
                            '#10b981', // ma-emerald
                            '#f59e0b'  // amber
                        ],
                        borderColor: '#020617', // ma-dark border to blend with bg
                        borderWidth: 4,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 11 },
                                usePointStyle: true,
                                padding: 20
                            }
                        },
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
    },

    async loadRecentActivity() {
        const listContainer = document.getElementById('recent-activity-list');
        if (!listContainer) return;

        try {
            // We fetch the latest leads, users, and orders to form an activity timeline
            const [leadsSnap, usersSnap, ordersSnap] = await Promise.all([
                getDocs(query(collection(db, "leads"), limit(8))),
                getDocs(query(collection(db, "users"), limit(8))),
                getDocs(query(collection(db, "orders"), limit(8)))
            ]);
            
            let activities = [];

            leadsSnap.forEach(doc => {
                const data = doc.data();
                activities.push({
                    type: 'lead',
                    title: `New Lead: ${data.name || 'Unknown'}`,
                    desc: data.goal || 'General Inquiry',
                    time: data.createdAt || new Date().toISOString(),
                    icon: 'fa-bolt',
                    color: 'text-amber-400',
                    dot: 'bg-amber-400'
                });
            });

            usersSnap.forEach(doc => {
                const data = doc.data();
                if(data.role === 'client') {
                    activities.push({
                        type: 'client',
                        title: `Client Joined`,
                        desc: data.displayName || data.email,
                        time: data.createdAt || new Date().toISOString(),
                        icon: 'fa-user-check',
                        color: 'text-ma-emerald',
                        dot: 'bg-ma-emerald'
                    });
                }
            });

            ordersSnap.forEach(doc => {
                const data = doc.data();
                activities.push({
                    type: 'order',
                    title: `Project Update`,
                    desc: data.title || data.service || 'Module Modification',
                    time: data.createdAt || new Date().toISOString(),
                    icon: 'fa-terminal',
                    color: 'text-ma-indigo',
                    dot: 'bg-ma-indigo'
                });
            });

            // Sort mixed activities by newest first
            activities.sort((a, b) => new Date(b.time) - new Date(a.time));
            
            listContainer.innerHTML = '';
            
            if (activities.length === 0) {
                listContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fa-solid fa-wind text-3xl text-slate-700 mb-2"></i>
                        <p class="text-xs text-slate-500 font-medium">Radar clear. No recent events.</p>
                    </div>
                `;
                return;
            }

            activities.forEach(item => {
                // Formatting time roughly
                const dateObj = new Date(item.time);
                const isToday = dateObj.toDateString() === new Date().toDateString();
                const timeString = isToday ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : dateObj.toLocaleDateString();

                const html = `
                    <div class="flex gap-4 items-start group hover:bg-white/[0.02] p-2 rounded-lg transition -ml-2">
                        <div class="relative mt-1">
                            <div class="w-8 h-8 rounded-lg bg-ma-slate flex items-center justify-center ${item.color} border border-white/5 relative z-10">
                                <i class="fa-solid ${item.icon} text-xs"></i>
                            </div>
                            <div class="absolute top-8 bottom-[-20px] left-1/2 w-px bg-white/5 -translate-x-1/2 -z-10 group-last:hidden"></div>
                        </div>
                        <div class="flex-1 overflow-hidden pt-0.5">
                            <p class="text-sm text-white font-medium truncate">${item.title}</p>
                            <p class="text-[11px] text-slate-400 truncate mt-0.5">${item.desc}</p>
                        </div>
                        <span class="text-[9px] font-mono text-slate-600 whitespace-nowrap pt-1">${timeString}</span>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', html);
            });
        } catch (e) {
            console.error("Activity Load Error", e);
            listContainer.innerHTML = `
                <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                    <i class="fa-solid fa-triangle-exclamation text-rose-500"></i>
                    <p class="text-xs text-rose-400 font-medium">Failed to intercept log stream.</p>
                </div>
            `;
        }
    }
};

// Global CSV Export Function
window.exportDashboardReport = function() {
    if(!window.dashboardExportData) {
        alert("Data is not ready for export yet.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n"; // Header row

    for (const [key, value] of Object.entries(window.dashboardExportData)) {
        csvContent += `${key.replace(/_/g, " ")},${value}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MA_Command_Center_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'dashboard') {
        Dashboard.init();
    }
});

// Auto-init if it's the initial load and dashboard is selected
setTimeout(() => {
    if(document.getElementById('nav-dashboard') && document.getElementById('nav-dashboard').classList.contains('text-ma-indigo')) {
        Dashboard.init();
    }
}, 500);