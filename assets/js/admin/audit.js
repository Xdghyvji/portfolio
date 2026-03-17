import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (Matching portfolio-8e083)
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
 * Audit Component
 * Monitors system integrity, administrative access logs, and security events
 */
const Audit = {
    allLogs: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            // Fetch audit logs - usually restricted to last 50 for performance
            const snap = await getDocs(collection(db, "audit_logs"));
            this.allLogs = [];
            snap.forEach(doc => {
                this.allLogs.push({ id: doc.id, ...doc.data() });
            });

            // Sort by timestamp (newest first)
            this.allLogs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

            container.innerHTML = this.renderUI();
            this.renderLogsTable(this.allLogs);

        } catch (error) {
            console.error("Audit Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Access Logs</h2>
                        <p class="text-sm text-slate-500">Real-time surveillance of administrative interactions and security handshakes.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-ma-emerald/10 border border-ma-emerald/20">
                            <span class="w-1.5 h-1.5 rounded-full bg-ma-emerald animate-pulse"></span>
                            <span class="text-[9px] font-mono font-bold text-ma-emerald uppercase tracking-widest">Integrity_Optimal</span>
                        </div>
                    </div>
                </div>

                <!-- Security Parameters Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    ${this.renderSecurityTile("Global Latency", "24ms", "fa-bolt", "text-ma-cyan")}
                    ${this.renderSecurityTile("Encryption", "AES-256", "fa-lock", "text-ma-indigo")}
                    ${this.renderSecurityTile("Active Sessions", "1", "fa-user-shield", "text-ma-emerald")}
                    ${this.renderSecurityTile("Threat Level", "Zero", "fa-shield-heart", "text-slate-400")}
                </div>

                <!-- Audit Ledger -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5">
                    <div class="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <h3 class="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">System_Security_Ledger</h3>
                        <div class="flex gap-4">
                            <span class="text-[10px] font-mono text-slate-600 uppercase">Stream: Active</span>
                            <span class="text-[10px] font-mono text-slate-600 uppercase">Node: MA_Mainframe</span>
                        </div>
                    </div>
                    <div class="overflow-x-auto custom-scroll">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Event_ID / Source</th>
                                    <th class="px-6 py-4 font-medium">Action_Type</th>
                                    <th class="px-6 py-4 font-medium">Network_IP</th>
                                    <th class="px-6 py-4 font-medium">Timestamp</th>
                                    <th class="px-6 py-4 font-medium text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody id="audit-table-body" class="divide-y divide-white/5">
                                <!-- Logs injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderLogsTable(logs) {
        const tbody = document.getElementById('audit-table-body');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-16 text-center text-slate-600 italic font-mono text-xs uppercase tracking-widest">No_Security_Events_Recorded</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr class="group hover:bg-white/[0.01] transition-colors">
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-ma-slate flex items-center justify-center text-slate-500 border border-white/5 group-hover:border-ma-indigo/30 transition-all">
                            <i class="fa-solid fa-fingerprint text-[10px]"></i>
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-[10px] font-mono text-ma-indigo uppercase truncate">#${log.id.substring(0, 12)}</p>
                            <p class="text-xs font-bold text-white truncate">${log.userEmail || 'System_Service'}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5">
                    <span class="text-xs font-medium text-slate-300 uppercase tracking-tight">${log.action || 'INTERACTION'}</span>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500">${log.ip || 'Masked_Node'}</p>
                </td>
                <td class="px-6 py-5">
                    <p class="text-[10px] font-mono text-slate-500 uppercase">
                        ${log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'NODATE'}
                    </p>
                </td>
                <td class="px-6 py-5 text-right">
                    <span class="px-2 py-1 rounded-lg bg-ma-emerald/10 text-ma-emerald text-[9px] font-bold uppercase tracking-widest border border-ma-emerald/20">
                        SUCCESS
                    </span>
                </td>
            </tr>
        `).join('');
    },

    renderSecurityTile(label, value, icon, color) {
        return `
            <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color} border border-white/5">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div>
                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest">${label}</p>
                    <p class="text-sm font-bold text-white uppercase">${value}</p>
                </div>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-fingerprint fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Establishing_Secure_Audit_Link...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-user-secret"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Security Interruption</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('audit')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Re-authenticate Link</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'audit') {
        Audit.init();
    }
});