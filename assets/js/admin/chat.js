import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Cloudinary
const CLOUD_NAME = "dis1ptaip";
const UPLOAD_PRESET = "mubashir";

let activeClientId = null;
let activeClientName = "";
let unsubscribeChat = null;

window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'chat') {
        renderAdminChatLayout();
    } else if (unsubscribeChat) {
        unsubscribeChat(); 
    }
});

async function renderAdminChatLayout() {
    const contentArea = document.getElementById('admin-content');
    
    // Split View Layout
    contentArea.innerHTML = `
        <div class="h-[calc(100vh-120px)] flex bg-ma-dark border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            
            <!-- Left Sidebar: Client List -->
            <div class="w-1/3 max-w-sm border-r border-white/5 bg-ma-surface/30 flex flex-col shrink-0">
                <div class="p-5 border-b border-white/5">
                    <h3 class="font-display font-bold text-white mb-3">Active Transmissions</h3>
                    <div class="relative">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                        <input type="text" placeholder="Search clients..." class="w-full bg-ma-dark border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-ma-indigo transition">
                    </div>
                </div>
                <div id="client-list" class="flex-1 overflow-y-auto custom-scroll divide-y divide-white/5">
                    <div class="p-8 text-center text-slate-500 text-xs animate-pulse">Scanning frequencies...</div>
                </div>
            </div>

            <!-- Right Area: Chat Interface -->
            <div class="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ma-surface/40 to-ma-dark">
                
                <!-- Chat Header -->
                <div id="admin-chat-header" class="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0 h-[80px]">
                    <div class="text-slate-500 font-mono text-xs uppercase tracking-widest">Select a client to intercept signals</div>
                </div>

                <!-- Messages -->
                <div id="admin-chat-messages" class="flex-1 overflow-y-auto custom-scroll p-6 space-y-4 flex flex-col">
                    <div class="m-auto text-center opacity-30">
                        <i class="fa-solid fa-satellite-dish text-6xl text-slate-500 mb-4"></i>
                        <p class="text-sm font-mono tracking-widest">AWAITING CONNECTION</p>
                    </div>
                </div>

                <!-- Input Area -->
                <div id="admin-chat-input-area" class="p-4 border-t border-white/5 bg-ma-slate/50 backdrop-blur-md shrink-0 hidden">
                    <!-- Progress Bar -->
                    <div id="admin-upload-progress" class="hidden w-full h-1 bg-ma-slate mb-2 rounded-full overflow-hidden">
                        <div id="admin-upload-bar" class="h-full bg-ma-emerald w-0 transition-all duration-300"></div>
                    </div>
                    
                    <form onsubmit="window.sendAdminMessage(event)" class="flex items-center gap-3">
                        <input type="file" id="admin-chat-file" class="hidden" onchange="window.handleAdminFileSelect(event)">
                        
                        <button type="button" onclick="document.getElementById('admin-chat-file').click()" class="w-12 h-12 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition group relative">
                            <i class="fa-solid fa-paperclip"></i>
                            <span id="admin-file-indicator" class="hidden absolute -top-1 -right-1 w-3 h-3 bg-ma-emerald rounded-full"></span>
                        </button>
                        
                        <input type="text" id="admin-chat-input" placeholder="Transmit secure reply..." class="flex-1 bg-ma-dark border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                        
                        <button type="submit" id="admin-send-btn" class="w-14 h-12 shrink-0 rounded-xl bg-ma-indigo hover:bg-indigo-400 text-white flex items-center justify-center transition shadow-lg shadow-ma-indigo/20">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    loadClientList();
}

async function loadClientList() {
    const listEl = document.getElementById('client-list');
    
    try {
        // Fetch all users with role 'client'
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "client"));
        const snapshot = await getDocs(q);
        
        listEl.innerHTML = '';
        
        if (snapshot.empty) {
            listEl.innerHTML = `<div class="p-6 text-center text-xs text-slate-500">No client nodes found.</div>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const clientId = doc.id;
            const name = data.displayName || 'Unknown Node';
            
            listEl.innerHTML += `
                <div onclick="window.openAdminChat('${clientId}', '${name}')" class="p-4 hover:bg-white/5 cursor-pointer transition flex items-center gap-4 group border-l-2 border-transparent hover:border-ma-indigo">
                    <div class="relative shrink-0">
                        <div class="w-10 h-10 rounded-full bg-ma-slate border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-ma-indigo group-hover:border-ma-indigo/30 transition">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-500 rounded-full border-2 border-ma-dark"></div>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="text-sm font-bold text-white truncate">${name}</h4>
                        <p class="text-[10px] text-slate-500 font-mono uppercase truncate mt-0.5">UID: ${clientId.substring(0,6)}</p>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error(e);
        listEl.innerHTML = `<div class="p-6 text-center text-xs text-rose-500">Error fetching nodes.</div>`;
    }
}

window.openAdminChat = function(clientId, clientName) {
    activeClientId = clientId;
    activeClientName = clientName;
    
    // Update Header
    document.getElementById('admin-chat-header').innerHTML = `
        <div class="flex items-center gap-3">
            <h2 class="text-lg font-display font-bold text-white">${clientName}</h2>
            <span class="px-2 py-0.5 rounded bg-ma-indigo/20 text-ma-indigo border border-ma-indigo/30 text-[9px] uppercase font-bold tracking-widest">Connected</span>
        </div>
        <button class="text-slate-400 hover:text-white transition"><i class="fa-solid fa-ellipsis-vertical"></i></button>
    `;

    // Show Input area
    document.getElementById('admin-chat-input-area').classList.remove('hidden');

    // Attach Listener
    if (unsubscribeChat) unsubscribeChat();

    const messagesBox = document.getElementById('admin-chat-messages');
    const q = query(collection(db, "messages"), where("clientId", "==", clientId));
    
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        let msgs = [];
        snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        messagesBox.innerHTML = '';
        
        if (msgs.length === 0) {
            messagesBox.innerHTML = `
                <div class="m-auto text-center opacity-50">
                    <i class="fa-regular fa-comments text-4xl text-slate-500 mb-3"></i>
                    <p class="text-sm text-slate-400">Secure channel opened with ${clientName}.</p>
                </div>
            `;
            return;
        }

        msgs.forEach(msg => {
            const isAdmin = msg.sender === 'admin';
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let contentHtml = '';
            
            if (msg.fileUrl) {
                if (msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.fileType?.includes('image')) {
                    contentHtml += `<a href="${msg.fileUrl}" target="_blank"><img src="${msg.fileUrl}" class="max-w-[200px] rounded-lg mb-2 border border-white/10"></a>`;
                } else if (msg.fileUrl.match(/\.(mp4|webm)$/i) || msg.fileType?.includes('video')) {
                    contentHtml += `<video src="${msg.fileUrl}" controls class="max-w-[250px] rounded-lg mb-2 border border-white/10"></video>`;
                } else {
                    contentHtml += `<a href="${msg.fileUrl}" target="_blank" class="flex items-center gap-2 p-3 bg-black/20 rounded-lg mb-2 border border-white/5"><i class="fa-solid fa-file-arrow-down text-xl"></i><p class="text-xs font-bold underline">Download File</p></a>`;
                }
            }
            if (msg.text) contentHtml += `<p class="text-sm leading-relaxed">${msg.text}</p>`;

            messagesBox.innerHTML += `
                <div class="flex w-full ${isAdmin ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.2s_ease]">
                    <div class="flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-[75%]">
                        <div class="px-5 py-3 rounded-2xl ${isAdmin ? 'bg-ma-emerald text-ma-dark rounded-tr-sm font-medium' : 'bg-ma-slate border border-white/5 text-slate-200 rounded-tl-sm'} shadow-lg">
                            ${contentHtml}
                        </div>
                        <span class="text-[10px] text-slate-500 mt-1 font-mono">${time} &bull; ${isAdmin ? 'You' : clientName}</span>
                    </div>
                </div>
            `;
        });
        messagesBox.scrollTop = messagesBox.scrollHeight;
    });
}

// Global scope for Admin HTML handlers
let adminSelectedFile = null;

window.handleAdminFileSelect = function(e) {
    const file = e.target.files[0];
    if (file) {
        adminSelectedFile = file;
        document.getElementById('admin-file-indicator').classList.remove('hidden');
        document.getElementById('admin-chat-input').placeholder = `Attached: ${file.name}`;
    }
};

window.sendAdminMessage = async function(e) {
    e.preventDefault();
    if (!activeClientId) return;

    const input = document.getElementById('admin-chat-input');
    const btn = document.getElementById('admin-send-btn');
    const text = input.value.trim();
    
    if (!text && !adminSelectedFile) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    let fileUrl = null;
    let fileType = null;

    try {
        if (adminSelectedFile) {
            document.getElementById('admin-upload-progress').classList.remove('hidden');
            document.getElementById('admin-upload-bar').style.width = '50%';
            
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
            const fd = new FormData();
            fd.append('file', adminSelectedFile);
            fd.append('upload_preset', UPLOAD_PRESET);
            
            const res = await fetch(url, { method: 'POST', body: fd });
            const data = await res.json();
            
            fileUrl = data.secure_url;
            fileType = data.resource_type;
            
            document.getElementById('admin-upload-bar').style.width = '100%';
            setTimeout(() => {
                document.getElementById('admin-upload-progress').classList.add('hidden');
                document.getElementById('admin-upload-bar').style.width = '0%';
            }, 500);
        }

        await addDoc(collection(db, "messages"), {
            clientId: activeClientId,
            clientName: activeClientName,
            sender: 'admin',
            text: text,
            fileUrl: fileUrl,
            fileType: fileType,
            timestamp: new Date().toISOString()
        });

        // Reset
        input.value = '';
        adminSelectedFile = null;
        document.getElementById('admin-file-indicator').classList.add('hidden');
        document.getElementById('admin-chat-file').value = '';
        input.placeholder = "Transmit secure reply...";

    } catch (error) {
        console.error("Message Error:", error);
        alert("Transmission Failed.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    }
};