const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  startMonitoring: () => {
    ipcRenderer.send('start-monitoring');
  },

  stopMonitoring: () => {
    ipcRenderer.send('stop-monitoring');
  },

    onActivityUpdate: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('activity-update', listener);
        return () => {
          ipcRenderer.removeListener('activity-update', listener);
        };
    },
  getStats: async () => {
    return await ipcRenderer.invoke('get-stats');
  },

  getStatsByDate: async (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }
    return await ipcRenderer.invoke('get-stats-by-date', date);
  },
  getAvailableDates: async () => {
    return await ipcRenderer.invoke('get-available-dates');
  },
  clearOldData: async (days) => {
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      throw new Error('Dias deve ser um número positivo');
    }
    return await ipcRenderer.invoke('clear-old-data', daysNum);
  }
});

console.log('🔒 Preload: API segura exposta');