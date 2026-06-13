import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  shell,
  session,
  nativeImage,
  dialog,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import { resolveEnv, appUrl, allowedNavigationHosts } from "./config";
import { initAutoUpdate } from "./updater";

const env = resolveEnv(process.argv);
const targetUrl = appUrl(env);
const allowedHosts = allowedNavigationHosts(env);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// --- single instance lock ---
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// --- window state persistence ---
type WindowState = { width: number; height: number; x?: number; y?: number };
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");

function loadWindowState(): WindowState {
  try {
    return { width: 1280, height: 800, ...JSON.parse(fs.readFileSync(stateFile(), "utf8")) };
  } catch {
    return { width: 1280, height: 800 };
  }
}

function saveWindowState(win: BrowserWindow) {
  try {
    if (!win.isMinimized() && !win.isFullScreen()) {
      const b = win.getBounds();
      fs.writeFileSync(stateFile(), JSON.stringify(b));
    }
  } catch {
    // best-effort
  }
}

function isAllowedHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname;
    return allowedHosts.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function offlinePage(): string {
  return path.join(__dirname, "..", "static", "offline.html");
}

function iconImage() {
  return nativeImage.createFromPath(path.join(__dirname, "..", "build", "icon.png"));
}

function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 800,
    minHeight: 600,
    title: "lostbae",
    icon: iconImage(),
    backgroundColor: "#f1f5f2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const wc = mainWindow.webContents;

  // External links (window.open / target=_blank) → system browser.
  wc.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Top-level navigation allowlist; anything else → system browser.
  wc.on("will-navigate", (event, url) => {
    if (!isAllowedHost(url) && !url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Offline / load-failure fallback instead of a blank window.
  wc.on("did-fail-load", (_e, code, _desc, validatedUrl, isMainFrame) => {
    // -3 = aborted (e.g. redirects) — not a real failure
    if (isMainFrame && code !== -3 && !validatedUrl.startsWith("file://")) {
      mainWindow?.loadFile(offlinePage());
    }
  });

  mainWindow.on("resized", () => mainWindow && saveWindowState(mainWindow));
  mainWindow.on("moved", () => mainWindow && saveWindowState(mainWindow));

  // Tray "hide" keeps the app running; window close quits normally on Windows,
  // hides on macOS per platform convention.
  mainWindow.on("close", (e) => {
    if (process.platform === "darwin" && !isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    } else {
      mainWindow && saveWindowState(mainWindow);
    }
  });

  mainWindow.loadURL(targetUrl);
}

function createTray() {
  const trayIcon = iconImage().resize({ width: 18, height: 18 });
  trayIcon.setTemplateImage(false);
  tray = new Tray(trayIcon);
  tray.setToolTip("lostbae");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show lostbae",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { label: "Hide", click: () => mainWindow?.hide() },
      { type: "separator" },
      {
        label: `Environment: ${env} (${targetUrl})`,
        enabled: false,
      },
      { type: "separator" },
      {
        label: "Quit lostbae",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.focus() : mainWindow.show();
    }
  });
}

function createMenu() {
  // Standard roles only — no accelerators that shadow in-app shortcuts
  // (Cmd+K palette, Cmd+/ commands, Cmd+Shift+H highlighter live in the web app).
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: "Launch at Login",
                type: "checkbox" as const,
                checked: app.getLoginItemSettings().openAtLogin,
                click: (item: Electron.MenuItem) =>
                  app.setLoginItemSettings({ openAtLogin: item.checked }),
              },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload App",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.loadURL(targetUrl),
        },
        ...(!isMac
          ? [
              {
                label: "Launch at Login",
                type: "checkbox" as const,
                checked: app.getLoginItemSettings().openAtLogin,
                click: (item: Electron.MenuItem) =>
                  app.setLoginItemSettings({ openAtLogin: item.checked }),
              },
              { role: "quit" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(env !== "prod" ? [{ role: "toggleDevTools" as const }] : []),
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Open lostbae in Browser",
          click: () => shell.openExternal(targetUrl),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Poll the app's /api/badge endpoint (authed via the shared session cookie
// in the window's net session) and reflect the due-review count on the dock
// badge (macOS) and tray tooltip. Best-effort: failures are ignored.
function startBadgePolling() {
  const poll = async () => {
    try {
      // Use the window's own session.fetch so the rm_session cookie rides along.
      const ses = mainWindow?.webContents.session ?? session.defaultSession;
      const res = await ses.fetch(`${targetUrl}/api/badge`);
      if (!res.ok) return;
      const data = (await res.json()) as { due?: number; authenticated?: boolean };
      const due = data.authenticated ? data.due ?? 0 : 0;

      if (process.platform === "darwin" && app.dock) {
        app.dock.setBadge(due > 0 ? String(due) : "");
      }
      if (tray) {
        tray.setToolTip(due > 0 ? `lostbae — ${due} review${due !== 1 ? "s" : ""} due` : "lostbae");
      }
    } catch {
      // offline or not signed in — leave badge as-is
    }
  };

  poll();
  setInterval(poll, 5 * 60 * 1000); // every 5 minutes
}

app.whenReady().then(() => {
  // Clipboard works for copy buttons / CollapsibleImage "Copy"; everything
  // else (camera, mic, geolocation…) is denied — the web app doesn't use them.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(["clipboard-read", "clipboard-sanitized-write"].includes(permission));
  });

  createWindow();
  createMenu();
  initAutoUpdate();
  try {
    createTray();
  } catch (err) {
    // Tray is non-critical; never block startup on it.
    console.error("Tray init failed:", err);
  }
  startBadgePolling();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (err) => {
  dialog.showErrorBox("lostbae", `Unexpected error: ${err.message}`);
});
