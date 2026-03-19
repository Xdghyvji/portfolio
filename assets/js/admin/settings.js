import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, updateProfile, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Settings Component - Master Platform Configuration & Identity
 */
const Settings = {
    adminData: {},
    systemConfig: {},
    currentTab: 'profile',

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchData();

            container.innerHTML = this.renderUI();
            this.renderTabContent();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Settings Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchData() {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication node disconnected.");

        // 1. Fetch Admin Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            this.adminData = { uid: user.uid, authEmail: user.email, ...userDoc.data() };
        } else {
            this.adminData = { uid: user.uid, authEmail: user.email, displayName: user.displayName, role: 'admin' };
        }

        // 2. Fetch Global System Parameters
        const configDoc = await getDoc(doc(db, "system", "config"));
        if (configDoc.exists()) {
            this.systemConfig = configDoc.data();
        } else {
            // Default baseline if not configured yet
            this.systemConfig = {
                agencyName: "MA Digital Control Center",
                contactEmail: "mubashirarham12@gmail.com",
                supportPhone: "+92 370 1722964",
                baseCurrency: "USD",
                defaultTaxRate: 0,
                maintenanceMode: false
            };
        }
    },

    renderUI() {
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative max-w-6xl mx-auto">
                
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-sliders text-ma-indigo"></i> Global Parameters
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Configure your administrative identity, security protocols, and system-wide variables.</p>
                    </div>
                    <div class="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                        <span class="relative flex h-2.5 w-2.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-ma-emerald opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-ma-emerald"></span>
                        </span>
                        <span class="text-[10px] font-mono text-ma-emerald uppercase tracking-widest font-bold">System Online &bull; v2.4.0</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    <!-- Sidebar Navigation -->
                    <div class="lg:col-span-1 space-y-3">
                        <button onclick="window.SettingsSwitchTab('profile')" id="tab-btn-profile" class="settings-tab-btn w-full text-left px-5 py-4 rounded-2xl bg-ma-indigo/10 border border-ma-indigo/30 text-ma-indigo text-sm font-bold transition-all flex items-center justify-between group">
                            <span class="flex items-center gap-3"><i class="fa-solid fa-user-shield"></i> Master Identity</span>
                            <i class="fa-solid fa-chevron-right text-[10px] opacity-50 group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <button onclick="window.SettingsSwitchTab('system')" id="tab-btn-system" class="settings-tab-btn w-full text-left px-5 py-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 text-slate-400 hover:text-white text-sm font-bold transition-all flex items-center justify-between group">
                            <span class="flex items-center gap-3"><i class="fa-solid fa-globe"></i> Platform Config</span>
                            <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all"></i>
                        </button>
                        
                        <button onclick="window.SettingsSwitchTab('security')" id="tab-btn-security" class="settings-tab-btn w-full text-left px-5 py-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 text-slate-400 hover:text-white text-sm font-bold transition-all flex items-center justify-between group">
                            <span class="flex items-center gap-3"><i class="fa-solid fa-shield-halved"></i> Security Protocols</span>
                            <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all"></i>
                        </button>

                        <!-- Clearance Badge -->
                        <div class="mt-8 p-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 text-center relative overflow-hidden">
                            <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-400/10 blur-xl rounded-full"></div>
                            <i class="fa-solid fa-fingerprint text-3xl text-amber-400 mb-3 opacity-80"></i>
                            <p class="text-[9px] font-mono text-slate-400 uppercase tracking-[0.2em] mb-1">Clearance Level</p>
                            <h4 class="text-sm font-bold text-amber-400 uppercase tracking-widest">Omega / Primary</h4>
                        </div>
                    </div>

                    <!-- Dynamic Content Area -->
                    <div class="lg:col-span-3">
                        <div id="settings-dynamic-content" class="glass-panel rounded-3xl border border-white/5 p-8 min-h-[500px] relative overflow-hidden">
                            <!-- Tab Content Injected Here -->
                        </div>
                    </div>
                </div>

                <!-- Toast Notification Container -->
                <div id="settings-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderTabContent() {
        const contentArea = document.getElementById('settings-dynamic-content');
        if(!contentArea) return;

        // Reset Tab Buttons Styling
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.className = 'settings-tab-btn w-full text-left px-5 py-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-white/10 text-slate-400 hover:text-white text-sm font-bold transition-all flex items-center justify-between group';
            btn.querySelector('.fa-chevron-right').classList.remove('opacity-50');
            btn.querySelector('.fa-chevron-right').classList.add('opacity-0');
        });

        // Activate Current Tab Button
        const activeBtn = document.getElementById(`tab-btn-${this.currentTab}`);
        if(activeBtn) {
            activeBtn.className = 'settings-tab-btn w-full text-left px-5 py-4 rounded-2xl bg-ma-indigo/10 border border-ma-indigo/30 text-ma-indigo text-sm font-bold transition-all flex items-center justify-between group';
            activeBtn.querySelector('.fa-chevron-right').classList.remove('opacity-0');
            activeBtn.querySelector('.fa-chevron-right').classList.add('opacity-50');
        }

        // Render Content based on state
        if (this.currentTab === 'profile') {
            contentArea.innerHTML = `
                <div class="animate-[fadeIn_0.3s_ease-out]">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-ma-indigo/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 class="text-xl font-display font-bold text-white mb-6 flex items-center gap-2"><i class="fa-solid fa-address-card text-ma-indigo"></i> Identity Configuration</h3>
                    
                    <div class="flex items-center gap-6 mb-10 pb-8 border-b border-white/5">
                        <div class="w-24 h-24 rounded-full bg-ma-dark border-2 border-ma-indigo flex items-center justify-center text-ma-indigo text-3xl relative group cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                            <i class="fa-solid fa-user-astronaut"></i>
                            <div class="absolute inset-0 bg-ma-indigo/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                <i class="fa-solid fa-camera text-white text-xl"></i>
                            </div>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-2xl tracking-tight">${this.adminData.displayName || 'Administrator'}</h4>
                            <p class="text-xs text-slate-400 font-mono mt-1"><i class="fa-regular fa-envelope"></i> ${this.adminData.authEmail}</p>
                            <span class="inline-block mt-3 px-2 py-0.5 rounded bg-ma-indigo/20 text-ma-indigo border border-ma-indigo/30 text-[9px] uppercase font-bold tracking-widest">Role: ${this.adminData.role || 'Admin'}</span>
                        </div>
                    </div>

                    <form onsubmit="window.SettingsUpdateProfile(event)" class="space-y-6 relative z-10">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Display Name</label>
                                <input type="text" id="set-prof-name" value="${this.adminData.displayName || ''}" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Authentication Email</label>
                                <input type="email" value="${this.adminData.authEmail}" disabled class="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed" title="Auth email must be changed via Firebase Console.">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Mobile Number (Recovery)</label>
                                <input type="tel" id="set-prof-phone" value="${this.adminData.phone || ''}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Location / Base</label>
                                <input type="text" id="set-prof-location" value="${this.adminData.location || ''}" placeholder="e.g. Dera Ghazi Khan, PK" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-indigo focus:outline-none transition">
                            </div>
                        </div>

                        <div class="pt-6 mt-6 flex justify-end">
                            <button type="submit" id="prof-save-btn" class="px-8 py-3 rounded-xl bg-ma-indigo hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">
                                Synchronize Identity <i class="fa-solid fa-satellite-dish"></i>
                            </button>
                        </div>
                    </form>
                </div>
            `;
        } else if (this.currentTab === 'system') {
            contentArea.innerHTML = `
                <div class="animate-[fadeIn_0.3s_ease-out]">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-ma-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 class="text-xl font-display font-bold text-white mb-2 flex items-center gap-2"><i class="fa-solid fa-server text-ma-cyan"></i> Platform Configuration</h3>
                    <p class="text-xs text-slate-400 mb-8 pb-6 border-b border-white/5">These parameters are injected globally into invoices, automated emails, and client portals.</p>

                    <form onsubmit="window.SettingsUpdateSystem(event)" class="space-y-6 relative z-10">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Official Agency / Business Name</label>
                                <input type="text" id="set-sys-name" value="${this.systemConfig.agencyName || ''}" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Master Support Email</label>
                                <input type="email" id="set-sys-email" value="${this.systemConfig.contactEmail || ''}" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Official Contact Number</label>
                                <input type="tel" id="set-sys-phone" value="${this.systemConfig.supportPhone || ''}" required class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Base Currency</label>
                                <select id="set-sys-currency" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-cyan focus:outline-none transition cursor-pointer">
                                    <option value="USD" ${this.systemConfig.baseCurrency === 'USD' ? 'selected' : ''}>USD ($) - US Dollar</option>
                                    <option value="PKR" ${this.systemConfig.baseCurrency === 'PKR' ? 'selected' : ''}>PKR (Rs) - Pakistani Rupee</option>
                                    <option value="GBP" ${this.systemConfig.baseCurrency === 'GBP' ? 'selected' : ''}>GBP (£) - British Pound</option>
                                    <option value="EUR" ${this.systemConfig.baseCurrency === 'EUR' ? 'selected' : ''}>EUR (€) - Euro</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-2">Default Tax Rate (%)</label>
                                <input type="number" id="set-sys-tax" value="${this.systemConfig.defaultTaxRate || 0}" min="0" max="100" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-ma-cyan focus:outline-none transition">
                            </div>
                        </div>

                        <div class="mt-6 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5 flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-bold text-amber-400">Maintenance Mode</h4>
                                <p class="text-[10px] text-slate-400 font-mono mt-1">If enabled, client portals will display an offline message.</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="set-sys-maintenance" class="sr-only peer" ${this.systemConfig.maintenanceMode ? 'checked' : ''}>
                                <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>

                        <div class="pt-6 mt-4 flex justify-end">
                            <button type="submit" id="sys-save-btn" class="px-8 py-3 rounded-xl bg-ma-cyan text-ma-dark text-sm font-bold transition shadow-lg shadow-ma-cyan/20 flex items-center gap-2">
                                Save Platform Config <i class="fa-solid fa-check"></i>
                            </button>
                        </div>
                    </form>
                </div>
            `;
        } else if (this.currentTab === 'security') {
            contentArea.innerHTML = `
                <div class="animate-[fadeIn_0.3s_ease-out]">
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 class="text-xl font-display font-bold text-white mb-2 flex items-center gap-2"><i class="fa-solid fa-lock text-rose-500"></i> Security & Cryptography</h3>
                    <p class="text-xs text-slate-400 mb-8 pb-6 border-b border-white/5">Manage authentication vectors and session integrity.</p>

                    <div class="space-y-6 relative z-10">
                        
                        <!-- Password Reset -->
                        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shrink-0">
                                    <i class="fa-solid fa-key"></i>
                                </div>
                                <div>
                                    <h4 class="text-white font-bold mb-1">Cryptographic Key Reset</h4>
                                    <p class="text-xs text-slate-400 max-w-md">Transmit a secure payload to your master email (${this.adminData.authEmail}) to overwrite your current authentication password.</p>
                                </div>
                            </div>
                            <button onclick="window.SettingsTriggerPasswordReset()" id="sec-pwd-btn" class="shrink-0 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 text-white text-sm font-bold transition flex items-center gap-2">
                                Request Uplink <i class="fa-solid fa-envelope"></i>
                            </button>
                        </div>

                        <!-- Active Sessions Info -->
                        <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div class="flex items-start gap-4">
                                <div class="w-12 h-12 rounded-xl bg-ma-emerald/10 flex items-center justify-center text-ma-emerald border border-ma-emerald/20 shrink-0">
                                    <i class="fa-solid fa-laptop-code"></i>
                                </div>
                                <div>
                                    <h4 class="text-white font-bold mb-1">Session Integrity</h4>
                                    <p class="text-xs text-slate-400 max-w-md">Your current secure tunnel is verified. To terminate all connections across other devices, execute a global sign out.</p>
                                    <p class="text-[10px] font-mono text-ma-emerald uppercase tracking-widest mt-2">Node IP: SECURE &bull; Firebase Auth Token Valid</p>
                                </div>
                            </div>
                            <button onclick="window.handleSignOut()" class="shrink-0 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center gap-2">
                                Sever Connection <i class="fa-solid fa-power-off"></i>
                            </button>
                        </div>

                    </div>
                </div>
            `;
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-sliders fa-fade text-4xl text-ma-indigo"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Decrypting_Global_Parameters...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Parameter Decryption Failed</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('settings')" class="px-8 py-3 rounded-xl bg-ma-indigo text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-indigo/20 transition-all">Retry Link</button>
            </div>
        `;
    },

    setupGlobalHandlers() {
        
        window.SettingsToast = (msg, type = 'success') => {
            const container = document.getElementById('settings-toast-container');
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

        window.SettingsSwitchTab = (tab) => {
            Settings.currentTab = tab;
            Settings.renderTabContent();
        };

        // --- UPDATE ADMIN PROFILE ---
        window.SettingsUpdateProfile = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('prof-save-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Synchronizing...';

            try {
                const user = auth.currentUser;
                const newName = document.getElementById('set-prof-name').value;
                const newPhone = document.getElementById('set-prof-phone').value;
                const newLocation = document.getElementById('set-prof-location').value;

                // 1. Update Firebase Auth Profile
                await updateProfile(user, { displayName: newName });

                // 2. Update Firestore Document
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    displayName: newName,
                    phone: newPhone,
                    location: newLocation,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                // Update local state and UI elements outside of the component if needed
                Settings.adminData.displayName = newName;
                Settings.adminData.phone = newPhone;
                Settings.adminData.location = newLocation;
                
                const globalNameEl = document.querySelector('aside p.text-xs.font-bold');
                if(globalNameEl) globalNameEl.innerText = newName;

                window.SettingsToast("Identity parameters synchronized successfully.");
            } catch (err) {
                console.error(err);
                window.SettingsToast("Sync failed: " + err.message, "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Synchronize Identity <i class="fa-solid fa-satellite-dish"></i>';
            }
        };

        // --- UPDATE SYSTEM CONFIG ---
        window.SettingsUpdateSystem = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('sys-save-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                const configRef = doc(db, "system", "config");
                const data = {
                    agencyName: document.getElementById('set-sys-name').value,
                    contactEmail: document.getElementById('set-sys-email').value,
                    supportPhone: document.getElementById('set-sys-phone').value,
                    baseCurrency: document.getElementById('set-sys-currency').value,
                    defaultTaxRate: Number(document.getElementById('set-sys-tax').value) || 0,
                    maintenanceMode: document.getElementById('set-sys-maintenance').checked,
                    updatedAt: serverTimestamp()
                };

                await setDoc(configRef, data, { merge: true });
                Settings.systemConfig = data;

                window.SettingsToast("Platform configuration updated globally.");
            } catch (err) {
                console.error(err);
                window.SettingsToast("Config update failed.", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Save Platform Config <i class="fa-solid fa-check"></i>';
            }
        };

        // --- TRIGGER PASSWORD RESET ---
        window.SettingsTriggerPasswordReset = async () => {
            const btn = document.getElementById('sec-pwd-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';

            try {
                const email = Settings.adminData.authEmail;
                if (!email) throw new Error("No secure email found for this node.");

                await sendPasswordResetEmail(auth, email);
                window.SettingsToast(`Cryptographic reset uplink sent to ${email}. Check your inbox.`);
            } catch (err) {
                console.error(err);
                window.SettingsToast("Uplink failed: " + err.message, "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Request Uplink <i class="fa-solid fa-envelope"></i>';
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'settings') {
        Settings.init();
    }
});