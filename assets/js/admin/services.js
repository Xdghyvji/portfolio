import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Services Component
 * Manages service bundles and individual digital offerings
 */
const Services = {
    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            // Fetch services and bundles
            const snap = await getDocs(collection(db, "services"));
            const servicesList = [];
            snap.forEach(doc => {
                servicesList.push({ id: doc.id, ...doc.data() });
            });

            container.innerHTML = this.renderUI();
            this.renderServices(servicesList);

        } catch (error) {
            console.error("Services Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-in fade-in duration-500">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Service Ecosystem</h2>
                        <p class="text-sm text-slate-500">Configure bundles, pricing tiers, and active digital solutions.</p>
                    </div>
                    <button class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:bg-ma-indigo/80 transition-all shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-plus"></i> New Bundle
                    </button>
                </div>

                <!-- Bundles Grid -->
                <div id="services-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Cards will be injected here -->
                </div>

                <!-- Niche Skills Management -->
                <div class="glass-panel rounded-3xl p-8 border border-white/5">
                    <h3 class="font-display font-bold text-white uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                        <i class="fa-solid fa-microchip text-ma-indigo"></i> Core Offering Parameters
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        ${this.renderSkillBadge("Web Dev", "ma-indigo")}
                        ${this.renderSkillBadge("SEO", "ma-emerald")}
                        ${this.renderSkillBadge("SMM", "ma-cyan")}
                        ${this.renderSkillBadge("AI Automation", "purple-500")}
                        ${this.renderSkillBadge("Video Editing", "rose-500")}
                        ${this.renderSkillBadge("Shopify", "ma-emerald")}
                    </div>
                </div>
            </div>
        `;
    },

    renderServices(services) {
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        if (services.length === 0) {
            // Default placeholder if database is empty
            grid.innerHTML = `
                <div class="lg:col-span-3 py-20 text-center">
                    <p class="text-slate-500 font-mono text-xs uppercase tracking-widest">No_Active_Bundles_Detected</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = services.map(service => `
            <div class="glass-panel p-6 rounded-3xl border border-white/5 group hover:border-ma-indigo/30 transition-all">
                <div class="flex justify-between items-start mb-6">
                    <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-ma-indigo border border-white/5">
                        <i class="fa-solid ${service.icon || 'fa-box'} text-xl"></i>
                    </div>
                    <span class="px-2 py-1 rounded-lg bg-ma-emerald/10 text-ma-emerald text-[10px] font-bold uppercase tracking-widest border border-ma-emerald/20">Active</span>
                </div>
                <h4 class="text-lg font-bold text-white mb-2">${service.name}</h4>
                <p class="text-xs text-slate-500 leading-relaxed mb-6 line-clamp-2">${service.description || 'No description available for this service module.'}</p>
                
                <div class="flex items-center justify-between pt-6 border-t border-white/5">
                    <span class="text-xl font-display font-bold text-white">$${service.price || '0'}</span>
                    <button class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderSkillBadge(name, color) {
        return `
            <div class="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-center group hover:border-${color}/30 transition-all cursor-default">
                <p class="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">${name}</p>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-cubes fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Mapping_Ecosystem_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-plug-circle-xmark"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Node Sync Failed</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('services')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Re-establish Link</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'services') {
        Services.init();
    }
});