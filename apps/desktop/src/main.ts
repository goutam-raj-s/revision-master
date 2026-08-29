import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  shell,
  session,
  nativeImage,
  dialog,
  ipcMain,
  protocol,
} from "electron";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as crypto from "crypto";
import { spawn } from "child_process";
import { Readable } from "stream";
import { resolveEnv, appUrl, allowedNavigationHosts } from "./config";
import { initAutoUpdate } from "./updater";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const env = resolveEnv(process.argv);
const targetUrl = appUrl(env);
const allowedHosts = allowedNavigationHosts(env);
const MEDIA_PROTOCOL = "lostbae-media";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
const mediaFiles = new Map<string, string>();
const sourceFiles = new Map<string, string>();
const tempFilesBySource = new Map<string, string>();
const mediaTempDir = path.join(os.tmpdir(), "lostbae-media");

protocol.registerSchemesAsPrivileged([
  {
    scheme: MEDIA_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
]);

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

type FfprobeStream = {
  index: number;
  codec_type?: string;
  codec_name?: string;
  channels?: number;
  tags?: Record<string, string | undefined>;
  disposition?: Record<string, number | undefined>;
};

type AudioTrackInfo = {
  id: string;
  streamIndex: number;
  label: string;
  language?: string;
  codec?: string;
  channels?: number;
  default: boolean;
};

function mediaUrlFor(filePath: string) {
  const id = crypto.randomUUID();
  mediaFiles.set(id, filePath);
  return `${MEDIA_PROTOCOL}://${id}/${encodeURIComponent(path.basename(filePath))}`;
}

function contentTypeFor(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".mp4":
    case ".m4v":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".ogg":
    case ".ogv":
      return "video/ogg";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

function sourceIdFor(filePath: string) {
  const id = crypto.randomUUID();
  sourceFiles.set(id, filePath);
  return id;
}

function cleanupTempFile(filePath: string | undefined) {
  if (!filePath) return;
  fs.rm(filePath, { force: true }, () => undefined);
}

function resetMediaSession() {
  for (const filePath of tempFilesBySource.values()) cleanupTempFile(filePath);
  mediaFiles.clear();
  sourceFiles.clear();
  tempFilesBySource.clear();
}

function runProcess(command: string, args: string[], timeoutMs: number, errorMessage: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error(errorMessage));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(errorMessage));
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        console.error(stderr || `${command} exited with code ${code}`);
        reject(new Error(errorMessage));
      }
    });
  });
}

async function probeAudioTracks(filePath: string): Promise<AudioTrackInfo[]> {
  const ffprobePath = ffprobeStatic.path || "ffprobe";
  const { stdout } = await runProcess(
    ffprobePath,
    ["-v", "error", "-print_format", "json", "-show_streams", filePath],
    20_000,
    "Could not inspect audio tracks for this video."
  );
  const parsed = JSON.parse(stdout) as { streams?: FfprobeStream[] };
  const streams = parsed.streams?.filter((stream) => stream.codec_type === "audio") ?? [];

  return streams.map((stream, ordinal) => {
    const language = stream.tags?.language;
    const title = stream.tags?.title;
    const codec = stream.codec_name?.toUpperCase();
    const defaultTrack = stream.disposition?.default === 1;
    const parts = [
      title || `Audio ${ordinal + 1}`,
      language?.toUpperCase(),
      codec,
      stream.channels ? `${stream.channels}ch` : undefined,
      defaultTrack ? "Default" : undefined,
    ].filter(Boolean);

    return {
      id: `desktop-audio-${stream.index}`,
      streamIndex: stream.index,
      label: parts.join(" · "),
      language,
      codec: stream.codec_name,
      channels: stream.channels,
      default: defaultTrack,
    };
  });
}

async function remuxWithAudioTrack(fileId: string, filePath: string, streamIndex: number) {
  const command = ffmpegPath || "ffmpeg";
  const safeBase = path.basename(filePath).replace(/[^a-z0-9._-]+/gi, "-");
  fs.mkdirSync(mediaTempDir, { recursive: true });
  const outputPath = path.join(
    mediaTempDir,
    `${crypto.randomUUID()}-${streamIndex}-${safeBase}.mp4`
  );

  const baseArgs = [
    "-y",
    "-i",
    filePath,
    "-map",
    "0:v:0?",
    "-map",
    `0:${streamIndex}`,
    "-sn",
    "-c:v",
    "copy",
    "-movflags",
    "faststart",
  ];

  try {
    await runProcess(
      command,
      [...baseArgs, "-c:a", "copy", outputPath],
      10 * 60_000,
      "Could not prepare that audio track."
    );
  } catch {
    try {
      await runProcess(
        command,
        [...baseArgs, "-c:a", "aac", "-b:a", "192k", outputPath],
        10 * 60_000,
        "Could not prepare that audio track."
      );
    } catch {
      await runProcess(
        command,
        [
          "-y",
          "-i",
          filePath,
          "-map",
          "0:v:0?",
          "-map",
          `0:${streamIndex}`,
          "-sn",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "22",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "faststart",
          outputPath,
        ],
        20 * 60_000,
        "Could not prepare that audio track."
      );
    }
  }

  cleanupTempFile(tempFilesBySource.get(fileId));
  tempFilesBySource.set(fileId, outputPath);
  return mediaUrlFor(outputPath);
}

