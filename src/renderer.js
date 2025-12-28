let isMonitoring = false;
let sessionStartTime = null;
let sessionInterval = null;
let currentDate = getTodayDate();
let currentView = 'monitor';
let autoStarted = false;

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Interface carregada');
    loadAvailableDates();
    loadMonitorStats();

    setTimeout(() => {
        if (!autoStarted) {
            console.log('🚀 Auto-start');
            startMonitoring();
            autoStarted = true;
        }
    }, 1000);
});


function getTodayDate() { return new Date().toISOString().split('T')[0]; }

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    if (dateStr === getTodayDate()) return 'Hoje';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatTimeShort(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


function getAppIcon(appName) {
    const name = appName.toLowerCase();
    const base = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/";

    const appLogos = {
        'code': 'vscode.png',
        'visual studio code': 'vscode.png',
        'intellij': 'intellij.png',
        'idea': 'intellij.png',
        'chrome': 'google-chrome.png',
        'spotify': 'spotify.png',
        'discord': 'discord.png',
        'instagram': 'instagram.png',
        'notion': 'notion.png',
        'powershell': 'terminal.png',
        'electron': 'electron.png',
        'notepad': 'notepad.png',
        'edge': 'microsoft-edge.png'
    };

    let filename = null;
    for (const [key, val] of Object.entries(appLogos)) {
        if (name.includes(key)) {
            filename = val;
            break;
        }
    }

    if (filename) {
        return `<img src="${base}${filename}" class="w-10 h-10 object-contain" onerror="this.src='https://www.google.com/s2/favicons?sz=64&domain=${name.replace(/\s/g, '')}.com'">`;
    }


    const cleanName = name.replace(/\s/g, '');
    const fallbackService = `https://icons.duckduckgo.com/ip3/${cleanName}.com.ico`;

    return `<img src="${fallbackService}" class="w-10 h-10 object-contain"
            onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?sz=64&domain=${cleanName}.com'; this.onerror=function(){this.parentElement.innerHTML='<span class=\'text-2xl\'>📱</span>'}">`;
}

function getDomainIcon(domain) {
    if (!domain) return '<span class="text-lg">🌐</span>';

    const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

    return `<img src="${iconUrl}" class="w-5 h-5 object-contain inline-block mr-2"
            onerror="this.onerror=null; this.src='https://icons.duckduckgo.com/ip3/${domain}.ico'">`;
}

function cleanId(name) { return name.toLowerCase().replace(/[^a-z0-9]/g, ''); }

// ========== GRÁFICOS ==========

function renderWeeklyChart(dailyTotals) {
    const chartContainer = document.getElementById('weekly-chart');
    if (!chartContainer) return;
    const values = Object.values(dailyTotals);
    const maxTime = Math.max(...values, 3600);
    let html = '<div class="flex items-end justify-between gap-3 w-full" style="height: 160px;">';
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const time = dailyTotals[dateStr] || 0;
        const heightPercent = (time / maxTime) * 100;
        const dayLabel = i === 0 ? 'HOJE' : dateStr.split('-')[2];
        html += `
            <div class="group flex flex-col items-center justify-end flex-1 relative" style="height: 100%; gap: 8px;">
                <div class="text-[9px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity h-4">
                    ${formatTimeShort(time)}
                </div>
                <div class="w-full rounded-t-lg transition-all duration-200 cursor-pointer bg-blue-600 hover:bg-blue-500"
                     style="height: ${Math.max(heightPercent, 8)}%; min-height: 8px;"></div>
                <span class="text-[9px] text-zinc-500 font-bold tracking-tight">${dayLabel}</span>
            </div>`;
    }
    chartContainer.innerHTML = html + '</div>';
}

function renderMonthlyChart(dailyTotals) {
    const container = document.getElementById('monthly-chart');
    if (!container || typeof Chart === 'undefined') return;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthData = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${now.toISOString().slice(0, 8)}${day.toString().padStart(2, '0')}`;
        monthData.push(dailyTotals[dateStr] || 0);
    }
    if (window.monthlyChartInstance) window.monthlyChartInstance.destroy();
    const ctx = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(ctx);
    window.monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
            datasets: [{
                data: monthData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 1.5, tension: 0.3, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { max: 12 * 3600, ticks: { color: '#71717a', callback: (v) => Math.floor(v / 3600) + 'h' } },
                x: { ticks: { color: '#71717a', font: { size: 9 } } }
            }
        }
    });
}



function renderDomainList(domains, parentTime, safeId) {
    if (!domains || Object.keys(domains).length === 0) return '';
    const sortedDomains = Object.entries(domains).sort((a, b) => b[1].totalTime - a[1].totalTime);
    let html = `<div class="accordion-content mt-4 space-y-2" id="accordion-${safeId}" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease;">`;
    sortedDomains.forEach(([domain, domainData]) => {
        html += `
            <div class="domain-item p-2 rounded-lg bg-zinc-900/50 border-l border-zinc-700 flex items-center justify-between">
                <div class="flex items-center gap-2 overflow-hidden">
                    ${getDomainIcon(domain)}
                    <span class="text-xs text-zinc-400 truncate">${domain}</span>
                </div>
                <span class="text-[10px] font-bold text-zinc-500">${formatTimeShort(domainData.totalTime)}</span>
            </div>`;
    });
    return html + '</div>';
}

