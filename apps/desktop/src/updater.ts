import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";

// Checks GitHub Releases (goutam-raj-s/revision-master) for a newer shell,
// downloads in the background, and offers a restart once ready.
// Failures must never block startup (Story 11.7 AC: silent failover).
// NOTE: on macOS, electron-updater can only APPLY updates to a code-signed
// app; until signing lands, macOS checks run but installation is skipped.
export function initAutoUpdate() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (err) => {
    console.error("Auto-update error (ignored):", err.message);
  });

  autoUpdater.on("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Update ready",
        message: `lostbae ${info.version} has been downloaded.`,
        detail: "Restart the app to apply the update.",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      })
      .catch(() => {});
  });

  autoUpdater.checkForUpdates().catch((err) => {
    console.error("Update check failed (ignored):", err.message);
  });

  // Re-check every 4 hours while the app stays open.
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 4 * 60 * 60 * 1000);
}
