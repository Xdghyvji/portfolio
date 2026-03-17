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
    if (e.detail.section === 'billing') {
        renderBilling();
    }
});

async function renderBilling() {
    const contentArea = document.getElementById('client-content');
    
    // Loading State
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px]">
            <div class="text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-emerald mb-4"></i>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Retrieving Financial Ledgers...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch Invoices assigned to this user
        const invoicesRef = collection(db, "invoices");
        const q = query(invoicesRef, where("clientEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        const invoices = [];
        let totalPending = 0;
        let totalPaid = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            invoices.push({ id: doc.id, ...data });
            
            const amount = parseFloat(data.amount) || 0;
            if (data.status && data.status.toLowerCase() === 'paid') {
                totalPaid += amount;
            } else {
                totalPending += amount;
            }
        });

        // HTML Shell
        let html = `
            <div class="max-w-6xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white">Billing & Invoices</h2>
                        <p class="text-slate-400 text-sm">Manage your payment methods, view past transactions, and settle outstanding balances.</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-4 py-2 bg-ma-slate text-white border border-white/10 hover:bg-white/5 rounded-lg text-sm font-medium transition flex items-center gap-2">
                            <i class="fa-brands fa-stripe"></i> Payment Methods
                        </button>
                    </div>
                </div>

                <!-- Financial Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <!-- Outstanding Balance -->
                    <div class="glass-panel p-6 rounded-2xl border ${totalPending > 0 ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5'} flex items-center justify-between relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
                        <div>
                            <p class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                            <h3 class="text-3xl font-display font-bold ${totalPending > 0 ? 'text-rose-400' : 'text-white'}">$${totalPending.toFixed(2)}</h3>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-rose-400 shadow-lg relative z-10">
                            <i class="fa-solid fa-file-invoice-dollar text-xl"></i>
                        </div>
                    </div>

                    <!-- Total Paid -->
                    <div class="glass-panel p-6 rounded-2xl border border-white/5 flex items-center justify-between relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-24 h-24 bg-ma-emerald/10 rounded-full blur-2xl"></div>
                        <div>
                            <p class="text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Total Settled</p>
                            <h3 class="text-3xl font-display font-bold text-white">$${totalPaid.toFixed(2)}</h3>
                        </div>
                        <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-ma-emerald shadow-lg relative z-10">
                            <i class="fa-solid fa-check-double text-xl"></i>
                        </div>
                    </div>
                </div>
        `;

        if (invoices.length === 0) {
            // Empty State
            html += `
                <div class="glass-panel rounded-3xl border border-white/5 p-16 text-center flex flex-col items-center justify-center relative overflow-hidden">
                    <div class="w-20 h-20 rounded-2xl bg-ma-slate border border-white/10 flex items-center justify-center text-slate-500 mb-6 relative z-10 shadow-2xl">
                        <i class="fa-solid fa-receipt text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-display font-bold text-white mb-2 relative z-10">No Billing History</h3>
                    <p class="text-slate-400 max-w-md mx-auto relative z-10">You currently have no invoices or payment records associated with this account.</p>
                </div>
            `;
        } else {
            // Invoices List
            html += `
                <div class="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                    <div class="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 class="text-sm font-display font-bold text-white">Recent Transactions</h3>
                    </div>
                    <div class="divide-y divide-white/5">
            `;
            
            // Sort invoices by date descending (using JS since we didn't query with orderBy to avoid missing index errors)
            invoices.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

            invoices.forEach(invoice => {
                const title = invoice.title || invoice.service || 'Custom Service Rendered';
                const status = (invoice.status || 'Pending').toLowerCase();
                const amount = parseFloat(invoice.amount || 0).toFixed(2);
                const date = invoice.date ? new Date(invoice.date).toLocaleDateString() : (invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A');
                
                // Determine Status Colors & Buttons
                let statusBadge = '';
                let actionButton = '';
                
                if (status === 'paid') {
                    statusBadge = `<span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border text-ma-emerald bg-ma-emerald/10 border-ma-emerald/20"><i class="fa-solid fa-check mr-1"></i> Paid</span>`;
                    actionButton = `<button class="w-8 h-8 rounded-lg bg-ma-slate hover:bg-white/10 flex items-center justify-center text-slate-400 transition" title="Download Receipt"><i class="fa-solid fa-download"></i></button>`;
                } else {
                    statusBadge = `<span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border text-rose-400 bg-rose-400/10 border-rose-400/20"><i class="fa-solid fa-clock mr-1"></i> Pending</span>`;
                    actionButton = `<button class="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-bold transition">Pay Now</button>`;
                }

                html += `
                    <div class="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-xl bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                <i class="fa-solid fa-file-invoice"></i>
                            </div>
                            <div>
                                <h4 class="text-white font-bold text-sm mb-0.5">${title}</h4>
                                <div class="flex items-center gap-3 text-xs text-slate-500 font-mono">
                                    <span>INV-${invoice.id.substring(0,6).toUpperCase()}</span>
                                    <span>&bull;</span>
                                    <span>${date}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-6 justify-between md:justify-end border-t border-white/5 md:border-0 pt-4 md:pt-0">
                            <div class="text-left md:text-right">
                                <p class="text-sm font-bold text-white mb-1">$${amount}</p>
                                ${statusBadge}
                            </div>
                            <div>
                                ${actionButton}
                            </div>
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
        console.error("Billing Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Sync Failure</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve financial ledgers from the database.</p>
                <button onclick="window.loadSection('billing')" class="px-6 py-2 bg-ma-slate hover:bg-white/10 text-white rounded-lg border border-white/10 transition text-sm">
                    Retry Sync
                </button>
            </div>
        `;
    }
}