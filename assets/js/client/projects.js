import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    if (e.detail.section === 'projects') {
        renderProjects();
    }
});

async function renderProjects() {
    const contentArea = document.getElementById('client-content');
    
    // Loading State
    contentArea.innerHTML = `
        <div class="flex items-center justify-center h-full min-h-[400px]">
            <div class="text-center">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-ma-indigo mb-4"></i>
                <p class="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Retrieving Project Nodes...</p>
            </div>
        </div>
    `;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user found.");

        // Fetch Projects (Orders) assigned to this user
        const projectsRef = collection(db, "orders");
        // Note: orderBy requires a composite index if used with 'where'. 
        // For simplicity and to avoid index errors initially, we filter by clientEmail or userId.
        const q = query(projectsRef, where("clientEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        const projects = [];
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });

        // HTML Shell
        let html = `
            <div class="max-w-6xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white">My Projects</h2>
                        <p class="text-slate-400 text-sm">Track the status, progress, and deliverables of your active modules.</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="px-4 py-2 bg-ma-indigo/20 text-ma-indigo border border-ma-indigo/30 hover:bg-ma-indigo hover:text-white rounded-lg text-sm font-medium transition flex items-center gap-2">
                            <i class="fa-solid fa-filter"></i> Filter
                        </button>
                        <a href="https://wa.me/923701722964" target="_blank" class="px-4 py-2 bg-ma-emerald hover:bg-emerald-400 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> New Request
                        </a>
                    </div>
                </div>
        `;

        if (projects.length === 0) {
            // Empty State
            html += `
                <div class="glass-panel rounded-3xl border border-white/5 p-16 text-center flex flex-col items-center justify-center relative overflow-hidden">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ma-indigo/5 rounded-full blur-3xl"></div>
                    
                    <div class="w-20 h-20 rounded-2xl bg-ma-slate border border-white/10 flex items-center justify-center text-slate-500 mb-6 relative z-10 shadow-2xl">
                        <i class="fa-solid fa-diagram-project text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-display font-bold text-white mb-2 relative z-10">No Active Projects</h3>
                    <p class="text-slate-400 max-w-md mx-auto mb-8 relative z-10">Your workspace is currently empty. Initiate a new project request to start architecting your digital growth.</p>
                    
                    <button class="px-8 py-3 bg-white text-black hover:bg-slate-200 rounded-xl font-bold transition relative z-10 flex items-center gap-2" onclick="window.loadSection('support')">
                        Initiate Strategy Call <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            `;
        } else {
            // Projects Grid
            html += `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
            
            projects.forEach(project => {
                const title = project.title || project.service || 'Custom Module Development';
                const status = project.status || 'Pending Setup';
                const progress = project.progress || 10; // Default 10%
                const date = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recent';
                
                // Determine Status Colors
                let statusColor = "text-slate-400 bg-slate-400/10 border-slate-400/20";
                let progressColor = "bg-slate-500";
                
                if(status.toLowerCase().includes('progress') || status.toLowerCase().includes('active')) {
                    statusColor = "text-ma-indigo bg-ma-indigo/10 border-ma-indigo/20";
                    progressColor = "bg-ma-indigo";
                } else if(status.toLowerCase().includes('completed') || status.toLowerCase().includes('delivered')) {
                    statusColor = "text-ma-emerald bg-ma-emerald/10 border-ma-emerald/20";
                    progressColor = "bg-ma-emerald";
                }

                html += `
                    <div class="glass-panel rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors group relative overflow-hidden cursor-pointer">
                        <!-- Progress Bar BG -->
                        <div class="absolute bottom-0 left-0 h-1 bg-ma-slate w-full">
                            <div class="h-full ${progressColor} transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>

                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-ma-slate border border-white/5 flex items-center justify-center text-slate-400">
                                    <i class="fa-solid fa-layer-group"></i>
                                </div>
                                <div>
                                    <h4 class="text-white font-bold truncate max-w-[200px]">${title}</h4>
                                    <p class="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">ID: #${project.id.substring(0,6)}</p>
                                </div>
                            </div>
                            <span class="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColor}">
                                ${status}
                            </span>
                        </div>

                        <p class="text-sm text-slate-400 mb-6 line-clamp-2">${project.description || 'System module is currently under development and configuration by the engineering team.'}</p>

                        <div class="flex items-center justify-between border-t border-white/5 pt-4">
                            <div class="flex items-center gap-2 text-xs text-slate-500">
                                <i class="fa-regular fa-calendar"></i> Initiated: ${date}
                            </div>
                            <div class="text-xs font-bold text-white">
                                ${progress}% <span class="text-slate-500 font-normal">Complete</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`; // Close container
        contentArea.innerHTML = html;

    } catch (error) {
        console.error("Projects Load Error:", error);
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-5xl mb-4"></i>
                <h3 class="text-white font-display font-bold text-xl mb-2">Sync Failure</h3>
                <p class="text-slate-400 text-sm mb-6">Failed to retrieve project nodes from the database.</p>
                <button onclick="window.loadSection('projects')" class="px-6 py-2 bg-ma-slate hover:bg-white/10 text-white rounded-lg border border-white/10 transition text-sm">
                    Retry Sync
                </button>
            </div>
        `;
    }
}