// src/monitor.js
class ActivityMonitor {
  constructor(database) {
    this.database = database;
    this.currentApp = null;
    this.currentTitle = null;
    this.currentDomain = null;
    this.startTime = null;
    this.isMonitoring = false;
    this.interval = null;
    this.activeWinLib = null; 
  }

  async start(callback) {
    if (this.isMonitoring) return;

    try {
      if (!this.activeWinLib) {
        const mod = await import('active-win');
        this.activeWinLib = mod.activeWindow || mod.default;
      }
    } catch (err) {
      console.error('❌ Falha ao carregar active-win:', err);
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Monitoramento iniciado (v7+ compatível)...');

    this.interval = setInterval(async () => {
      try {
        const result = await this.activeWinLib();

        if (result) {
          const appName = this.getAppName(result);
          const windowTitle = this.sanitizeTitle(result.title);
          const domain = this.extractDomain(result.title);

          if (appName !== this.currentApp || domain !== this.currentDomain) {
            await this.saveCurrentSession();
            this.currentApp = appName;
            this.currentTitle = windowTitle;
            this.currentDomain = domain;
            this.startTime = Date.now();
          }

          if (callback) {
            callback({
              app: this.currentApp,
              title: this.currentTitle,
              elapsedTime: this.getElapsedTime(),
              domain: this.currentDomain
            });
          }
        }
      } catch (error) {
        if (!error.message.includes('External buffers')) {
           console.error('❌ Erro no ciclo:', error.message);
        }
      }
    }, 2000);
  }

  async stop() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;
    await this.saveCurrentSession();
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  async saveCurrentSession() {
    if (this.currentApp && this.startTime) {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      if (duration > 3) {
        await this.database.saveSession({
          app: this.currentApp,
          title: this.currentTitle,
          duration: duration,
          domain: this.currentDomain,
          timestamp: new Date().toISOString()
        });
        console.log(`💾 Sessão salva: ${this.currentApp} (${duration}s)`);
      }
    }
  }

  extractDomain(title) {
    if (!title) return null;
    const lowerTitle = title.toLowerCase();
    const knownSites = {
      'gemini': 'gemini.google.com', 'claude': 'claude.ai',
      'chatgpt': 'chatgpt.com', 'notion': 'notion.so',
      'discord': 'discord.com', 'github': 'github.com',
      'youtube': 'youtube.com', 'google': 'google.com'
    };
    for (const [key, domain] of Object.entries(knownSites)) {
      if (lowerTitle.includes(key)) return domain;
    }
    return null;
  }

  sanitizeTitle(title) {
    if (!title) return 'Sem título';
    return title.replace(/[A-Z]:\\.+?\\/gi, '').substring(0, 150);
  }

  getAppName(window) {
    if (!window || !window.owner) return 'Desconhecido';
    const ownerName = window.owner.name.toLowerCase();
    if (ownerName.includes('idea')) return 'IntelliJ IDEA';
    if (ownerName.includes('code')) return 'Visual Studio Code';
    if (ownerName.includes('chrome')) return 'Google Chrome';
    if (ownerName.includes('powershell')) return 'PowerShell';

    return ownerName.replace('.exe', '').split(/[\\/]/).pop();
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

module.exports = ActivityMonitor;