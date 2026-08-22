/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

let mainWindow;
let setupWindow;
let store;
let hasCheckedForUpdates = false;

const setupHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CafeQR Setup</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f5f4; color: #1c1917; font-family: Arial, sans-serif; }
      main { width: min(100%, 360px); padding: 32px; background: #fff; border: 1px solid #e7e5e4; border-radius: 20px; box-shadow: 0 16px 40px rgba(28, 25, 23, 0.12); }
      h1 { margin: 0 0 8px; font-size: 24px; }
      p { margin: 0 0 24px; color: #57534e; line-height: 1.5; }
      label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
      input { width: 100%; padding: 12px; border: 1px solid #a8a29e; border-radius: 10px; font-size: 16px; }
      button { width: 100%; margin-top: 16px; padding: 12px; border: 0; border-radius: 10px; background: #18181b; color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; }
      button:disabled { cursor: wait; opacity: 0.65; }
      #error { min-height: 18px; margin: 12px 0 0; color: #b91c1c; font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <h1>CafeQR Cashier</h1>
      <p>Enter this terminal's cafe slug. It cannot be changed from the app after setup.</p>
      <form id="setup-form">
        <label for="cafe-slug">Cafe slug</label>
        <input id="cafe-slug" name="cafeSlug" autocomplete="off" autofocus required />
        <button type="submit">Start cashier</button>
        <p id="error" role="alert"></p>
      </form>
    </main>
    <script>
      const form = document.getElementById("setup-form");
      const input = document.getElementById("cafe-slug");
      const button = form.querySelector("button");
      const error = document.getElementById("error");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        error.textContent = "";
        button.disabled = true;

        try {
          await window.cafeQrSetup.saveCafeSlug(input.value);
        } catch (saveError) {
          error.textContent = saveError.message || "Unable to save the cafe slug.";
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`;

function validateCafeSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Enter a valid cafe slug using lowercase letters, numbers, and hyphens.");
  }

  return slug;
}

async function checkForPrinters() {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();

    if (printers.length === 0) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "No printers found",
        message: "No printers were detected. Connect or configure a printer before printing receipts.",
        buttons: ["Setup Later", "Exit App"],
        defaultId: 0,
        cancelId: 0,
      });

      if (response === 1) {
        app.quit();
      }
    }
  } catch (error) {
    console.error("Unable to check printer availability:", error);
  }
}

function checkForUpdates() {
  if (hasCheckedForUpdates) {
    return;
  }

  hasCheckedForUpdates = true;
  void autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error("Unable to check for updates:", error);
  });
}

async function printReceipt(html) {
  if (typeof html !== "string" || html.length === 0) {
    throw new Error("A receipt HTML payload is required.");
  }

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    await new Promise((resolve, reject) => {
      printWindow.webContents.print({ silent: true }, (success, failureReason) => {
        if (success) {
          resolve();
          return;
        }

        reject(new Error(failureReason || "The receipt could not be printed."));
      });
    });

    return { success: true };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
}

function createPosWindow(cafeSlug) {
  mainWindow = new BrowserWindow({
    frame: false,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.once("did-finish-load", checkForPrinters);
  mainWindow.once("ready-to-show", checkForUpdates);
  mainWindow.loadURL(`https://qerve.egokam.site/${cafeSlug}/cashier`);
}

function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 420,
    height: 430,
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, "setup-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle("save-cafe-slug", async (event, value) => {
    if (!setupWindow || event.sender.id !== setupWindow.webContents.id || store.get("cafeSlug")) {
      throw new Error("Cafe setup is no longer available.");
    }

    const cafeSlug = validateCafeSlug(value);
    store.set("cafeSlug", cafeSlug);

    const windowToClose = setupWindow;
    setupWindow = undefined;
    ipcMain.removeHandler("save-cafe-slug");
    windowToClose.destroy();
    createPosWindow(cafeSlug);

    return { success: true };
  });

  setupWindow.on("closed", () => {
    setupWindow = undefined;
    ipcMain.removeHandler("save-cafe-slug");
  });

  void setupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(setupHtml)}`);
}

function createStartupWindow() {
  const cafeSlug = store.get("cafeSlug");

  if (typeof cafeSlug === "string" && cafeSlug.length > 0) {
    createPosWindow(cafeSlug);
    return;
  }

  createSetupWindow();
}

app.whenReady().then(async () => {
  const { default: Store } = await import("electron-store");
  store = new Store();

  ipcMain.handle("print-receipt", (_event, html) => printReceipt(html));
  createStartupWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartupWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
