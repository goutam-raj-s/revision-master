import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("__REVISON_DESKTOP__", {
  shell: "electron",
  version: process.env.npm_package_version ?? "1.0.0",
  media: {
    openVideo: () => ipcRenderer.invoke("desktop-media:open-video"),
    selectAudioTrack: (fileId: string, streamIndex: number) =>
      ipcRenderer.invoke("desktop-media:select-audio-track", {
        fileId,
        streamIndex,
      }),
  },
});
