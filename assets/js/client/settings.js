import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

/**
 * Client Settings Component - Advanced Identity & Security Parameters
 */
const Settings = {
    userData: {},

    async init() {
        const container = document.getElementById('client-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchData();

            container.innerHTML = this.renderUI();
            this.setupGlobalHandlers();

            // Initialize inline styling fixes for dark mode date picker if needed
            const dateInput = document.getElementById('prof-dob');
            if (dateInput) {
                dateInput.style.colorScheme = 'dark';
            }

        } catch (error) {
            console.error("Settings Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchData() {
        const user = auth.currentUser;
        if (!user) throw new Error("Authentication node disconnected.");

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        this.userData = userDoc.exists() ? userDoc.data() : {};
        
        // Ensure email fallback
        this.userData.email = this.userData.email || user.email || '';
    },

    renderUI() {
        const displayName = this.userData.displayName || '';
        const email = this.userData.email || '';
        const phone = this.userData.phone || '';
        const dob = this.userData.dob || '';
        const interest = this.userData.interest || 'Development';

        return `
            <div class="max-w-4xl mx-auto space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header -->
                <div class="mb-8">
                    <h2 class="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                        <i class="fa-solid fa-sliders text-ma-indigo"></i> Profile Settings
                    </h2>
                    <p class="text-slate-400 text-sm">Manage your identity, contact details, and platform preferences.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    <!-- Left Sidebar / Navigation -->
                    <div class="md:col-span-1 space-y-2">
                        <button class="w-full text-left px-4 py-3 rounded-xl bg-ma-indigo/10 border border-ma-indigo/30 text-ma-indigo text-sm font-bold transition flex items-center gap-3">
                            <i class="fa-solid fa-user-astronaut"></i> General Identity
                        </button>
                        <button class="w-full text-left px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 border border-transparent text-slate-400 hover:text-white text-sm font-medium transition flex items-center gap-3">
                            <i class="fa-solid fa-shield-halved"></i> Security & Auth
                        </button>
                        <button class="w-full text-left px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 border border-transparent text-slate-400 hover:text-white text-sm font-medium transition flex items-center gap-3">
                            <i class="fa-solid fa-bell"></i> Notifications
                        </button>
                    </div>

                    <!-- Right Content Area (Form) -->
                    <div class="md:col-span-2 space-y-6">
                        
                        <!-- Avatar & Basic Identity -->
                        <div class="glass-panel rounded-2xl border border-white/5 p-8 relative overflow-hidden">
                            <div class="absolute -right-10 -top-10 w-48 h-48 bg-ma-indigo/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <h3 class="text-lg font-display font-bold text-white mb-6 relative z-10">Identity Configuration</h3>
                            
                            <div class="flex items-center gap-6 mb-8 relative z-10">
                                <div class="w-20 h-20 rounded-full bg-ma-slate border-2 border-ma-indigo flex items-center justify-center text-ma-indigo text-2xl relative group cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    <i class="fa-solid fa-user"></i>
                                    <div class="absolute inset-0 bg-ma-indigo/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                        <i class="fa-solid fa-camera text-white text-lg"></i>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="text-white font-bold text-xl">${displayName || 'Client User'}</h4>
                                    <p class="text-[10px] text-ma-indigo font-mono tracking-widest uppercase mt-1 px-2 py-0.5 bg-ma-indigo/10 border border-ma-indigo/20 rounded inline-block">Role: Client</p>
                                </div>
                            </div>

                            <form id="profile-form" onsubmit="window.SettingsUpdateProfile(event)" class="space-y-5 relative z-10">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                        <input type="text" id="prof-name" value="${displayName}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input type="email" value="${email}" disabled class="w-full bg-ma-dark border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed text-sm" title="Email cannot be changed here.">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input type="tel" id="prof-phone" value="${phone}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                                        <input type="date" id="prof-dob" value="${dob}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Primary Interest</label>
                                        <select id="prof-interest" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition appearance-none text-sm cursor-pointer">
                                            <option value="Development" ${interest === 'Development' ? 'selected' : ''}>Custom Architecture & Web Development</option>
                                            <option value="Growth" ${interest === 'Growth' ? 'selected' : ''}>Digital Growth (SEO/SMM)</option>
                                            <option value="Automation" ${interest === 'Automation' ? 'selected' : ''}>AI Pipelines & Automation</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="pt-6 border-t border-white/5 mt-6 flex justify-end">
                                    <button type="submit" id="save-btn" class="px-6 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-ma-indigo/20 flex items-center gap-2">
                                        Save Parameters <i class="fa-solid fa-floppy-disk"></i>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Security Block -->
                        <div class="glass-panel rounded-2xl border border-white/5 p-8 relative overflow-hidden">
                            <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <h3 class="text-lg font-display font-bold text-white mb-2 relative z-10"><i class="fa-solid fa-shield-virus text-rose-500 mr-2"></i> Security Diagnostics</h3>
                            <p class="text-xs text-slate-400 mb-6 leading-relaxed relative z-10">Ensure your command center access remains secure. Update your credentials frequently to prevent unauthorized access.</p>
                            
                            <div class="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-white/10 bg-white/[0.02] relative z-10 gap-4">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
                                        <i class="fa-solid fa-key text-lg"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white">Password Override</p>
                                        <p class="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Request a secure reset link</p>
                                    </div>
                                </div>
                                <button onclick="window.SettingsRequestPasswordReset()" id="reset-btn" class="w-full md:w-auto px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                                    Initialize Reset <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Toast Notification Container -->
                <div id="settings-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderLoading() {
        return `
            <div class="flex items-center justify-center h-full min-h-[400px]">
                <div class="text-center">
                    <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-indigo mb-4"></i>
                    <p class="text-slate-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Decrypting Profile Data...</p>
                </div>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
                <div class="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-2xl mb-4 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Profile Decryption Failed</h3>
                <p class="text-slate-400 text-sm mb-6 max-w-xs">Failed to retrieve identity parameters. Please verify your connection.</p>
                <button onclick="window.loadSection('settings')" class="px-6 py-2.5 bg-ma-indigo hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-ma-indigo/20 transition text-xs font-bold uppercase tracking-widest">
                    Retry Decryption
                </button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // GLOBAL HANDLERS
    // ------------------------------------------------------------------------
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

        window.SettingsUpdateProfile = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-btn');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';

            try {
                const user = auth.currentUser;
                if (!user) throw new Error("No user logged in.");

                const newName = document.getElementById('prof-name').value;
                const newPhone = document.getElementById('prof-phone').value;
                const newDob = document.getElementById('prof-dob').value;
                const newInterest = document.getElementById('prof-interest').value;

                const userRef = doc(db, "users", user.uid);
                
                await updateDoc(userRef, {
                    displayName: newName,
                    phone: newPhone,
                    dob: newDob,
                    interest: newInterest,
                    updatedAt: serverTimestamp()
                });

                // Update UI Sidebars quietly
                const nameDisplay = document.getElementById('client-name');
                if(nameDisplay) nameDisplay.innerText = newName;
                
                Settings.userData.displayName = newName;
                Settings.userData.phone = newPhone;
                Settings.userData.dob = newDob;
                Settings.userData.interest = newInterest;

                window.SettingsToast("Profile parameters synchronized successfully.");

            } catch (error) {
                console.error("Error updating profile:", error);
                window.SettingsToast("Failed to synchronize parameters.", "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Save Parameters <i class="fa-solid fa-floppy-disk"></i>';
            }
        };

        window.SettingsRequestPasswordReset = function() {
            const user = auth.currentUser;
            const btn = document.getElementById('reset-btn');
            
            if (user && user.email) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Transmitting...';

                sendPasswordResetEmail(auth, user.email)
                    .then(() => {
                        window.SettingsToast(`Secure override uplink sent to ${user.email}. Check your inbox.`);
                    })
                    .catch((error) => {
                        console.error("Error sending password reset:", error);
                        window.SettingsToast("Failed to send override link: " + error.message, "error");
                    })
                    .finally(() => {
                        btn.disabled = false;
                        btn.innerHTML = 'Initialize Reset <i class="fa-solid fa-paper-plane"></i>';
                    });
            } else {
                window.SettingsToast("Verification failed. Cannot initialize reset.", "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('client-section-load', (e) => {
    if (e.detail.section === 'settings') {
        Settings.init();
    }
});