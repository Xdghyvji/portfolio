import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    if (e.detail.section === 'settings') {
        renderSettings();
    }
});

async function renderSettings() {
    const contentArea = document.getElementById('client-content');
    
    // Loading State
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px]">
            <div class="text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-indigo mb-4"></i>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Decrypting Profile Data...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch User Data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Extracted Fields
        const displayName = userData.displayName || '';
        const email = userData.email || user.email || '';
        const phone = userData.phone || '';
        const dob = userData.dob || '';
        const interest = userData.interest || 'Development';
        const source = userData.source || '';

        // HTML Shell
        contentArea.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-8">
                <!-- Header -->
                <div class="mb-8">
                    <h2 class="text-2xl font-display font-bold text-white mb-2">Profile Settings</h2>
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
                            <div class="absolute top-0 right-0 w-32 h-32 bg-ma-indigo/10 rounded-full blur-2xl"></div>
                            
                            <h3 class="text-lg font-display font-bold text-white mb-6">Identity Configuration</h3>
                            
                            <div class="flex items-center gap-6 mb-8">
                                <div class="w-20 h-20 rounded-full bg-ma-slate border-2 border-ma-indigo flex items-center justify-center text-ma-indigo text-2xl relative group cursor-pointer">
                                    <i class="fa-solid fa-user"></i>
                                    <div class="absolute inset-0 bg-ma-indigo/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                                        <i class="fa-solid fa-camera text-white text-lg"></i>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="text-white font-bold">${displayName || 'Client User'}</h4>
                                    <p class="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">Role: Client</p>
                                </div>
                            </div>

                            <form id="profile-form" onsubmit="window.updateClientProfile(event)" class="space-y-5">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                        <input type="text" id="prof-name" value="${displayName}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                                        <input type="email" value="${email}" disabled class="w-full bg-ma-dark border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed text-sm" title="Email cannot be changed here.">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input type="tel" id="prof-phone" value="${phone}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                                        <input type="date" id="prof-dob" value="${dob}" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">Primary Interest</label>
                                        <select id="prof-interest" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ma-indigo transition appearance-none text-sm">
                                            <option value="Development" ${interest === 'Development' ? 'selected' : ''}>Custom Architecture & Web Development</option>
                                            <option value="Growth" ${interest === 'Growth' ? 'selected' : ''}>Digital Growth (SEO/SMM)</option>
                                            <option value="Automation" ${interest === 'Automation' ? 'selected' : ''}>AI Pipelines & Automation</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="pt-6 border-t border-white/5 mt-6 flex items-center justify-between">
                                    <span id="save-msg" class="text-xs text-ma-emerald font-bold opacity-0 transition-opacity">Profile synchronized successfully.</span>
                                    <button type="submit" id="save-btn" class="px-6 py-2.5 bg-white text-black hover:bg-slate-200 rounded-lg text-sm font-bold transition flex items-center gap-2">
                                        Save Parameters <i class="fa-solid fa-floppy-disk"></i>
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Security Block -->
                        <div class="glass-panel rounded-2xl border border-white/5 p-8 relative overflow-hidden">
                            <h3 class="text-lg font-display font-bold text-white mb-2">Security Diagnostics</h3>
                            <p class="text-xs text-slate-400 mb-6 leading-relaxed">Ensure your command center access remains secure. Update your credentials frequently to prevent unauthorized access.</p>
                            
                            <div class="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                        <i class="fa-solid fa-key"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-white">Password Override</p>
                                        <p class="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Request a secure reset link</p>
                                    </div>
                                </div>
                                <button onclick="window.requestPasswordReset()" class="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg text-xs font-bold transition">
                                    Initialize Reset
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        // Initialize inline styling fixes for dark mode date picker if needed
        const dateInput = document.getElementById('prof-dob');
        if (dateInput) {
            dateInput.style.colorScheme = 'dark';
        }

    } catch (error) {
        console.error("Settings Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Profile Decryption Failed</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve profile parameters from the database.</p>
                <button onclick="window.loadSection('settings')" class="px-6 py-2 bg-ma-slate hover:bg-white/10 text-white rounded-lg border border-white/10 transition text-sm">
                    Retry Decryption
                </button>
            </div>
        `;
    }
}

// Global functions for inline HTML event handlers
window.updateClientProfile = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    const msg = document.getElementById('save-msg');
    
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
            updatedAt: new Date().toISOString()
        });

        // Update UI Sidebars
        const nameDisplay = document.getElementById('client-name');
        if(nameDisplay) nameDisplay.innerText = newName;

        msg.classList.remove('opacity-0');
        msg.classList.add('opacity-100');
        
        setTimeout(() => {
            msg.classList.remove('opacity-100');
            msg.classList.add('opacity-0');
        }, 3000);

    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to synchronize parameters. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save Parameters <i class="fa-solid fa-floppy-disk"></i>';
    }
};

window.requestPasswordReset = function() {
    const user = auth.currentUser;
    if (user && user.email) {
        sendPasswordResetEmail(auth, user.email)
            .then(() => {
                alert(`Password reset uplink sent to ${user.email}. Check your inbox.`);
            })
            .catch((error) => {
                console.error("Error sending password reset:", error);
                alert("Failed to send override link. " + error.message);
            });
    } else {
        alert("Email verification failed. Cannot initialize reset.");
    }
};