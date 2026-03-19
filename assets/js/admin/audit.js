import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Audit Component - Advanced Security Logs & Forensic Telemetry
 */
const Audit = {
    allLogs: [],
    filteredLogs: [],
    currentFilter: 'all',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchLogs();
            this.filteredLogs = [...this.allLogs];

            container.innerHTML = this.renderUI();
            this.renderLogsTable(this.filteredLogs);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Audit Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchLogs() {
        const snap = await getDocs(collection(db, "audit_logs"));
        this.allLogs = [];
        snap.forEach(doc => {
            this.allLogs.push({ id: doc.id, ...doc.data() });
        });

        // Sort by most recent
        this.allLogs.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allLogs.length;
        const info = this.allLogs.filter(l => (l.severity || 'info').toLowerCase() === 'info').length;
        const warning = this.allLogs.filter(l => (l.severity || 'info').toLowerCase() === 'warning').length;
        const critical = this.allLogs.filter(l => (l.severity || 'info').toLowerCase() === 'critical').length;

        return { total, info, warning, critical };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-fingerprint text-ma-cyan"></i> Security Forensics
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Monitor system access, track administrative actions, and intercept threat anomalies.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.AuditSimulateEvent()" class="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-bug"></i> Simulate Event
                        </button>
                        <button onclick="window.AuditExportData()" class="px-4 py-2.5 bg-ma-slate hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-ma-cyan"></i> Export Telemetry
                        </button>
                        <button onclick="window.loadSection('audit')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-cyan transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Logs</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-database"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Routine Activity</p>
                            <h4 class="text-2xl font-display font-bold text-ma-cyan">${stats.info}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-cyan/10 text-ma-cyan flex items-center justify-center border border-ma-cyan/20 group-hover:scale-110 transition"><i class="fa-solid fa-circle-check"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Anomalies</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.warning}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Critical Breaches</p>
                            <h4 class="text-2xl font-display font-bold text-rose-500">${stats.critical}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition"><i class="fa-solid fa-radiation"></i></div>
                    </div>
                </div>

                <!-- Filters & Table -->
                <div class="glass-panel rounded-3xl overflow-hidden border border-white/5 flex flex-col min-h-[500px]">
                    <!-- Toolbar -->
                    <div class="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex gap-2 bg-ma-dark p-1 rounded-xl border border-white/5 w-fit overflow-x-auto custom-scroll">
                            <button data-filter="all" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold bg-ma-cyan text-ma-dark shadow-lg transition whitespace-nowrap">All Logs</button>
                            <button data-filter="info" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Info</button>
                            <button data-filter="warning" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Warnings</button>
                            <button data-filter="critical" class="filter-btn px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition whitespace-nowrap">Critical</button>
                        </div>
                        
                        <div class="relative w-full md:w-64 shrink-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="audit-search" placeholder="Search events or actors..." class="w-full bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-cyan/50 transition-all">
                        </div>
                    </div>

                    <div class="overflow-x-auto custom-scroll flex-1">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-ma-dark/50 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                    <th class="px-6 py-4 font-medium">Timestamp</th>
                                    <th class="px-6 py-4 font-medium">Event Descriptor</th>
                                    <th class="px-6 py-4 font-medium">Severity</th>
                                    <th class="px-6 py-4 font-medium">Actor Identity</th>
                                    <th class="px-6 py-4 font-medium text-right">Forensics</th>
                                </tr>
                            </thead>
                            <tbody id="audit-table-body" class="divide-y divide-white/5 relative">
                                <!-- Table rows injected here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Modals Container -->
                <div id="audit-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="audit-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderLogsTable(logs) {
        const tbody = document.getElementById('audit-table-body');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-20 text-center">
                        <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                            <i class="fa-solid fa-shield-halved"></i>
                        </div>
                        <p class="text-slate-400 font-bold">No security anomalies detected.</p>
                        <p class="text-xs text-slate-600 mt-1">The system architecture is currently secure.</p>
                        <button onclick="window.AuditSimulateEvent()" class="mt-4 px-4 py-2 bg-ma-cyan/10 text-ma-cyan text-[10px] uppercase font-bold tracking-widest rounded border border-ma-cyan/20 hover:bg-ma-cyan hover:text-ma-dark transition">Simulate Event</button>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const severity = (log.severity || 'info').toLowerCase();
            const styles = this.getSeverityStyles(severity);
            const dateStr = log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Legacy Data';
            
            return `
            <tr class="group hover:bg-white/[0.02] transition-colors cursor-pointer" onclick="window.AuditInspectNode('${log.id}')">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full ${styles.dotClass}"></div>
                        <p class="text-[10px] font-mono text-slate-400 uppercase tracking-tighter group-hover:text-white transition">
                            ${dateStr}
                        </p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-sm font-bold text-white truncate max-w-[250px]">${log.event || 'System Action'}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${styles.badgeClass}">
                        ${severity}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest truncate max-w-[150px]">
                        ${log.actor || 'System'}
                    </p>
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2" onclick="event.stopPropagation()">
                        <button onclick="window.AuditInspectNode('${log.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-ma-cyan hover:border-ma-cyan/50 transition-all" title="Inspect Telemetry">
                            <i class="fa-solid fa-microscope text-xs"></i>
                        </button>
                        <button onclick="window.AuditDeleteNode('${log.id}')" class="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all" title="Purge Record">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    getSeverityStyles(severity) {
        switch(severity) {
            case 'critical': 
                return { badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20', dotClass: 'bg-rose-500 animate-pulse', icon: 'fa-radiation text-rose-500' };
            case 'warning': 
                return { badgeClass: 'bg-amber-400/10 text-amber-400 border-amber-400/20', dotClass: 'bg-amber-400', icon: 'fa-triangle-exclamation text-amber-400' };
            case 'info':
            default: 
                return { badgeClass: 'bg-ma-cyan/10 text-ma-cyan border-ma-cyan/20', dotClass: 'bg-ma-cyan', icon: 'fa-info-circle text-ma-cyan' };
        }
    },

    setupListeners() {
        const searchInput = document.getElementById('audit-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.applyFilters(term, this.currentFilter);
            });
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-ma-cyan', 'text-ma-dark', 'shadow-lg');
                    b.classList.add('text-slate-400');
                });
                e.target.classList.remove('text-slate-400');
                e.target.classList.add('bg-ma-cyan', 'text-ma-dark', 'shadow-lg');

                this.currentFilter = e.target.dataset.filter;
                const term = document.getElementById('audit-search')?.value.toLowerCase() || '';
                this.applyFilters(term, this.currentFilter);
            });
        });
    },

    applyFilters(searchTerm, severityFilter) {
        this.filteredLogs = this.allLogs.filter(l => {
            const event = (l.event || '').toLowerCase();
            const actor = (l.actor || '').toLowerCase();
            const matchesSearch = event.includes(searchTerm) || actor.includes(searchTerm);
            
            const lSeverity = (l.severity || 'info').toLowerCase();
            let matchesSeverity = false;
            
            if (severityFilter === 'all') matchesSeverity = true;
            else matchesSeverity = lSeverity === severityFilter;
            
            return matchesSearch && matchesSeverity;
        });
        this.renderLogsTable(this.filteredLogs);
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-fingerprint fa-fade text-4xl text-ma-cyan"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Decrypting_Security_Logs...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-ban"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Audit Decryption Failed</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('audit')" class="px-8 py-3 rounded-xl bg-ma-cyan text-ma-dark text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-cyan/20 transition-all">Retry Decryption</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.AuditToast = (msg, type = 'success') => {
            const container = document.getElementById('audit-toast-container');
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

        window.AuditExportData = () => {
            if(Audit.filteredLogs.length === 0) return window.AuditToast("No telemetry data to export", "error");
            
            let csv = "LogID,Timestamp,Severity,Event,Actor,Details\n";
            Audit.filteredLogs.forEach(l => {
                let dateStr = '';
                if(l.createdAt) dateStr = l.createdAt.seconds ? new Date(l.createdAt.seconds * 1000).toISOString() : l.createdAt;
                
                const safeEvent = (l.event || '').replace(/"/g, '""');
                const safeDetails = (l.details || '').replace(/"/g, '""');
                csv += `"${l.id}","${dateStr}","${l.severity||'info'}","${safeEvent}","${l.actor||''}","${safeDetails}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `MA_Security_Audit_${new Date().toISOString().split('T')[0]}.csv`);
            a.click();
            window.AuditToast("Security telemetry exported successfully.");
        };

        window.AuditCloseModal = () => {
            const container = document.getElementById('audit-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- SIMULATE EVENT (For demo/testing purposes) ---
        window.AuditSimulateEvent = async () => {
            try {
                const types = [
                    { sev: 'info', ev: 'Admin Authenticated Successfully' },
                    { sev: 'info', ev: 'Service Bundle Updated' },
                    { sev: 'warning', ev: 'Multiple Failed Login Attempts' },
                    { sev: 'critical', ev: 'Unauthorized Node Access Blocked' }
                ];
                const rand = types[Math.floor(Math.random() * types.length)];
                
                const data = {
                    event: rand.ev,
                    severity: rand.sev,
                    actor: "mubashirarham12@gmail.com",
                    details: "Simulated log generation triggered via Command Center diagnostics module. All parameters nominal.",
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "audit_logs"), data);
                window.AuditToast(`Simulated [${rand.sev.toUpperCase()}] event generated.`);
                Audit.init(); // Reload
            } catch (err) {
                console.error(err);
                window.AuditToast("Simulation failed.", "error");
            }
        };

        // --- FORENSIC INSPECTOR MODAL ---
        window.AuditInspectNode = (logId) => {
            const log = Audit.allLogs.find(l => l.id === logId);
            if(!log) return;

            const container = document.getElementById('audit-modal-container');
            const severity = (log.severity || 'info').toLowerCase();
            const styles = Audit.getSeverityStyles(severity);
            const dateStr = log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'Unknown';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[95vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out] overflow-hidden">
                        
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-microscope text-ma-cyan"></i> Forensic Analysis</h3>
                            <button onclick="window.AuditCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
                            
                            <!-- Hero / Severity -->
                            <div class="flex flex-col items-center justify-center py-6 border-b border-white/5 relative">
                                <div class="absolute inset-0 bg-${styles.badgeClass.split(' ')[0].replace('/10', '/5')} blur-2xl rounded-full"></div>
                                <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4 relative z-10 shadow-lg">
                                    <i class="fa-solid ${styles.icon}"></i>
                                </div>
                                <span class="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${styles.badgeClass} relative z-10 mb-2">
                                    Severity: ${severity}
                                </span>
                                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest relative z-10">Log ID: ${log.id}</p>
                            </div>

                            <!-- Core Metadata -->
                            <div class="space-y-4">
                                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Event Descriptor</p>
                                    <p class="text-sm font-bold text-white">${log.event || 'System Action'}</p>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Actor Identity</p>
                                        <p class="text-xs font-mono text-ma-cyan truncate" title="${log.actor || 'System'}">${log.actor || 'System'}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                        <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Timestamp</p>
                                        <p class="text-[10px] font-mono text-slate-300">${dateStr}</p>
                                    </div>
                                </div>

                                <!-- Raw Payload Details -->
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-2"><i class="fa-solid fa-code"></i> Forensic Payload</p>
                                    <div class="bg-black/50 border border-white/5 rounded-xl p-4 overflow-x-auto custom-scroll">
                                        <pre class="text-[11px] font-mono text-ma-cyan whitespace-pre-wrap leading-relaxed">${log.details || 'No extended payload data attached to this event.'}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-4 sm:p-6 border-t border-white/5 bg-ma-slate/30 shrink-0 flex gap-3">
                            <button onclick="window.AuditDeleteNode('${log.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-trash-can group-hover:animate-bounce"></i> Purge Record
                            </button>
                        </div>
                    </div>
                </div>
            `;
        };

        // --- DELETE MODAL ---
        window.AuditDeleteNode = (logId) => {
            const container = document.getElementById('audit-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-fire"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Purge Log Record</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently destroy this security log. This action violates standard retention compliance.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "PURGE" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.AuditInspectNode('${logId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.AuditExecuteDelete('${logId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.AuditExecuteDelete = async (logId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'PURGE') {
                return window.AuditToast("Confirmation failed. Type PURGE exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "audit_logs", logId));
                window.AuditCloseModal();
                window.AuditToast("Log eradicated successfully.");
                Audit.init(); // Refresh entire view
            } catch (e) {
                console.error(e);
                window.AuditToast("Purge failed.", "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'audit') {
        Audit.init();
    }
});