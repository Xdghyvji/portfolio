import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app",
    messagingSenderId: "473586363516",
    appId: "1:473586363516:web:d7b9db91eba86f8809adf9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const Campaigns = {
    allCampaigns: [],
    availableLeads: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchData();
            container.innerHTML = this.renderUI();
            this.renderCampaignsTable();
            this.setupGlobalHandlers();
        } catch (error) {
            console.error("Campaigns Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchData() {
        // Fetch past campaigns
        const campSnap = await getDocs(collection(db, "campaigns"));
        this.allCampaigns = [];
        campSnap.forEach(doc => {
            this.allCampaigns.push({ id: doc.id, ...doc.data() });
        });
        this.allCampaigns.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // Fetch all leads for audience targeting
        const leadsSnap = await getDocs(collection(db, "leads"));
        this.availableLeads = [];
        leadsSnap.forEach(doc => {
            this.availableLeads.push({ id: doc.id, ...doc.data() });
        });
    },

    getStats() {
        const totalCampaigns = this.allCampaigns.length;
        let totalEmailsSent = 0;
        this.allCampaigns.forEach(c => totalEmailsSent += (c.sentCount || 0));
        const totalLeads = this.availableLeads.length;

        return { totalCampaigns, totalEmailsSent, totalLeads };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative max-w-6xl mx-auto">
                
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-satellite-dish text-ma-emerald"></i> Broadcast Engine
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Deploy AI-personalized mass email campaigns directly to your CRM pipeline.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="window.CampaignsOpenComposer()" class="px-5 py-2.5 bg-ma-emerald hover:bg-emerald-500 text-ma-dark rounded-xl text-xs font-bold shadow-lg shadow-ma-emerald/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-paper-plane"></i> Launch Broadcast
                        </button>
                        <button onclick="window.loadSection('campaigns')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-emerald transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Campaigns</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.totalCampaigns}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Emails Dispatched</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.totalEmailsSent}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-envelope-circle-check"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Addressable Audience</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">${stats.totalLeads}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-users-viewfinder"></i></div>
                    </div>
                </div>

                <div class="glass-panel rounded-3xl border border-white/5 flex flex-col min-h-[400px]">
                    <div class="p-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 class="text-sm font-display font-bold text-white uppercase tracking-widest flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-slate-500"></i> Transmission Log</h3>
                    </div>
                    <div class="overflow-x-auto custom-scroll flex-1 bg-ma-dark/20 p-6">
                        <div id="campaigns-grid" class="space-y-3">
                            </div>
                    </div>
                </div>

                <div id="campaigns-modal-container"></div>
                <div id="campaigns-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderCampaignsTable() {
        const grid = document.getElementById('campaigns-grid');
        if (!grid) return;

        if (this.allCampaigns.length === 0) {
            grid.innerHTML = `
                <div class="py-12 text-center">
                    <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-tower-broadcast"></i>
                    </div>
                    <p class="text-slate-400 font-bold">No broadcasts deployed.</p>
                    <p class="text-xs text-slate-600 mt-1">Initialize your first AI email campaign.</p>
                </div>`;
            return;
        }

        grid.innerHTML = this.allCampaigns.map(camp => {
            const dateStr = camp.createdAt ? new Date(camp.createdAt.seconds * 1000).toLocaleString() : 'Legacy';
            return `
            <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-white">${camp.name || 'Unnamed Campaign'}</h4>
                        <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Audience: ${camp.target || 'All Leads'} &bull; Sent: ${camp.sentCount || 0}</p>
                    </div>
                </div>
                <div class="text-right hidden sm:block">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">Deployed</p>
                    <p class="text-xs text-slate-300 font-mono">${dateStr}</p>
                </div>
            </div>
            `;
        }).join('');
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-satellite-dish fa-fade text-4xl text-ma-emerald"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Initializing_Comms_Array...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Array Offline</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
            </div>
        `;
    },

    setupGlobalHandlers() {
        
        window.CampaignsToast = (msg, type = 'success') => {
            const container = document.getElementById('campaigns-toast-container');
            if(!container) return;
            const color = type === 'success' ? 'ma-emerald' : 'rose-500';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
            const toast = document.createElement('div');
            toast.className = `bg-ma-dark border border-${color}/30 text-white px-4 py-3 rounded-xl shadow-2xl shadow-black flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]`;
            toast.innerHTML = `<i class="fa-solid ${icon} text-${color}"></i><span class="text-sm font-medium">${msg}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        window.CampaignsCloseModal = () => {
            const container = document.getElementById('campaigns-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- OPEN CAMPAIGN COMPOSER MODAL ---
        window.CampaignsOpenComposer = () => {
            const container = document.getElementById('campaigns-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-ma-emerald/20 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col max-h-[90vh] overflow-hidden">
                        
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-wand-magic-sparkles text-ma-emerald"></i> AI Campaign Composer</h3>
                            <button onclick="window.CampaignsCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        
                        <form onsubmit="window.CampaignsExecuteBroadcast(event)" class="flex-1 overflow-y-auto custom-scroll flex flex-col p-6 space-y-6">
                            
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Campaign Name (Internal)</label>
                                <input type="text" id="cmp-name" required placeholder="e.g. Q4 SEO Upsell" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Target Audience</label>
                                    <select id="cmp-target" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none cursor-pointer">
                                        <option value="all">All CRM Leads</option>
                                        <option value="new">Unprocessed Leads Only</option>
                                        <option value="Growth (SEO/SMM)">Interest: Growth / SEO</option>
                                        <option value="Development">Interest: Web Development</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Sender Name</label>
                                    <input type="text" id="cmp-sender" required value="Mubashir Arham" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                                </div>
                            </div>

                            <div class="flex-1 flex flex-col">
                                <label class="block text-[10px] font-mono uppercase text-ma-emerald tracking-widest mb-1.5 flex items-center gap-2"><i class="fa-solid fa-brain"></i> Prompt Instructions for AI</label>
                                <textarea id="cmp-prompt" required rows="6" class="w-full bg-black/40 border border-ma-emerald/30 rounded-xl p-4 text-slate-300 text-sm focus:border-ma-emerald focus:outline-none transition resize-none custom-scroll leading-relaxed" placeholder="e.g. Pitch our new $899 Developer Suite. Mention that we noticed their previous interest in building a web app. Offer a free 15-minute consultation call."></textarea>
                                <p class="text-[9px] text-slate-500 mt-2 italic">Gemini will automatically personalize the email subject, intro, and body for every single lead based on this prompt.</p>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-auto shrink-0">
                                <button type="button" onclick="window.CampaignsCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                                <button type="submit" id="cmp-btn" class="px-6 py-2.5 rounded-xl bg-ma-emerald hover:bg-emerald-500 text-ma-dark text-sm font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">Initiate Launch Sequence <i class="fa-solid fa-rocket"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        // --- EXECUTE BROADCAST VIA NETLIFY ---
        window.CampaignsExecuteBroadcast = async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('cmp-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Transmitting to AI Core...';

            const targetFilter = document.getElementById('cmp-target').value;
            const campaignName = document.getElementById('cmp-name').value;
            const promptText = document.getElementById('cmp-prompt').value;
            const senderName = document.getElementById('cmp-sender').value;

            // Filter leads based on selection
            let targetLeads = [];
            if (targetFilter === 'all') {
                targetLeads = Campaigns.availableLeads;
            } else if (targetFilter === 'new') {
                targetLeads = Campaigns.availableLeads.filter(l => l.status === 'new');
            } else {
                targetLeads = Campaigns.availableLeads.filter(l => l.goal === targetFilter);
            }

            // Validations
            if (targetLeads.length === 0) {
                window.CampaignsToast("No leads found for that target audience.", "error");
                btn.disabled = false;
                btn.innerHTML = 'Initiate Launch Sequence <i class="fa-solid fa-rocket"></i>';
                return;
            }

            // Ensure leads have emails
            targetLeads = targetLeads.filter(l => l.email && l.email.includes('@'));

            try {
                // Send payload to Netlify Function
                const response = await fetch('/.netlify/functions/send-broadcast', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leads: targetLeads,
                        campaignPrompt: promptText,
                        senderName: senderName
                    })
                });

                if (!response.ok) throw new Error("Transmission failed at the server level.");
                const result = await response.json();

                // Log campaign success in Firestore
                await addDoc(collection(db, "campaigns"), {
                    name: campaignName,
                    target: targetFilter,
                    prompt: promptText,
                    sentCount: result.stats.sent,
                    failedCount: result.stats.failed,
                    createdAt: serverTimestamp()
                });

                window.CampaignsCloseModal();
                window.CampaignsToast(`Transmission Successful. Sent: ${result.stats.sent}, Failed: ${result.stats.failed}`);
                Campaigns.init(); // Refresh UI

            } catch (err) {
                console.error(err);
                window.CampaignsToast(err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initiate Launch Sequence <i class="fa-solid fa-rocket"></i>';
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'campaigns') {
        Campaigns.init();
    }
});