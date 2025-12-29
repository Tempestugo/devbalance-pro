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
    }, 1000);
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
      if (duration > 2) {
        await this.database.saveSession({
          app: this.currentApp,
          title: this.currentTitle,
          duration: duration,
          domain: this.currentDomain,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  extractDomain(title) {
    if (!title) return null;
    const lowerTitle = title.toLowerCase();

    const knownSites = [
        { key: 'instagram', domain: 'instagram.com' },
        { key: 'notion', domain: 'notion.so' },
        { key: 'gemini.google', domain: 'gemini.google.com' },
        { key: 'chatgpt', domain: 'chatgpt.com' },
        { key: 'youtube', domain: 'youtube.com' },
        { key: 'github', domain: 'github.com' },
        { key: 'discord', domain: 'discord.com' },
        { key: 'google.com', domain: 'google.com' }
    ];

    for (const site of knownSites) {
        if (lowerTitle.includes(site.key)) return site.domain;
    }

    const match = lowerTitle.match(/([a-z0-9|-]+\.)*[a-z0-9|-]+\.[a-z]+/g);
    return match ? match[0] : null;
  }

  sanitizeTitle(title) {
    if (!title) return 'Sem título';
    if (title.includes(' – ')) return title.split(' – ')[0];
    if (title.includes(' - ')) return title.split(' - ')[0];
    return title.replace(/[A-Z]:\\.+?\\/gi, '').substring(0, 150);
  }

  getAppName(window) {
    if (!window || !window.owner) return 'Desconhecido';
    const ownerName = window.owner.name.toLowerCase();

    if (ownerName.includes('idea')) return 'IntelliJ IDEA';
    if (ownerName.includes('code')) return 'Visual Studio Code';
    if (ownerName.includes('chrome')) return 'Google Chrome';

    return ownerName.replace('.exe', '').split(/[\\/]/).pop();
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

module.exports = ActivityMonitor;