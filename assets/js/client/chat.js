import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJkblVV3jToAZ2FjLMhKUXY8HT7o7zQHY",
    authDomain: "portfolio-8e083.firebaseapp.com",
    projectId: "portfolio-8e083",
    storageBucket: "portfolio-8e083.firebasestorage.app",
    messagingSenderId: "473586363516",
    appId: "1:473586363516:web:d7b9db91eba86f8809adf9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudinary Configuration
const CLOUD_NAME = "dis1ptaip";
const UPLOAD_PRESET = "mubashir";

let unsubscribeChat = null;

window.addEventListener('client-section-load', (e) => {
    if (e.detail.section === 'chat') {
        renderChat();
    } else if (unsubscribeChat) {
        unsubscribeChat(); // Cleanup listener when leaving page
    }
});

async function renderChat() {
    const contentArea = document.getElementById('client-content');
    const user = auth.currentUser;
    if (!user) return;

    // Shell UI
    contentArea.innerHTML = `
        <div class="max-w-5xl mx-auto h-[calc(100vh-120px)] flex flex-col glass-panel rounded-3xl border border-white/5 overflow-hidden relative">
            
            <!-- Chat Header -->
            <div class="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0 z-10">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-full bg-ma-indigo/20 flex items-center justify-center text-ma-indigo border border-ma-indigo/30">
                            <i class="fa-solid fa-headset text-xl"></i>
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-ma-emerald rounded-full border-2 border-ma-dark"></div>
                    </div>
                    <div>
                        <h2 class="text-lg font-display font-bold text-white leading-tight">Mubashir Arham</h2>
                        <p class="text-xs text-ma-emerald font-mono tracking-widest uppercase">Online &bull; Command Center</p>
                    </div>
                </div>
                <div class="hidden md:flex gap-3">
                    <button class="w-10 h-10 rounded-xl bg-ma-slate hover:bg-white/10 flex items-center justify-center text-slate-400 transition" title="Video Call (Coming Soon)"><i class="fa-solid fa-video"></i></button>
                    <button class="w-10 h-10 rounded-xl bg-ma-slate hover:bg-white/10 flex items-center justify-center text-slate-400 transition" title="Call (Coming Soon)"><i class="fa-solid fa-phone"></i></button>
                </div>
            </div>

            <!-- Chat History Area -->
            <div id="chat-messages" class="flex-1 overflow-y-auto custom-scroll p-6 space-y-4 flex flex-col bg-gradient-to-b from-transparent to-ma-slate/30">
                <!-- Messages will load here -->
            </div>

            <!-- Upload Progress Bar (Hidden by default) -->
            <div id="upload-progress-container" class="hidden w-full h-1 bg-ma-slate">
                <div id="upload-progress-bar" class="h-full bg-ma-emerald w-0 transition-all duration-300"></div>
            </div>

            <!-- Input Area -->
            <div class="p-4 border-t border-white/5 bg-ma-slate/80 backdrop-blur-md shrink-0">
                <form id="chat-form" onsubmit="window.sendMessage(event)" class="flex items-center gap-3">
                    
                    <input type="file" id="chat-file" class="hidden" onchange="window.handleFileSelect(event)">
                    
                    <button type="button" onclick="document.getElementById('chat-file').click()" class="w-12 h-12 shrink-0 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition group relative">
                        <i class="fa-solid fa-paperclip"></i>
                        <span id="file-indicator" class="hidden absolute -top-1 -right-1 w-3 h-3 bg-ma-emerald rounded-full"></span>
                    </button>
                    
                    <input type="text" id="chat-input" placeholder="Type a secure message..." class="flex-1 bg-ma-dark border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-ma-indigo transition text-sm">
                    
                    <button type="submit" id="send-btn" class="w-14 h-12 shrink-0 rounded-xl bg-ma-indigo hover:bg-indigo-400 text-white flex items-center justify-center transition shadow-lg shadow-ma-indigo/20">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    // Initialize Realtime Listener
    const messagesBox = document.getElementById('chat-messages');
    
    // We fetch all messages for this client. Sorting is done in JS to avoid requiring composite indexes.
    const q = query(collection(db, "messages"), where("clientId", "==", user.uid));
    
    unsubscribeChat = onSnapshot(q, (snapshot) => {
        let msgs = [];
        snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
        
        // Sort by timestamp
        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        messagesBox.innerHTML = '';
        
        if (msgs.length === 0) {
            messagesBox.innerHTML = `
                <div class="m-auto text-center opacity-50">
                    <i class="fa-solid fa-shield-halved text-4xl text-slate-500 mb-3"></i>
                    <p class="text-sm text-slate-400">End-to-end encrypted connection established.<br>Start the conversation.</p>
                </div>
            `;
            return;
        }

        msgs.forEach(msg => {
            const isClient = msg.sender === 'client';
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let contentHtml = '';
            
            // Handle Media/Files
            if (msg.fileUrl) {
                if (msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.fileType?.includes('image')) {
                    contentHtml += `<a href="${msg.fileUrl}" target="_blank"><img src="${msg.fileUrl}" class="max-w-[200px] rounded-lg mb-2 border border-white/10 cursor-zoom-in"></a>`;
                } else if (msg.fileUrl.match(/\.(mp4|webm)$/i) || msg.fileType?.includes('video')) {
                    contentHtml += `<video src="${msg.fileUrl}" controls class="max-w-[250px] rounded-lg mb-2 border border-white/10"></video>`;
                } else {
                    contentHtml += `
                        <a href="${msg.fileUrl}" target="_blank" class="flex items-center gap-2 p-3 bg-black/20 rounded-lg mb-2 hover:bg-black/40 transition border border-white/5">
                            <i class="fa-solid fa-file-arrow-down text-2xl"></i>
                            <div class="text-left">
                                <p class="text-xs font-bold underline">Download Attachment</p>
                            </div>
                        </a>
                    `;
                }
            }
            
            // Handle Text
            if (msg.text) {
                contentHtml += `<p class="text-sm leading-relaxed">${msg.text}</p>`;
            }

            // Message Bubble wrapper
            messagesBox.innerHTML += `
                <div class="flex w-full ${isClient ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease]">
                    <div class="flex flex-col ${isClient ? 'items-end' : 'items-start'} max-w-[75%]">
                        <div class="px-5 py-3 rounded-2xl ${isClient ? 'bg-ma-indigo text-white rounded-tr-sm' : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-sm'} shadow-lg">
                            ${contentHtml}
                        </div>
                        <span class="text-[10px] text-slate-500 mt-1.5 font-mono">${time} &bull; ${isClient ? 'You' : 'Mubashir'}</span>
                    </div>
                </div>
            `;
        });

        // Auto-scroll to bottom
        messagesBox.scrollTop = messagesBox.scrollHeight;
    });
}

// Global scope for HTML handlers
let selectedFile = null;

window.handleFileSelect = function(e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        document.getElementById('file-indicator').classList.remove('hidden');
        document.getElementById('chat-input').placeholder = `File attached: ${file.name} (Type optional message)`;
    }
};

window.sendMessage = async function(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');
    const text = input.value.trim();
    
    if (!text && !selectedFile) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    const user = auth.currentUser;
    let fileUrl = null;
    let fileType = null;

    try {
        // Upload to Cloudinary if file exists
        if (selectedFile) {
            document.getElementById('upload-progress-container').classList.remove('hidden');
            document.getElementById('upload-progress-bar').style.width = '50%';
            
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
            const fd = new FormData();
            fd.append('file', selectedFile);
            fd.append('upload_preset', UPLOAD_PRESET);
            
            const res = await fetch(url, { method: 'POST', body: fd });
            const data = await res.json();
            
            fileUrl = data.secure_url;
            fileType = data.resource_type; // 'image', 'video', 'raw'
            
            document.getElementById('upload-progress-bar').style.width = '100%';
            setTimeout(() => {
                document.getElementById('upload-progress-container').classList.add('hidden');
                document.getElementById('upload-progress-bar').style.width = '0%';
            }, 500);
        }

        // Save to Firestore
        await addDoc(collection(db, "messages"), {
            clientId: user.uid,
            clientName: user.displayName || 'Client',
            clientEmail: user.email,
            sender: 'client',
            text: text,
            fileUrl: fileUrl,
            fileType: fileType,
            timestamp: new Date().toISOString()
        });

        // Reset UI
        input.value = '';
        selectedFile = null;
        document.getElementById('file-indicator').classList.add('hidden');
        document.getElementById('chat-file').value = '';
        input.placeholder = "Type a secure message...";

    } catch (error) {
        console.error("Message Error:", error);
        alert("Failed to send message. Please try again.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    }
};