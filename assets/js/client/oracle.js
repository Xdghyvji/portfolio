import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const Oracle = {
    isOpen: false,
    chatHistory: [],

    init() {
        // Ensure elements exist before binding
        const fab = document.getElementById('oracle-fab');
        const closeBtn = document.getElementById('oracle-close');
        const form = document.getElementById('oracle-form');

        if(fab) fab.addEventListener('click', () => this.toggleWindow());
        if(closeBtn) closeBtn.addEventListener('click', () => this.toggleWindow());
        if(form) form.addEventListener('submit', (e) => this.handleMessage(e));

        // Add initial greeting if empty
        const messagesBox = document.getElementById('oracle-messages');
        if (messagesBox && messagesBox.children.length === 0) {
            this.appendMessage('oracle', "Greetings. I am Oracle, the Command Center's cognitive core. How may I assist you with your projects or billing today?");
        }
    },

    toggleWindow() {
        const win = document.getElementById('oracle-window');
        const fabIcon = document.getElementById('oracle-fab-icon');
        
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            win.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
            win.classList.add('opacity-100', 'translate-y-0');
            fabIcon.classList.remove('fa-robot');
            fabIcon.classList.add('fa-xmark');
            document.getElementById('oracle-input').focus();
        } else {
            win.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
            win.classList.remove('opacity-100', 'translate-y-0');
            fabIcon.classList.remove('fa-xmark');
            fabIcon.classList.add('fa-robot');
        }
    },

    async getClientContext() {
        const user = auth.currentUser;
        if (!user) return { error: "Unauthenticated" };

        let context = {
            clientName: user.displayName || 'Client',
            clientEmail: user.email,
            activeProjects: [],
            pendingInvoices: []
        };

        try {
            // Get Active Projects
            const projSnap = await getDocs(query(collection(db, "orders"), where("clientEmail", "==", user.email)));
            projSnap.forEach(doc => {
                const d = doc.data();
                if(d.status !== 'completed' && d.status !== 'cancelled') {
                    context.activeProjects.push({ title: d.title || d.service, status: d.status, progress: d.progress + '%' });
                }
            });

            // Get Pending Invoices
            const invSnap = await getDocs(query(collection(db, "invoices"), where("clientEmail", "==", user.email)));
            invSnap.forEach(doc => {
                const d = doc.data();
                if(d.status !== 'paid' && d.status !== 'draft') {
                    context.pendingInvoices.push({ amount: '$'+d.total, status: d.status, dueDate: d.dueDate });
                }
            });
        } catch (e) {
            console.warn("Oracle Context Warning:", e);
        }

        return context;
    },

    async handleMessage(e) {
        e.preventDefault();
        const input = document.getElementById('oracle-input');
        const sendBtn = document.getElementById('oracle-send-btn');
        const text = input.value.trim();
        
        if (!text) return;

        // 1. Add user message to UI
        this.appendMessage('user', text);
        input.value = '';
        
        // 2. Lock input and show loading
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-xs"></i>';
        this.showTypingIndicator();

        try {
            // 3. Fetch live context
            const context = await this.getClientContext();

            // 4. Send to Netlify Function
            // NOTE: Ensure this URL matches your local dev or live Netlify URL
            const response = await fetch('/.netlify/functions/oracle-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    clientContext: context,
                    chatHistory: this.chatHistory
                })
            });

            if (!response.ok) throw new Error("Neural link severed.");
            
            const data = await response.json();
            
            // 5. Update History & UI
            this.chatHistory.push(
                { role: "user", parts: [{ text }] },
                { role: "model", parts: [{ text: data.response }] }
            );

            this.removeTypingIndicator();
            this.appendMessage('oracle', data.response);

        } catch (error) {
            console.error(error);
            this.removeTypingIndicator();
            this.appendMessage('oracle', "My connection to the core servers has been interrupted. Please try again or use the Support Desk.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
            input.focus();
        }
    },

    appendMessage(sender, text) {
        const box = document.getElementById('oracle-messages');
        const isOracle = sender === 'oracle';
        
        // Convert basic markdown (bold, italics) for nicer output
        let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');

        const html = `
            <div class="flex w-full ${isOracle ? 'justify-start' : 'justify-end'} mb-4 animate-[fadeIn_0.3s_ease]">
                <div class="flex gap-2 max-w-[85%] ${isOracle ? 'flex-row' : 'flex-row-reverse'}">
                    ${isOracle ? `
                        <div class="w-6 h-6 rounded-full bg-ma-indigo/20 flex items-center justify-center text-ma-indigo border border-ma-indigo/30 shrink-0 mt-1">
                            <i class="fa-solid fa-robot text-[10px]"></i>
                        </div>
                    ` : ''}
                    <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        isOracle 
                        ? 'bg-ma-slate border border-white/5 text-slate-200 rounded-tl-sm' 
                        : 'bg-ma-indigo text-white rounded-tr-sm'
                    }">
                        ${formattedText}
                    </div>
                </div>
            </div>
        `;
        
        box.insertAdjacentHTML('beforeend', html);
        box.scrollTop = box.scrollHeight;
    },

    showTypingIndicator() {
        const box = document.getElementById('oracle-messages');
        const html = `
            <div id="oracle-typing" class="flex w-full justify-start mb-4">
                <div class="flex gap-2 max-w-[85%]">
                    <div class="w-6 h-6 rounded-full bg-ma-indigo/20 flex items-center justify-center text-ma-indigo border border-ma-indigo/30 shrink-0 mt-1">
                        <i class="fa-solid fa-robot text-[10px]"></i>
                    </div>
                    <div class="px-4 py-3 rounded-2xl bg-ma-slate border border-white/5 text-slate-200 rounded-tl-sm flex gap-1 items-center">
                        <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                        <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            </div>
        `;
        box.insertAdjacentHTML('beforeend', html);
        box.scrollTop = box.scrollHeight;
    },

    removeTypingIndicator() {
        const indicator = document.getElementById('oracle-typing');
        if (indicator) indicator.remove();
    }
};

// Initialize after DOM load
window.addEventListener('DOMContentLoaded', () => {
    // Slight delay to ensure auth state is loaded if needed
    setTimeout(() => Oracle.init(), 1000);
});