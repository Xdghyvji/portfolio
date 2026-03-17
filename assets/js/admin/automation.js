import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (Matching your portfolio-8e083 environment)
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
 * Automation Component
 * Handles the monitoring and configuration of AI-driven project workflows
 */
const Automation = {
    activeWorkflows: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            const snap = await getDocs(collection(db, "automations"));
            this.activeWorkflows = [];
            snap.forEach(doc => {
                this.activeWorkflows.push({ id: doc.id, ...doc.data() });
            });

            container.innerHTML = this.renderUI();
            this.renderWorkflowNodes(this.activeWorkflows);

        } catch (error) {
            console.error("Automation Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">AI Automations</h2>
                        <p class="text-sm text-slate-500">Monitoring autonomous project pipelines and synthetic content generation nodes.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-ma-emerald/10 border border-ma-emerald/20">
                            <span class="w-2 h-2 rounded-full bg-ma-emerald animate-pulse"></span>
                            <span class="text-[10px] font-mono font-bold text-ma-emerald uppercase tracking-widest">Core_Engine_Active</span>
                        </div>
                    </div>
                </div>

                <!-- Workflow Grid -->
                <div id="automation-grid" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Workflow Nodes Injected Here -->
                </div>

                <!-- Technical Specs Panel -->
                <div class="glass-panel rounded-3xl p-8 border border-white/5 bg-gradient-to-br from-ma-slate to-ma-dark">
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-12 h-12 rounded-2xl bg-ma-indigo/20 flex items-center justify-center text-ma-indigo border border-ma-indigo/30">
                            <i class="fa-solid fa-microchip text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm">System Parameters</h3>
                            <p class="text-[10px] font-mono text-slate-500">API_UPTIME: 99.9% | LATENCY: 24MS</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${this.renderParamTile("GPT-4o Integration", "Connected")}
                        ${this.renderParamTile("Stable Diffusion", "Active")}
                        ${this.renderParamTile("Webhook Listeners", "Listening")}
                        ${this.renderParamTile("Compute Clusters", "Optimal")}
                    </div>
                </div>
            </div>
        `;
    },

    renderWorkflowNodes(workflows) {
        const grid = document.getElementById('automation-grid');
        if (!grid) return;

        if (workflows.length === 0) {
            // Placeholder default workflows if none in DB
            const defaults = [
                { name: "YouTube Cashcow Pipeline", type: "Video_Gen", status: "Active", efficiency: "94%" },
                { name: "TikTok Viral Automation", type: "Social_Bot", status: "Active", efficiency: "88%" }
            ];
            grid.innerHTML = defaults.map(w => this.renderWorkflowCard(w)).join('');
            return;
        }

        grid.innerHTML = workflows.map(w => this.renderWorkflowCard(w)).join('');
    },

    renderWorkflowCard(w) {
        return `
            <div class="glass-panel p-6 rounded-3xl border border-white/5 hover:border-ma-indigo/30 transition-all group">
                <div class="flex items-start justify-between mb-6">
                    <div class="flex gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-ma-indigo border border-white/5 group-hover:bg-ma-indigo group-hover:text-white transition-all duration-500">
                            <i class="fa-solid fa-robot text-xl"></i>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg">${w.name}</h4>
                            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">${w.type || 'Automation_Node'}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-[10px] font-mono font-bold text-ma-emerald uppercase">${w.status || 'ACTIVE'}</span>
                        <div class="w-20 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                            <div class="h-full bg-ma-emerald" style="width: ${w.efficiency || '100%'}"></div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-black/20 rounded-2xl p-4 border border-white/[0.02] mb-6">
                    <div class="flex justify-between text-[10px] font-mono text-slate-400 mb-2 uppercase">
                        <span>Current_Task</span>
                        <span class="text-ma-indigo">Processing...</span>
                    </div>
                    <p class="text-xs text-slate-300 font-medium">Analyzing keyword trends and generating synthetic scripts for project cycle #812.</p>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex -space-x-2">
                        <div class="w-8 h-8 rounded-full bg-ma-indigo border-2 border-ma-slate flex items-center justify-center text-[10px] text-white"><i class="fa-solid fa-bolt"></i></div>
                        <div class="w-8 h-8 rounded-full bg-ma-emerald border-2 border-ma-slate flex items-center justify-center text-[10px] text-white"><i class="fa-solid fa-brain"></i></div>
                    </div>
                    <button class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest">
                        Configure Node
                    </button>
                </div>
            </div>
        `;
    },

    renderParamTile(label, value) {
        return `
            <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p class="text-[9px] font-mono text-slate-500 uppercase mb-1">${label}</p>
                <p class="text-xs font-bold text-slate-200 uppercase tracking-tighter">${value}</p>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-microchip fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Synthetic_Workflows...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-bug"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Automation Error</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('automation')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Retry Link</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'automation') {
        Automation.init();
    }
});