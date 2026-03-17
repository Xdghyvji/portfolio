import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
 * Settings Component
 * Manages global platform variables, social integration, and system toggles
 */
const Settings = {
    currentConfig: null,

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            // Fetch global configuration node
            const docRef = doc(db, "settings", "global_config");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                this.currentConfig = docSnap.data();
            } else {
                // Initialize default config if none exists
                this.currentConfig = this.getDefaultConfig();
                await setDoc(docRef, this.currentConfig);
            }

            container.innerHTML = this.renderUI();
            this.setupListeners();

        } catch (error) {
            console.error("Settings Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    getDefaultConfig() {
        return {
            siteName: "Mubashir Arham",
            maintenanceMode: false,
            allowRegistration: true,
            contactEmail: "mubashirarham12@gmail.com",
            whatsapp: "923701722964",
            socials: {
                instagram: "get_grow_up",
                facebook: "mubashirthevideoeditor",
                github: "Xdghyvji"
            }
        };
    },

    renderUI() {
        const c = this.currentConfig;
        return `
            <div class="space-y-8 animate-in fade-in duration-500 pb-20">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight">Platform Config</h2>
                        <p class="text-sm text-slate-500">Fine-tuning global ecosystem parameters and administrative overrides.</p>
                    </div>
                    <button id="save-settings-btn" class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest hover:bg-ma-indigo/80 transition-all shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Push Changes
                    </button>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Global Identity -->
                    <div class="lg:col-span-2 space-y-6">
                        <div class="glass-panel rounded-3xl p-8 border border-white/5">
                            <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                                <i class="fa-solid fa-id-card text-ma-indigo"></i> Global Identity
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">Display_Name</label>
                                    <input type="text" id="set-siteName" value="${c.siteName}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">Contact_Email</label>
                                    <input type="email" id="set-contactEmail" value="${c.contactEmail}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">WhatsApp_Uplink</label>
                                    <input type="text" id="set-whatsapp" value="${c.whatsapp}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                            </div>
                        </div>

                        <!-- System Overrides -->
                        <div class="glass-panel rounded-3xl p-8 border border-white/5">
                            <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                                <i class="fa-solid fa-sliders text-ma-indigo"></i> System Overrides
                            </h3>
                            <div class="space-y-4">
                                ${this.renderToggle("Maintenance Mode", "maintenanceMode", c.maintenanceMode, "Disable public access for updates")}
                                ${this.renderToggle("Allow Registration", "allowRegistration", c.allowRegistration, "Enable new client node linking")}
                            </div>
                        </div>
                    </div>

                    <!-- Social Nodes -->
                    <div class="space-y-6">
                        <div class="glass-panel rounded-3xl p-8 border border-white/5">
                            <h3 class="text-white font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                                <i class="fa-solid fa-share-nodes text-ma-indigo"></i> Social Nodes
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">Instagram_Handle</label>
                                    <input type="text" id="set-social-instagram" value="${c.socials.instagram}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">GitHub_ID</label>
                                    <input type="text" id="set-social-github" value="${c.socials.github}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono text-slate-500 uppercase mb-2">Facebook_Slug</label>
                                    <input type="text" id="set-social-facebook" value="${c.socials.facebook}" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-indigo/50">
                                </div>
                            </div>
                        </div>

                        <!-- API Key Status -->
                        <div class="glass-panel rounded-3xl p-6 border border-white/5 bg-ma-indigo/5">
                             <div class="flex items-center justify-between mb-4">
                                <span class="text-[10px] font-mono text-ma-indigo uppercase font-bold">API_Handshake</span>
                                <span class="w-2 h-2 rounded-full bg-ma-emerald animate-pulse"></span>
                             </div>
                             <p class="text-xs text-slate-400 mb-4">Stripe, OpenAI, and Firebase nodes are currently synchronized.</p>
                             <button class="w-full py-2 rounded-xl border border-ma-indigo/20 text-[10px] font-bold text-ma-indigo uppercase tracking-widest hover:bg-ma-indigo/10 transition-all">
                                Rotate Keys
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderToggle(label, id, isActive, desc) {
        return `
            <div class="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div>
                    <p class="text-sm font-bold text-slate-200">${label}</p>
                    <p class="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">${desc}</p>
                </div>
                <button onclick="this.classList.toggle('bg-ma-indigo'); this.classList.toggle('bg-slate-700')" class="w-12 h-6 rounded-full ${isActive ? 'bg-ma-indigo' : 'bg-slate-700'} relative transition-colors" id="toggle-${id}">
                    <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-6' : ''}"></div>
                </button>
            </div>
        `;
    },

    setupListeners() {
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Syncing...`;
                saveBtn.disabled = true;

                const updated = {
                    siteName: document.getElementById('set-siteName').value,
                    contactEmail: document.getElementById('set-contactEmail').value,
                    whatsapp: document.getElementById('set-whatsapp').value,
                    socials: {
                        instagram: document.getElementById('set-social-instagram').value,
                        github: document.getElementById('set-social-github').value,
                        facebook: document.getElementById('set-social-facebook').value
                    }
                    // Toggles would be read here in a full implementation
                };

                try {
                    await updateDoc(doc(db, "settings", "global_config"), updated);
                    saveBtn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Nodes Synced`;
                    setTimeout(() => {
                        saveBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Push Changes`;
                        saveBtn.disabled = false;
                    }, 2000);
                } catch (e) {
                    console.error(e);
                    saveBtn.innerHTML = `Error`;
                    saveBtn.disabled = false;
                }
            };
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-sliders fa-spin text-3xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Accessing_System_Core...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mb-4 border border-rose-500/20">
                    <i class="fa-solid fa-shield-virus"></i>
                </div>
                <h3 class="text-white font-display font-bold text-lg mb-2">Core Access Denied</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('settings')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest">Re-verify Keys</button>
            </div>
        `;
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'settings') {
        Settings.init();
    }
});