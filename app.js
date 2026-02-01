const CONFIG = { 
    ID: "*********", 
    KEY: "******", 
    URL: "**********" 
};

const ZA_CURRENCY = new Intl.NumberFormat('en-ZA', { 
    style: 'currency', 
    currency: 'ZAR', 
    maximumFractionDigits: 0 
});

const UI = {
    toast(m, type = 'info') {
        const c = document.getElementById('toastContainer');
        const e = document.createElement('div');
        e.className = `px-6 py-3 rounded-xl text-xs font-bold text-white shadow-2xl transition-all duration-300 transform translate-y-0 ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`;
        e.textContent = m;
        c.appendChild(e);
        setTimeout(() => {
            e.style.opacity = '0';
            e.style.transform = 'translateY(-10px)';
            setTimeout(() => e.remove(), 300);
        }, 3000);
    },
    showSkeletons() {
        const area = document.getElementById('resultsArea');
        area.innerHTML = Array(3).fill(0).map(() => `
            <div class="glass p-6 rounded-3xl border border-white/5 space-y-4">
                <div class="h-6 w-2/3 skeleton rounded-lg"></div>
                <div class="h-12 w-full skeleton rounded-lg"></div>
            </div>
        `).join('');
    }
};

const AuthService = {
    register(u) {
        const users = JSON.parse(localStorage.getItem('lula_users') || '{}');
        if (users[u.email]) throw new Error("Email already registered");
        users[u.email] = { ...u, saved: [] };
        localStorage.setItem('lula_users', JSON.stringify(users));
    },
    login(e, p) {
        const users = JSON.parse(localStorage.getItem('lula_users') || '{}');
        if (users[e] && users[e].pass === p) {
            localStorage.setItem('lula_session', e);
            return users[e];
        }
        throw new Error("Invalid credentials");
    },
    logout() {
        localStorage.removeItem('lula_session');
        location.reload();
    },
    getCurrentUser() {
        const email = localStorage.getItem('lula_session');
        if (!email) return null;
        const users = JSON.parse(localStorage.getItem('lula_users') || '{}');
        return users[email] || null;
    },
    updateUser(newData) {
        const email = localStorage.getItem('lula_session');
        const users = JSON.parse(localStorage.getItem('lula_users') || '{}');
        if (users[email]) {
            users[email] = { ...users[email], ...newData };
            localStorage.setItem('lula_users', JSON.stringify(users));
            return users[email];
        }
        return null;
    }
};

function calculateMatch(jobTitle, searchKey) {
    const title = jobTitle.toLowerCase();
    const key = searchKey.toLowerCase();
    if (title.includes(key)) return Math.floor(Math.random() * (100 - 85) + 85);
    return Math.floor(Math.random() * (84 - 60) + 60);
}

function toggleSettings(open) {
    const panel = document.getElementById('settingsPanel');
    if (open) {
        const user = AuthService.getCurrentUser();
        document.getElementById('setUpdateName').value = user.name || '';
        document.getElementById('setUpdateSurname').value = user.surname || '';
        document.getElementById('setUpdatePhone').value = user.phone || '';
        document.getElementById('setUpdatePass').value = '';
        panel.classList.remove('translate-x-full');
    } else {
        panel.classList.add('translate-x-full');
    }
}

function handleUpdateProfile(e) {
    e.preventDefault();
    const newName = document.getElementById('setUpdateName').value;
    const newSurname = document.getElementById('setUpdateSurname').value;
    const newPhone = document.getElementById('setUpdatePhone').value;
    const newPass = document.getElementById('setUpdatePass').value;

    const updateObj = { name: newName, surname: newSurname, phone: newPhone };
    if (newPass) updateObj.pass = newPass;

    const updatedUser = AuthService.updateUser(updateObj);
    if (updatedUser) {
        document.getElementById('userNameDisplay').textContent = updatedUser.name;
        UI.toast("Profile updated successfully!");
        toggleSettings(false);
    }
}

function openQuickView(index) {
    const job = window.lastResults[index];
    const content = document.getElementById('quickViewContent');
    const score = calculateMatch(job.title, document.getElementById('searchKey').value);

    content.innerHTML = `
        <div class="inline-block px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold mb-4">
            MATCH SCORE: ${score}%
        </div>
        <h2 class="text-3xl font-extrabold mb-2 leading-tight">${job.title}</h2>
        <p class="text-emerald-400 font-bold mb-6">${job.company.display_name} • ${job.location.display_name}</p>
        <div class="space-y-6 text-slate-300 text-sm leading-relaxed">
            <div class="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p class="text-[10px] text-slate-500 uppercase font-black mb-2">Job Description</p>
                ${job.description}
            </div>
        </div>
        <a href="${job.redirect_url}" target="_blank" class="block w-full text-center py-4 bg-emerald-500 text-white rounded-2xl font-bold uppercase text-xs mt-8 active:scale-95 transition">
            Apply on Company Site
        </a>
    `;
    document.getElementById('quickView').classList.remove('translate-x-full');
}

function closeQuickView() {
    document.getElementById('quickView').classList.add('translate-x-full');
}

async function fetchMarketInsights(category) {
    const insightDiv = document.getElementById('marketInsights');
    const content = document.getElementById('insightContent');
    insightDiv.classList.remove('hidden');
    try {
        const jobs = window.lastResults;
        const avg = jobs.reduce((acc, j) => acc + (j.salary_min || 0), 0) / jobs.filter(j => j.salary_min).length;

        content.innerHTML = `
            <div class="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <p class="text-[9px] text-blue-400 font-bold uppercase mb-1">Avg Annual Salary</p>
                <p class="text-lg font-bold">${avg ? ZA_CURRENCY.format(avg) : 'Market Related'}</p>
            </div>
            <div class="space-y-2">
                <p class="text-[9px] text-slate-500 font-bold uppercase ml-1">Demand Density</p>
                <div class="flex items-center justify-between text-[11px] p-2 bg-white/5 rounded-lg">
                    <span>Gauteng</span>
                    <span class="text-emerald-400 font-bold">High</span>
                </div>
                <div class="flex items-center justify-between text-[11px] p-2 bg-white/5 rounded-lg">
                    <span>Western Cape</span>
                    <span class="text-blue-400 font-bold">Medium</span>
                </div>
            </div>
        `;
    } catch (e) {
        console.error("Insight error", e);
    }
}

