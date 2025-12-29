
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
class Database {
  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'activity-data');
    this.ensureDataDirectory();
    console.log('💾 Banco de dados inicializado em:', this.dataPath);
  }
    ensureDataDirectory() {
        if (!fs.existsSync(this.dataPath)) {
            try {
                fs.mkdirSync(this.dataPath, { recursive: true });
                console.log('✅ Pasta de dados criada com sucesso');
            } catch (err) {
                console.error('❌ Falha crítica ao criar pasta de dados:', err);
            }
        }
    }
  getFilePath(date) {
    return path.join(this.dataPath, `${date}.json`);
  }
  getTodayDate() {
    // Retorna a data no fuso de Brasilia (YYYY-MM-DD) para agrupar arquivos por dia local
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    } catch (e) {
      const now = new Date();
      return now.toISOString().split('T')[0];
    }
  }
  async saveSession(session) {
    const date = session.date || this.getTodayDate();
    const filePath = this.getFilePath(date);
    try {
      let data = { sessions: [], date };
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent);
      }
      data.sessions.push({
        app: session.app,
        title: session.title,
        domain: session.domain,
        duration: session.duration,
        timestamp: session.timestamp || new Date().toISOString()
      });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Sessão salva: ${session.app} (${session.duration}s)`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      return false;
    }
  }
  async getDataByDate(date) {
    const filePath = this.getFilePath(date);
    try {
      if (!fs.existsSync(filePath)) {
        return { sessions: [], date };
      }
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('❌ Erro ao ler dados:', error);
      return { sessions: [], date };
    }
  }
  async getStatsByDate(date) {
    const data = await this.getDataByDate(date);
    return this.aggregateStats(data.sessions);
  }
  async getTodayStats() {
    return await this.getStatsByDate(this.getTodayDate());
  }
  aggregateStats(sessions) {
    const stats = {};
    sessions.forEach(session => {
      if (!stats[session.app]) {
        stats[session.app] = {
          totalTime: 0,
          sessions: 0,
          lastUsed: session.timestamp,
          domains: {} 
        };
      }
      stats[session.app].totalTime += session.duration;
      stats[session.app].sessions++;
      if (session.timestamp > stats[session.app].lastUsed) {
        stats[session.app].lastUsed = session.timestamp;
      }
      if (session.domain) {
        if (!stats[session.app].domains[session.domain]) {
          stats[session.app].domains[session.domain] = {
            totalTime: 0,
            visits: 0,
            titles: []
          };
        }
        stats[session.app].domains[session.domain].totalTime += session.duration;
        stats[session.app].domains[session.domain].visits++;
        if (stats[session.app].domains[session.domain].titles.length < 3) {
          if (!stats[session.app].domains[session.domain].titles.includes(session.title)) {
            stats[session.app].domains[session.domain].titles.push(session.title);
          }
        }
      }
    });
    return stats;
  }
  async getAvailableDates() {
    try {
      const files = fs.readdirSync(this.dataPath);
      const dates = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
        .sort()
        .reverse(); 
      return dates;
    } catch (error) {
      console.error('❌ Erro ao listar datas:', error);
      return [];
    }
  }
  async clearOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      // Garantir comparação por data local (Brasilia)
      const cutoffString = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(cutoffDate);
      const files = fs.readdirSync(this.dataPath);
      let deletedCount = 0;
      files.forEach(file => {
        const date = file.replace('.json', '');
        if (date < cutoffString) {
          fs.unlinkSync(path.join(this.dataPath, file));
          deletedCount++;
        }
      });
      console.log(`🗑️ Removidos ${deletedCount} arquivos antigos`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      return 0;
    }
  }
  async getSummary(days = 7) {
    try {
      const dates = await this.getAvailableDates();
      const recentDates = dates.slice(0, days);
      let totalTime = 0;
      let totalSessions = 0;
      const appUsage = {};
      for (const date of recentDates) {
        const data = await this.getDataByDate(date);
        data.sessions.forEach(session => {
          totalTime += session.duration;
          totalSessions++;
          if (!appUsage[session.app]) {
            appUsage[session.app] = 0;
          }
          appUsage[session.app] += session.duration;
        });
      }
      return {
        totalTime,
        totalSessions,
        appUsage,
        daysTracked: recentDates.length
      };
    } catch (error) {
      console.error('❌ Erro ao gerar resumo:', error);
      return null;
    }
  }
}
module.exports = Database;