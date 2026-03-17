import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    if (e.detail.section === 'support') {
        renderSupport();
    }
});

async function renderSupport() {
    const contentArea = document.getElementById('client-content');
    
    // Loading State
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px]">
            <div class="text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-indigo mb-4"></i>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Establishing Secure Comms...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch Support Tickets assigned to this user
        const ticketsRef = collection(db, "tickets");
        const q = query(ticketsRef, where("clientEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        const tickets = [];
        let openTickets = 0;
        let resolvedTickets = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            tickets.push({ id: doc.id, ...data });
            
            const status = (data.status || 'open').toLowerCase();
            if (status === 'resolved' || status === 'closed') {
                resolvedTickets++;
            } else {
                openTickets++;
            }
        });

        // HTML Shell
        let html = `
            <div class="max-w-6xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white">Support Desk</h2>
                        <p class="text-slate-400 text-sm">Submit new requests, report issues, and track your communication threads.</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="alert('New ticket form would open here.')" class="px-5 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> New Request
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- Open Tickets -->
                    <div class="glass-panel p-6 rounded-2xl border ${openTickets > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'} flex items-center justify-between relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
                        <div>
                            <p class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Active Requests</p>
                            <h3 class="text-3xl font-display font-bold ${openTickets > 0 ? 'text-amber-400' : 'text-white'}">${openTickets}</h3>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-amber-400 shadow-lg relative z-10">
                            <i class="fa-solid fa-headset text-xl"></i>
                        </div>
                    </div>

                    <!-- Resolved Tickets -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-ma-emerald/10 rounded-full blur-2xl"></div>
                        <div>
                            <p class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Resolved Issues</p>
                            <h3 class="text-3xl font-display font-bold text-white">${resolvedTickets}</h3>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-ma-emerald shadow-lg relative z-10">
                            <i class="fa-solid fa-check-circle text-xl"></i>
                        </div>
                    </div>
                </div>
        `;

        if (tickets.length === 0) {
            // Empty State
            html += `
                <div class="glass-panel rounded-3xl border border-white/5 p-16 text-center flex flex-col items-center justify-center relative overflow-hidden">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ma-indigo/5 rounded-full blur-3xl"></div>
                    <div class="w-20 h-20 rounded-2xl bg-ma-slate border border-white/10 flex items-center justify-center text-slate-500 mb-6 relative z-10 shadow-2xl">
                        <i class="fa-solid fa-life-ring text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-display font-bold text-white mb-2 relative z-10">No Support History</h3>
                    <p class="text-slate-400 max-w-md mx-auto relative z-10">You have no active or past support tickets. If you need assistance with your modules, open a new request.</p>
                </div>
            `;
        } else {
            // Tickets List
            html += `
                <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div class="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 class="text-sm font-display font-bold text-white">Communication Threads</h3>
                    </div>
                    <div class="divide-y divide-white/5">
            `;
            
            // Sort by date descending
            tickets.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

            tickets.forEach(ticket => {
                const subject = ticket.subject || 'General Inquiry';
                const status = (ticket.status || 'open').toLowerCase();
                const priority = (ticket.priority || 'normal').toLowerCase();
                const date = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent';
                
                // Determine Status Badge
                let statusBadge = '';
                if (status === 'resolved' || status === 'closed') {
                    statusBadge = `<span class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border text-ma-emerald bg-ma-emerald/10 border-ma-emerald/20">Resolved</span>`;
                } else if (status === 'pending') {
                    statusBadge = `<span class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border text-ma-indigo bg-ma-indigo/10 border-ma-indigo/20">Pending Admin</span>`;
                } else {
                    statusBadge = `<span class="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border text-amber-400 bg-amber-400/10 border-amber-400/20">Open</span>`;
                }

                // Determine Priority Icon
                let priorityIcon = '<i class="fa-solid fa-circle text-slate-500 text-[8px]" title="Normal Priority"></i>';
                if (priority === 'high' || priority === 'urgent') {
                    priorityIcon = '<i class="fa-solid fa-circle text-rose-500 text-[8px] animate-pulse" title="High Priority"></i>';
                }

                html += `
                    <div class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition cursor-pointer group">
                        <div class="flex items-start gap-4">
                            <div class="w-10 h-10 rounded-lg bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400 shrink-0 mt-1">
                                <i class="fa-solid fa-message"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    ${priorityIcon}
                                    <h4 class="text-white font-bold text-sm group-hover:text-ma-indigo transition">${subject}</h4>
                                </div>
                                <div class="flex items-center gap-3 text-xs text-slate-500 font-mono">
                                    <span>TKT-${ticket.id.substring(0,6).toUpperCase()}</span>
                                    <span>&bull;</span>
                                    <span>Opened: ${date}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-4 justify-between md:justify-end border-t border-white/5 md:border-0 pt-4 md:pt-0">
                            <div>
                                ${statusBadge}
                            </div>
                            <button class="w-8 h-8 rounded-lg bg-ma-slate hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition" title="View Thread">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }

        html += `</div>`; // Close container
        contentArea.innerHTML = html;

    } catch (error) {
        console.error("Support Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Sync Failure</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve support threads from the database.</p>
                <button onclick="window.loadSection('support')" class="px-6 py-2 bg-ma-slate hover:bg-white/10 text-white rounded-lg border border-white/10 transition text-sm">
                    Retry Sync
                </button>
            </div>
        `;
    }
}