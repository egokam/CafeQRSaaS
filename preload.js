/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  printReceipt: (html) => ipcRenderer.invoke("print-receipt", html),
});