function toggleAccordion(id) {
    const content = document.getElementById(`accordion-${id}`);
    const toggle = document.getElementById(`toggle-${id}`);
    if (!content) return;
    const isOpen = content.classList.contains('open');
    if (isOpen) {
        content.classList.remove('open');
        if(toggle) toggle.style.transform = "rotate(0deg)";
        content.style.maxHeight = "0px";
    } else {
        content.classList.add('open');
        if(toggle) toggle.style.transform = "rotate(180deg)";
        content.style.maxHeight = content.scrollHeight + "px";
    }
}



async function loadMonitorStats() {
    const stats = await window.api.getStats();
    const grid = document.getElementById('monitor-stats-grid');
    if (!grid || Object.keys(stats).length === 0) return;
    const totalTime = Object.values(stats).reduce((sum, data) => sum + data.totalTime, 0);
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].totalTime - a[1].totalTime);
    grid.innerHTML = sortedStats.map(([app, data]) => {
        const safeId = cleanId(app);
        const hasDomains = data.domains && Object.keys(data.domains).length > 0;
        return `
        <div class="p-6 glass-panel rounded-xl">
            <div class="flex justify-between items-start mb-6">
                <div class="flex-shrink-0">${getAppIcon(app)}</div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-zinc-500">${((data.totalTime / totalTime) * 100).toFixed(0)}%</span>
                    ${hasDomains ? `<button onclick="toggleAccordion('${safeId}')" id="toggle-${safeId}" class="text-zinc-500 hover:text-white transition-transform"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>` : ''}
                </div>
            </div>
            <h4 class="font-bold text-zinc-200 tracking-tight">${app}</h4>
            <p class="text-[10px] text-zinc-500 uppercase tracking-widest">${formatTimeShort(data.totalTime)} totais</p>
            ${renderDomainList(data.domains, data.totalTime, safeId)}
        </div>`;
    }).join('');
    document.getElementById('total-day-time').textContent = formatTimeShort(totalTime);
    document.getElementById('apps-count').textContent = Object.keys(stats).length;
}

async function loadDailyView(date) {
    const stats = await window.api.getStatsByDate(date);
    const grid = document.getElementById('daily-stats-grid');
    if (!grid) return;

    const statsEntries = Object.entries(stats);

        const totalTime = statsEntries.reduce((sum, [_, data]) => sum + data.totalTime, 0);
    const appsCount = statsEntries.length;
    const sortedStats = statsEntries.sort((a, b) => b[1].totalTime - a[1].totalTime);
    const topApp = sortedStats.length > 0 ? sortedStats[0][0] : "—";

        const dailyTotalEl = document.getElementById('daily-total');
    const dailyAppsEl = document.getElementById('daily-apps');
    const dailyTopEl = document.getElementById('daily-top');

    if (dailyTotalEl) dailyTotalEl.textContent = formatTimeShort(totalTime);
    if (dailyAppsEl) dailyAppsEl.textContent = appsCount;
    if (dailyTopEl) dailyTopEl.textContent = topApp;

        if (statsEntries.length === 0) {
        grid.innerHTML = '<div class="p-8 text-center text-zinc-600 col-span-full">Nenhum dado registrado nesta data.</div>';
        return;
    }

        grid.innerHTML = sortedStats.map(([app, data]) => {
        const safeId = cleanId(app) + "-daily";
        return `
        <div class="p-6 glass-panel rounded-xl">
            <div class="flex justify-between items-start mb-4">
                ${getAppIcon(app)}
                <button onclick="toggleAccordion('${safeId}')" id="toggle-${safeId}" class="text-zinc-500">▼</button>
            </div>
            <h4 class="font-bold text-zinc-200">${app}</h4>
            <p class="text-xs text-zinc-500 uppercase">${formatTimeShort(data.totalTime)}</p>
            ${renderDomainList(data.domains, data.totalTime, safeId)}
        </div>`;
    }).join('');
}

