const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    closeLauncher: () => ipcRenderer.invoke('close-launcher'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    startAuthFlow: () => ipcRenderer.invoke('start-auth-flow'),
    readAccounts: () => ipcRenderer.invoke('read-accounts'),
    deleteAccount: (accountId) => ipcRenderer.invoke('delete-account', accountId),
    removeAccounts: () => ipcRenderer.invoke('remove-accounts'),
    openClient: (account, clientPath, ramPreference) =>
        ipcRenderer.invoke('open-client', account, clientPath, ramPreference),
    clientExists: (clientPath) => ipcRenderer.invoke('client-exists', clientPath),
    checkFileChange: () => ipcRenderer.invoke('check-file-change'),
    refreshAccounts: () => ipcRenderer.invoke('refresh-accounts'),
    logError: (message) => ipcRenderer.invoke('log-error', message),
    errorAlert: (message) => ipcRenderer.invoke('error-alert', message),
    openLocation: (locationPath) => ipcRenderer.invoke('open-location', locationPath),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    getBundledClientPath: () => ipcRenderer.invoke('get-bundled-client-path'),
    getDevClientPath: () => ipcRenderer.invoke('get-dev-client-path'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    showLoadingModal: (message) => ipcRenderer.invoke('show-loading-modal', message),
    hideLoadingModal: () => ipcRenderer.invoke('hide-loading-modal'),
    installBrowsersWithFeedback: () => ipcRenderer.invoke('install-browsers-with-feedback'),
    checkPatchrightBrowsers: () => ipcRenderer.invoke('check-patchright-browsers'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        receive: (channel, func) =>
            ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
        invoke: (channel, data) => ipcRenderer.invoke(channel, data)
    }
});
