// Intentionally minimal: the shell exposes nothing to the remote page.
// contextIsolation is on and nodeIntegration is off; the web app runs
// exactly as it does in a browser. A marker is exposed so the web app
// could detect the desktop shell in the future without any code change now.
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("__REVISON_DESKTOP__", {
  shell: "electron",
  version: process.env.npm_package_version ?? "1.0.0",
});