function shouldPrepareForBrowser(filePath: string) {
  return ![".mp4", ".m4v", ".webm", ".ogg", ".ogv"].includes(
    path.extname(filePath).toLowerCase()
  );
}

function assertAllowedSender(event: Electron.IpcMainInvokeEvent) {
  const url = event.senderFrame?.url;
  if (!url || !isAllowedHost(url)) {
    throw new Error("Desktop media is not available from this page.");
  }
}

function registerMediaHandlers() {
  protocol.handle(MEDIA_PROTOCOL, (request) => {
    const id = new URL(request.url).hostname;
    const filePath = mediaFiles.get(id);
    if (!filePath) {
      return new Response("Media not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const range = request.headers.get("range");
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Content-Type": contentTypeFor(filePath),
    });

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start >= stat.size || end >= stat.size || start > end) {
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${stat.size}` },
          });
        }

        headers.set("Content-Length", String(end - start + 1));
        headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        return new Response(
          Readable.toWeb(fs.createReadStream(filePath, { start, end })) as BodyInit,
          { status: 206, headers }
        );
      }
    }

    headers.set("Content-Length", String(stat.size));
    return new Response(
      Readable.toWeb(fs.createReadStream(filePath)) as BodyInit,
      { status: 200, headers }
    );
  });

  ipcMain.handle("desktop-media:open-video", async (event) => {
    assertAllowedSender(event);
    const options: Electron.OpenDialogOptions = {
      properties: ["openFile"],
      filters: [
        {
          name: "Video",
          extensions: ["mp4", "mkv", "webm", "avi", "mov", "wmv", "ogv", "3gp"],
        },
      ],
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);

    if (result.canceled || !result.filePaths[0]) {
      return { canceled: true };
    }

    resetMediaSession();
    const filePath = result.filePaths[0];
    const fileId = sourceIdFor(filePath);
    const audioTracks = await probeAudioTracks(filePath);
    const defaultAudio = audioTracks.find((track) => track.default) ?? audioTracks[0];
    const videoUrl =
      shouldPrepareForBrowser(filePath) && defaultAudio
        ? await remuxWithAudioTrack(fileId, filePath, defaultAudio.streamIndex)
        : mediaUrlFor(filePath);

    return {
      canceled: false,
      fileId,
      fileName: path.basename(filePath),
      videoUrl,
      audioTracks,
    };
  });

  ipcMain.handle(
    "desktop-media:select-audio-track",
    async (event, payload: { fileId?: string; streamIndex?: number }) => {
      assertAllowedSender(event);
      const filePath = payload.fileId ? sourceFiles.get(payload.fileId) : null;
      if (!filePath || typeof payload.streamIndex !== "number") {
        throw new Error("Missing media file or audio stream");
      }

      return {
        videoUrl: await remuxWithAudioTrack(
          payload.fileId!,
          filePath,
          payload.streamIndex
        ),
      };
    }
  );
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

  mainWindow.on("resized", () => {
    if (mainWindow) saveWindowState(mainWindow);
  });
  mainWindow.on("moved", () => {
    if (mainWindow) saveWindowState(mainWindow);
  });

  // Tray "hide" keeps the app running; window close quits normally on Windows,
  // hides on macOS per platform convention.
  mainWindow.on("close", (e) => {
    if (process.platform === "darwin" && !isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    } else {
      if (mainWindow) saveWindowState(mainWindow);
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
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
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
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" },
        // DevTools available in all builds so production issues can be diagnosed.
        { role: "toggleDevTools" as const },
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

app.whenReady().then(async () => {
  fs.rmSync(mediaTempDir, { recursive: true, force: true });
  registerMediaHandlers();

  // Clipboard works for copy buttons / CollapsibleImage "Copy"; everything
  // else (camera, mic, geolocation…) is denied — the web app doesn't use them.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(["clipboard-read", "clipboard-sanitized-write"].includes(permission));
  });

  // Drop the HTTP cache on every launch. The wrapper points at a frequently
  // redeployed web app (Vercel); a cached HTML document referencing old
  // Next.js chunk hashes that no longer exist on the server renders a blank
  // page. Clearing the cache here makes each launch fetch the current build.
  try {
    await session.defaultSession.clearCache();
  } catch {
    // best-effort
  }

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
  resetMediaSession();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (err) => {
  dialog.showErrorBox("lostbae", `Unexpected error: ${err.message}`);
});
