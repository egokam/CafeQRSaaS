/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cafeQrSetup", {
  saveCafeSlug: (slug) => ipcRenderer.invoke("save-cafe-slug", slug),
});
