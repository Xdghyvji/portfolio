import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const db = getFirestore(app);

/**
 * Services Component - Advanced Ecosystem Management
 */
const Services = {
    allServices: [],
    filteredServices: [],

    async init() {
        const container = document.getElementById('admin-content');
        if (!container) return;

        container.innerHTML = this.renderLoading();

        try {
            await this.fetchServices();
            this.filteredServices = [...this.allServices];

            container.innerHTML = this.renderUI();
            this.renderServicesGrid(this.filteredServices);
            this.setupListeners();
            this.setupGlobalHandlers();

        } catch (error) {
            console.error("Services Load Error:", error);
            container.innerHTML = this.renderError(error.message);
        }
    },

    async fetchServices() {
        const snap = await getDocs(collection(db, "services"));
        this.allServices = [];
        snap.forEach(doc => {
            this.allServices.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by creation date or name
        this.allServices.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    },

    getStats() {
        const total = this.allServices.length;
        const active = this.allServices.filter(s => s.status === 'active').length;
        const draft = total - active;
        
        let avgPrice = 0;
        if(total > 0) {
            const totalValue = this.allServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
            avgPrice = Math.round(totalValue / total);
        }

        return { total, active, draft, avgPrice };
    },

    renderUI() {
        const stats = this.getStats();
        
        return `
            <div class="space-y-8 animate-[fadeIn_0.4s_ease-out] relative">
                
                <!-- Header Actions -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                    <div>
                        <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-3">
                            <i class="fa-solid fa-cubes text-ma-emerald"></i> Service Ecosystem
                        </h2>
                        <p class="text-sm text-slate-500 mt-1">Configure service bundles, pricing tiers, and active digital solutions.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="relative hidden md:block">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                            <input type="text" id="service-search" placeholder="Search parameters..." class="bg-ma-dark border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-ma-emerald/50 transition-all w-64">
                        </div>
                        <button onclick="window.ServicesOpenProvisionModal()" class="px-4 py-2.5 bg-ma-emerald hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-ma-emerald/20 transition flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Provision Bundle
                        </button>
                        <button onclick="window.loadSection('services')" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-ma-emerald transition-all">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Total Bundles</p>
                            <h4 class="text-2xl font-display font-bold text-white">${stats.total}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center border border-white/5 group-hover:scale-110 transition"><i class="fa-solid fa-layer-group"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Active Offerings</p>
                            <h4 class="text-2xl font-display font-bold text-ma-emerald">${stats.active}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-emerald/10 text-ma-emerald flex items-center justify-center border border-ma-emerald/20 group-hover:scale-110 transition"><i class="fa-solid fa-satellite-dish"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Avg Price Point</p>
                            <h4 class="text-2xl font-display font-bold text-ma-indigo">$${stats.avgPrice}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-ma-indigo/10 text-ma-indigo flex items-center justify-center border border-ma-indigo/20 group-hover:scale-110 transition"><i class="fa-solid fa-tag"></i></div>
                    </div>
                    <div class="glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Drafts / Inactive</p>
                            <h4 class="text-2xl font-display font-bold text-amber-400">${stats.draft}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-400/20 group-hover:scale-110 transition"><i class="fa-solid fa-file-pen"></i></div>
                    </div>
                </div>

                <!-- Core Offering Parameters -->
                <div class="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center gap-6">
                    <div class="shrink-0 flex items-center gap-3 border-r border-white/10 pr-6">
                        <div class="w-10 h-10 rounded-full bg-ma-indigo/10 flex items-center justify-center text-ma-indigo border border-ma-indigo/30">
                            <i class="fa-solid fa-microchip"></i>
                        </div>
                        <div>
                            <h3 class="font-display font-bold text-white text-sm">Core Parameters</h3>
                            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Niche Skill Mapping</p>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-wrap gap-3">
                        ${this.renderSkillBadge("Web Dev Architecture", "ma-indigo")}
                        ${this.renderSkillBadge("SEO Authority", "ma-emerald")}
                        ${this.renderSkillBadge("SMM Automation", "cyan-400")}
                        ${this.renderSkillBadge("AI Pipelines", "purple-500")}
                        ${this.renderSkillBadge("Shopify E-Com", "ma-emerald")}
                    </div>
                </div>

                <!-- Bundles Grid -->
                <div id="services-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Cards injected here -->
                </div>

                <!-- Modals Container -->
                <div id="services-modal-container"></div>
                
                <!-- Toast Notification Container -->
                <div id="services-toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"></div>
            </div>
        `;
    },

    renderServicesGrid(services) {
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        if (services.length === 0) {
            grid.innerHTML = `
                <div class="md:col-span-2 lg:col-span-3 py-24 text-center glass-panel rounded-3xl border border-white/5">
                    <div class="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 text-3xl mx-auto mb-4">
                        <i class="fa-solid fa-ghost"></i>
                    </div>
                    <h3 class="text-xl font-display font-bold text-white mb-2">Ecosystem Void</h3>
                    <p class="text-slate-400 font-medium">No service bundles detected matching your criteria.</p>
                    <button onclick="window.ServicesOpenProvisionModal()" class="mt-6 px-6 py-2.5 rounded-xl bg-ma-emerald text-white text-xs font-bold transition shadow-lg shadow-ma-emerald/20">Initialize First Bundle</button>
                </div>`;
            return;
        }

        grid.innerHTML = services.map(service => {
            const isActive = service.status === 'active';
            const statusColor = isActive ? 'ma-emerald' : 'amber-400';
            const statusBg = isActive ? 'bg-ma-emerald/10 text-ma-emerald border-ma-emerald/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20';
            const price = Number(service.price) ? `$${Number(service.price).toLocaleString()}` : 'Custom';
            const icon = service.icon || 'fa-box';

            return `
                <div class="glass-panel p-6 rounded-3xl border border-white/5 group hover:border-${statusColor}/30 hover:bg-white/[0.02] transition-all relative overflow-hidden flex flex-col">
                    
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-${statusColor}/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    
                    <div class="flex justify-between items-start mb-6 relative z-10">
                        <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10 group-hover:scale-110 group-hover:text-${statusColor} transition-all shadow-lg">
                            <i class="fa-solid ${icon} text-2xl"></i>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <span class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${statusBg} flex items-center gap-1.5">
                                ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-ma-emerald animate-pulse"></span>' : '<i class="fa-solid fa-pause"></i>'}
                                ${isActive ? 'Active' : 'Draft'}
                            </span>
                            <button onclick="window.ServicesInspectNode('${service.id}')" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                        </div>
                    </div>
                    
                    <h4 class="text-xl font-display font-bold text-white mb-2 relative z-10">${service.name || 'Unnamed Bundle'}</h4>
                    <p class="text-xs text-slate-400 leading-relaxed mb-6 line-clamp-3 flex-1 relative z-10">${service.description || 'No detailed parameters provided for this service module.'}</p>
                    
                    <div class="flex items-end justify-between pt-5 border-t border-white/5 relative z-10 mt-auto">
                        <div>
                            <p class="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-0.5">Value Parameter</p>
                            <span class="text-2xl font-display font-bold text-white">${price}</span>
                        </div>
                        <div class="text-right">
                             <p class="text-[10px] font-mono text-slate-600 uppercase tracking-widest">ID: ${service.id.substring(0,5)}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSkillBadge(name, color) {
        return `
            <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 group hover:border-${color}/30 transition-all cursor-default">
                <span class="w-1.5 h-1.5 rounded-full bg-${color}"></span>
                <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">${name}</p>
            </div>
        `;
    },

    setupListeners() {
        const searchInput = document.getElementById('service-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filteredServices = this.allServices.filter(s => 
                    (s.name && s.name.toLowerCase().includes(term)) || 
                    (s.description && s.description.toLowerCase().includes(term))
                );
                this.renderServicesGrid(this.filteredServices);
            });
        }
    },

    renderLoading() {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center space-y-4">
                <i class="fa-solid fa-cubes fa-spin text-4xl text-ma-emerald"></i>
                <p class="text-xs font-mono text-slate-500 uppercase tracking-[0.3em] animate-pulse">Mapping_Ecosystem_Nodes...</p>
            </div>
        `;
    },

    renderError(msg) {
        return `
            <div class="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
                    <i class="fa-solid fa-plug-circle-xmark"></i>
                </div>
                <h3 class="text-white font-display font-bold text-xl mb-2">Node Sync Failed</h3>
                <p class="text-slate-500 text-sm max-w-xs mb-6">${msg}</p>
                <button onclick="window.loadSection('services')" class="px-8 py-3 rounded-xl bg-ma-emerald hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-ma-emerald/20 transition-all">Re-establish Link</button>
            </div>
        `;
    },

    // ------------------------------------------------------------------------
    // MODALS & GLOBAL HANDLERS
    // ------------------------------------------------------------------------
    setupGlobalHandlers() {
        
        window.ServicesToast = (msg, type = 'success') => {
            const container = document.getElementById('services-toast-container');
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

        window.ServicesCloseModal = () => {
            const container = document.getElementById('services-modal-container');
            if(container) container.innerHTML = '';
        };

        // --- PROVISION MODAL (Create) ---
        window.ServicesOpenProvisionModal = () => {
            const container = document.getElementById('services-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2"><i class="fa-solid fa-cube text-ma-emerald"></i> Provision New Bundle</h3>
                            <button onclick="window.ServicesCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onsubmit="window.ServicesSubmitProvision(event)" class="p-6 space-y-5">
                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Bundle Designation (Name)</label>
                                <input type="text" id="srv-name" required placeholder="e.g. Full-Stack Development Suite" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Value Parameter ($)</label>
                                    <input type="number" id="srv-price" required placeholder="899" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition">
                                </div>
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Initial Status</label>
                                    <select id="srv-status" class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition cursor-pointer">
                                        <option value="active">Active (Live)</option>
                                        <option value="draft">Draft (Hidden)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Visual Identifier (FontAwesome Icon Class)</label>
                                <div class="flex items-center bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 transition focus-within:border-ma-emerald">
                                    <i class="fa-solid fa-icons text-slate-500 mr-3"></i>
                                    <input type="text" id="srv-icon" placeholder="fa-code, fa-robot, fa-chart-line" value="fa-box" class="w-full bg-transparent text-white text-sm focus:outline-none">
                                </div>
                            </div>

                            <div>
                                <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1.5">Detailed Parameters (Description)</label>
                                <textarea id="srv-desc" rows="3" required placeholder="Detail the deliverables and scope..." class="w-full bg-ma-slate border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-ma-emerald focus:outline-none transition resize-none"></textarea>
                            </div>

                            <div class="pt-4 border-t border-white/5 flex justify-end gap-3 mt-2">
                                <button type="button" onclick="window.ServicesCloseModal()" class="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Cancel</button>
                                <button type="submit" id="srv-btn" class="px-6 py-2.5 rounded-xl bg-ma-emerald hover:bg-emerald-500 text-white text-sm font-bold transition shadow-lg shadow-ma-emerald/20 flex items-center gap-2">Initialize Bundle <i class="fa-solid fa-power-off"></i></button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        };

        window.ServicesSubmitProvision = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('srv-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

            try {
                const data = {
                    name: document.getElementById('srv-name').value,
                    price: Number(document.getElementById('srv-price').value),
                    status: document.getElementById('srv-status').value,
                    icon: document.getElementById('srv-icon').value || 'fa-box',
                    description: document.getElementById('srv-desc').value,
                    createdAt: serverTimestamp()
                };
                
                await addDoc(collection(db, "services"), data);
                window.ServicesCloseModal();
                window.ServicesToast("Service bundle initialized.");
                Services.init(); // Reload
            } catch (err) {
                console.error(err);
                window.ServicesToast("Provisioning failed: " + err.message, "error");
                btn.disabled = false;
                btn.innerHTML = 'Initialize Bundle <i class="fa-solid fa-power-off"></i>';
            }
        };

        // --- INSPECT MODAL (Read/Update) ---
        window.ServicesInspectNode = (serviceId) => {
            const service = Services.allServices.find(s => s.id === serviceId);
            if(!service) return;

            const container = document.getElementById('services-modal-container');
            const isActive = service.status === 'active';

            container.innerHTML = `
                <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div class="bg-ma-dark sm:border border-white/10 sm:rounded-3xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
                        
                        <!-- Modal Header -->
                        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <h3 class="text-lg font-display font-bold text-white flex items-center gap-2">Bundle Inspector</h3>
                            <button onclick="window.ServicesCloseModal()" class="w-8 h-8 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition flex items-center justify-center"><i class="fa-solid fa-arrow-right"></i></button>
                        </div>
                        
                        <div class="p-6 flex-1 overflow-y-auto custom-scroll space-y-6">
                            
                            <!-- Hero -->
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 text-white shrink-0 shadow-lg">
                                    <i class="fa-solid ${service.icon || 'fa-box'}"></i>
                                </div>
                                <div class="flex-1">
                                    <input type="text" id="edit-srv-name-${service.id}" value="${service.name}" onchange="window.ServicesUpdateField('${service.id}', 'name', this.value)" class="bg-transparent w-full text-xl font-bold text-white focus:outline-none focus:border-b focus:border-ma-emerald transition-colors" placeholder="Bundle Name">
                                    <p class="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">ID: ${service.id}</p>
                                </div>
                            </div>

                            <!-- Quick Stats -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5 relative group">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Value ($)</p>
                                    <div class="flex items-center">
                                        <span class="text-white text-sm font-bold">$</span>
                                        <input type="number" id="edit-srv-price-${service.id}" value="${service.price}" onchange="window.ServicesUpdateField('${service.id}', 'price', Number(this.value))" class="bg-transparent w-full text-white text-sm font-bold focus:outline-none">
                                    </div>
                                    <i class="fa-solid fa-pen absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition"></i>
                                </div>
                                <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p class="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                    <select onchange="window.ServicesUpdateField('${service.id}', 'status', this.value)" class="bg-transparent text-sm font-bold w-full focus:outline-none cursor-pointer ${isActive ? 'text-ma-emerald' : 'text-amber-400'}">
                                        <option value="active" class="bg-ma-dark text-white" ${isActive ? 'selected' : ''}>Active</option>
                                        <option value="draft" class="bg-ma-dark text-white" ${!isActive ? 'selected' : ''}>Draft</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Details -->
                            <div class="space-y-4">
                                <h5 class="text-[10px] font-mono uppercase text-slate-500 tracking-widest border-b border-white/5 pb-2">Detailed Parameters</h5>
                                
                                <div>
                                    <label class="block text-[10px] font-mono uppercase text-slate-500 mb-1">Icon Class</label>
                                    <div class="flex items-center bg-ma-slate border border-white/5 rounded-lg px-3 py-2">
                                        <input type="text" id="edit-srv-icon-${service.id}" value="${service.icon || ''}" class="bg-transparent w-full text-white text-sm focus:outline-none font-mono text-xs">
                                        <button onclick="window.ServicesUpdateField('${service.id}', 'icon', document.getElementById('edit-srv-icon-${service.id}').value)" class="text-ma-emerald hover:text-white text-xs font-bold transition"><i class="fa-solid fa-save"></i></button>
                                    </div>
                                </div>
                                
                                <div>
                                    <p class="text-[10px] font-mono uppercase text-slate-500 mb-1">Description Scope</p>
                                    <div class="bg-ma-slate border border-white/5 rounded-xl p-1">
                                        <textarea id="edit-srv-desc-${service.id}" rows="5" class="w-full bg-transparent text-sm text-slate-300 p-3 focus:outline-none resize-none leading-relaxed">${service.description || ''}</textarea>
                                        <div class="flex justify-end p-2 border-t border-white/5">
                                            <button onclick="window.ServicesUpdateField('${service.id}', 'description', document.getElementById('edit-srv-desc-${service.id}').value)" class="px-3 py-1.5 bg-ma-emerald/10 text-ma-emerald hover:bg-ma-emerald hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-2"><i class="fa-solid fa-save"></i> Update Scope</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        
                        <div class="p-6 border-t border-white/5 bg-ma-slate/30 shrink-0">
                            <button onclick="window.ServicesDeleteNode('${service.id}')" class="w-full py-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 group">
                                <i class="fa-solid fa-skull group-hover:animate-bounce"></i> Decommission Bundle
                            </button>
                        </div>
                    </div>
                </div>
                <style>
                    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                </style>
            `;
        };

        window.ServicesUpdateField = async (serviceId, field, value) => {
            try {
                await updateDoc(doc(db, "services", serviceId), { [field]: value, updatedAt: serverTimestamp() });
                window.ServicesToast(`Parameter '${field}' synchronized.`);
                
                // Quietly update local array
                const service = Services.allServices.find(s => s.id === serviceId);
                if(service) service[field] = value;
                
                // Re-render main UI so grid updates immediately (preserves search state)
                Services.renderServicesGrid(Services.filteredServices);
                // Also update stats block without full flicker
                const stats = Services.getStats();
                const container = document.getElementById('admin-content');
                if(container) {
                    // Quick hack to just re-init UI instead of writing complex targeted DOM updates
                    const scrollPos = document.querySelector('.custom-scroll')?.scrollTop;
                    Services.init().then(() => {
                        const scroller = document.querySelector('.custom-scroll');
                        if(scroller) scroller.scrollTop = scrollPos;
                        if(document.getElementById('services-modal-container').innerHTML !== '') {
                            // Re-open modal to show updated state if it was open
                            window.ServicesInspectNode(serviceId);
                        }
                    });
                }

            } catch (e) {
                console.error(e);
                window.ServicesToast("Sync failed: " + e.message, "error");
            }
        };

        // --- DELETE MODAL ---
        window.ServicesDeleteNode = (serviceId) => {
            const service = Services.allServices.find(s => s.id === serviceId);
            if(!service) return;

            const container = document.getElementById('services-modal-container');
            container.innerHTML = `
                <div class="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div class="bg-ma-dark border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.1)] overflow-hidden text-center p-8 animate-[fadeIn_0.2s_ease-out]">
                        <div class="w-20 h-20 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-6 animate-pulse">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3 class="text-2xl font-display font-bold text-white mb-2">Critical Action</h3>
                        <p class="text-slate-400 text-sm mb-6">You are about to permanently decommission <span class="text-white font-bold">${service.name}</span>. This offering will be removed from the ecosystem.</p>
                        
                        <p class="text-[10px] font-mono text-rose-500 mb-2 uppercase tracking-widest">Type "DECOMMISSION" to confirm</p>
                        <input type="text" id="del-confirm" class="w-full bg-black/50 border border-rose-500/50 rounded-xl px-4 py-3 text-center text-white font-mono uppercase tracking-widest focus:outline-none focus:border-rose-400 transition mb-6" autocomplete="off">
                        
                        <div class="flex gap-3">
                            <button onclick="window.ServicesInspectNode('${serviceId}')" class="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition">Abort</button>
                            <button onclick="window.ServicesExecuteDelete('${serviceId}')" class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">Execute <i class="fa-solid fa-skull"></i></button>
                        </div>
                    </div>
                </div>
            `;
        };

        window.ServicesExecuteDelete = async (serviceId) => {
            const confirmVal = document.getElementById('del-confirm').value;
            if (confirmVal !== 'DECOMMISSION') {
                return window.ServicesToast("Confirmation failed. Type DECOMMISSION exactly.", "error");
            }

            try {
                await deleteDoc(doc(db, "services", serviceId));
                window.ServicesCloseModal();
                window.ServicesToast("Bundle decommissioned.");
                Services.init(); // Refresh entire list
            } catch (e) {
                console.error(e);
                window.ServicesToast("Decommission failed: " + e.message, "error");
            }
        };
    }
};

// Listen for Section Loads
window.addEventListener('admin-section-load', (e) => {
    if (e.detail.section === 'services') {
        Services.init();
    }
});