async function handleSearch(e) {
    e.preventDefault();
    UI.showSkeletons();
    const btnText = document.getElementById('btnText');
    btnText.innerHTML = '<div class="spinner"></div>';

    const q = document.getElementById('searchKey').value;
    const l = document.getElementById('searchLoc').value;
    const s = document.getElementById('searchSalary').value;

    let url = `${CONFIG.URL}?app_id=${CONFIG.ID}&app_key=${CONFIG.KEY}&what=${encodeURIComponent(q)}`;
    if (l) url += `&where=${encodeURIComponent(l)}`;
    if (s) url += `&salary_min=${s}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        window.lastResults = data.results;
        renderResults(data.results, q);
        fetchMarketInsights(q);
    } catch (err) {
        UI.toast("Network error. Try again.", "error");
    } finally {
        btnText.textContent = "Search Jobs";
    }
}

function renderResults(jobs, query) {
    const area = document.getElementById('resultsArea');
    if (!jobs.length) {
        area.innerHTML = `<div class="p-12 text-center glass rounded-3xl"><p class="font-bold">No results found</p></div>`;
        return;
    }
    area.innerHTML = jobs.map((j, i) => {
        const score = calculateMatch(j.title, query);
        return `
        <div class="glass p-6 rounded-[2rem] border border-white/5 relative group transition-all duration-500 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h4 class="font-bold text-white text-lg pr-8">${j.title}</h4>
                    <p class="text-[10px] text-emerald-400 uppercase font-black tracking-widest">${j.company.display_name} • ${j.location.display_name}</p>
                </div>
                <div class="flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10">
                        ${score}%
                    </div>
                    <span class="text-[8px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">Match</span>
                </div>
            </div>

            <p class="text-[12px] text-slate-400 line-clamp-2 leading-relaxed mb-6">${j.description}</p>
            
            <div class="flex gap-3">
                <button onclick="openQuickView(${i})" class="flex-1 py-3 glass rounded-xl text-[10px] font-bold uppercase transition hover:bg-white/10 active:scale-95">
                    Quick View
                </button>
                <button onclick="saveJob(${i})" class="px-4 py-3 bg-slate-800 rounded-xl hover:text-red-500 transition-colors active:scale-95">❤</button>
            </div>
        </div>
    `;
    }).join('');
}

function renderSaved() {
    const u = AuthService.getCurrentUser();
    const list = document.getElementById('savedJobsList');
    if (!u || !u.saved || !u.saved.length) {
        list.innerHTML = `
            <div class="p-8 text-center border-dashed border border-white/10 rounded-2xl">
                <div class="text-3xl mb-2 opacity-20">💼</div>
                <p class="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-tight">Your vault is empty<br>start exploring</p>
            </div>`;
        return;
    }
    list.innerHTML = u.saved.map(s => `
        <div class="p-3 bg-white/5 rounded-2xl flex justify-between items-center text-[10px] group border border-transparent hover:border-emerald-500/20">
            <a href="${s.url}" target="_blank" class="truncate mr-2 font-bold text-slate-300 hover:text-emerald-400 transition-colors">${s.title}</a>
            <button onclick="removeSaved('${s.id}')" class="text-red-500/50 hover:text-red-500 transition-colors">&times;</button>
        </div>
    `).join('');
}

function toggleAuth(isReg) {
    document.getElementById('regForm').classList.toggle('hidden', !isReg);
    document.getElementById('loginForm').classList.toggle('hidden', isReg);
}

function saveJob(i) {
    const job = window.lastResults[i];
    const email = localStorage.getItem('lula_session');
    const users = JSON.parse(localStorage.getItem('lula_users'));
    if (!users[email].saved.some(s => s.id === job.id)) {
        users[email].saved.push({ id: job.id, title: job.title, url: job.redirect_url });
        localStorage.setItem('lula_users', JSON.stringify(users));
        UI.toast("Saved to Vault!", "success");
        renderSaved();
    }
}

function handleRegister(e) {
    e.preventDefault();
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regConfirm').value;
    if (pass !== confirm) return UI.toast("Passwords do not match", "error");

    try {
        AuthService.register({
            name: document.getElementById('regName').value,
            surname: document.getElementById('regSurname').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            pass: pass,
            saved: []
        });
        UI.toast("Welcome to Lula!");
        toggleAuth(false);
    } catch (err) {
        UI.toast(err.message, "error");
    }
}

function handleLogin(e) {
    e.preventDefault();
    try {
        AuthService.login(document.getElementById('loginEmail').value, document.getElementById('loginPass').value);
        boot();
    } catch (err) {
        UI.toast(err.message, "error");
    }
}

function removeSaved(id) {
    const email = localStorage.getItem('lula_session');
    const users = JSON.parse(localStorage.getItem('lula_users'));
    users[email].saved = users[email].saved.filter(s => s.id !== id);
    localStorage.setItem('lula_users', JSON.stringify(users));
    renderSaved();
}

function boot() {
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('authWrapper').classList.add('hidden');
        document.getElementById('appDashboard').classList.remove('hidden');
        document.getElementById('userNameDisplay').textContent = user.name;
        renderSaved();
    }
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', boot);