async function loadWeeklyView() {
    const dates = await window.api.getAvailableDates();
    const last7Days = dates.slice(0, 7);
    let totalWeekTime = 0;
    const appAgg = {};
    const dailyTotals = {};
    for (const date of last7Days) {
        const stats = await window.api.getStatsByDate(date);
        let dayTotal = 0;
        Object.entries(stats).forEach(([app, data]) => {
            totalWeekTime += data.totalTime;
            dayTotal += data.totalTime;
            if (!appAgg[app]) appAgg[app] = { totalTime: 0, domains: {} };
            appAgg[app].totalTime += data.totalTime;
            if (data.domains) {
                Object.entries(data.domains).forEach(([dom, domData]) => {
                    if (!appAgg[app].domains[dom]) appAgg[app].domains[dom] = { totalTime: 0 };
                    appAgg[app].domains[dom].totalTime += domData.totalTime;
                });
            }
        });
        dailyTotals[date] = dayTotal;
    }
    renderWeeklyChart(dailyTotals);
    document.getElementById('weekly-total').textContent = formatTimeShort(totalWeekTime);
    document.getElementById('weekly-avg').textContent = formatTimeShort(totalWeekTime / (last7Days.length || 1));
    const sorted = Object.entries(appAgg).sort((a,b) => b[1].totalTime - a[1].totalTime);
    document.getElementById('weekly-apps-list').innerHTML = sorted.map(([app, data]) => {
        const safeId = cleanId(app) + "-weekly";
        return `
        <div class="p-6 glass-panel rounded-xl">
            <div class="flex justify-between items-start mb-4">
                ${getAppIcon(app)}
                <button onclick="toggleAccordion('${safeId}')" id="toggle-${safeId}" class="text-zinc-500">▼</button>
            </div>
            <h4 class="font-bold text-zinc-200">${app}</h4>
            <p class="text-[10px] text-zinc-500 uppercase">${formatTimeShort(data.totalTime)} na semana</p>
            ${renderDomainList(data.domains, data.totalTime, safeId)}
        </div>`;
    }).join('');
}

async function loadMonthlyView() {
    const dates = await window.api.getAvailableDates();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthDates = dates.filter(d => d.startsWith(currentMonth));
    let totalTime = 0;
    const appAgg = {};
    const dailyTotals = {};
    for (const date of monthDates) {
        const stats = await window.api.getStatsByDate(date);
        let dayTotal = 0;
        Object.entries(stats).forEach(([app, data]) => {
            totalTime += data.totalTime;
            dayTotal += data.totalTime;
            if (!appAgg[app]) appAgg[app] = { totalTime: 0 };
            appAgg[app].totalTime += data.totalTime;
        });
        dailyTotals[date] = dayTotal;
    }
    renderMonthlyChart(dailyTotals);
    document.getElementById('month-name').textContent = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('monthly-total').textContent = formatTimeShort(totalTime);
    const sorted = Object.entries(appAgg).sort((a,b) => b[1].totalTime - a[1].totalTime).slice(0, 10);
    document.getElementById('monthly-apps-grid').innerHTML = sorted.map(([app, data]) => `
        <div class="glass-panel p-4 rounded-lg flex items-center gap-4">
            ${getAppIcon(app)}
            <div><div class="font-bold text-zinc-200">${app}</div><div class="text-xl font-bold text-zinc-400">${formatTimeShort(data.totalTime)}</div></div>
        </div>`).join('');
}

async function loadAvailableDates() {
    const dates = await window.api.getAvailableDates();
    const selector = document.getElementById('date-selector');
    if(!selector) return;
    selector.innerHTML = dates.slice(0, 7).map(date => {
        const isActive = date === currentDate;
        return `<button onclick="selectDate('${date}')" class="px-3 py-1 text-xs font-medium rounded-md transition ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}">${formatDate(date)}</button>`;
    }).join('');
}

async function selectDate(date) {
    currentDate = date;
    loadDailyView(date);
    loadAvailableDates();
}


function startMonitoring() {
    if (isMonitoring) return;
    window.api.startMonitoring();
    isMonitoring = true;
    sessionStartTime = Date.now();
    document.getElementById('status-indicator').className = 'status-pulse active';
    document.getElementById('status-label').textContent = 'Monitoring';
    if (sessionInterval) clearInterval(sessionInterval);
    sessionInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        document.getElementById('timer-display').textContent = formatTimer(elapsed);
    }, 1000);
}

function stopMonitoring() {
    if (!isMonitoring) return;
    window.api.stopMonitoring();
    isMonitoring = false;
    document.getElementById('status-indicator').className = 'status-pulse idle';
    document.getElementById('status-label').textContent = 'Standby';
    if (sessionInterval) clearInterval(sessionInterval);
    setTimeout(() => { loadMonitorStats(); }, 500);
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('tab-active', btn.dataset.view === view));
    document.querySelectorAll('.view-section').forEach(s => s.classList.toggle('active', s.id === `view-${view}`));
    if (view === 'monitor') loadMonitorStats();
    if (view === 'daily') loadDailyView(currentDate);
    if (view === 'weekly') loadWeeklyView();
    if (view === 'monthly') loadMonthlyView();
}

window.api.onActivityUpdate((data) => {
    const nameEl = document.getElementById('current-app-name');
    const titleEl = document.getElementById('current-app-title');
    const timerEl = document.getElementById('timer-display');
    if(nameEl) nameEl.textContent = data.app || 'Desconhecido';
    if(titleEl) titleEl.textContent = data.title || 'Iniciando...';
    if(timerEl) timerEl.textContent = formatTimer(data.elapsedTime);
    if (currentView === 'monitor' && (data.elapsedTime % 10 === 0 || data.elapsedTime < 2)) {
        loadMonitorStats();
    }
});