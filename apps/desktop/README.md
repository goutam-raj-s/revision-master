# lostbae Desktop (Electron thin wrapper)

Loads the deployed lostbae web app (`https://www.lostbae.com`) in a native window. No bundled server, no offline mode — every web deploy is instantly reflected in the desktop app with no desktop release.

## Develop

```bash
cd apps/desktop
npm install
npm run dev          # opens shell against http://localhost:3000 (dev env)
npm start            # opens shell against production
```

Environment selection: `--env=dev|staging|prod` (default `prod`), or `REVISON_ENV` / `REVISON_APP_URL` env vars.

## Build installers

```bash
npm run build:mac    # release/lostbae-1.0.0.dmg (Intel) + lostbae-1.0.0-arm64.dmg (Apple Silicon)
npm run build:win    # release/lostbae Setup 1.0.0.exe (NSIS, x64)
```

Builds run locally via npm scripts; CI automation is out of scope.

## Auto-update (Story 11.7)

The shell checks GitHub Releases (`goutam-raj-s/revision-master`) on launch and every 4 hours, downloads new versions in the background, and offers a restart. Failed checks never block startup.

To ship a shell update:

```bash
# 1. bump "version" in package.json (e.g. 1.0.1)
# 2. build + publish artifacts to a GitHub Release:
export GH_TOKEN=<github personal access token with repo scope>
npm run compile && npx electron-builder --mac --x64 --arm64 --win --publish always
```

Installed apps pick it up automatically on next launch.

**Platform caveats:**
- **Windows**: auto-update works today, even unsigned.
- **macOS**: electron-updater can only *apply* updates to a code-signed app. Until an Apple Developer certificate is configured, macOS users get the update check but must reinstall from the new DMG manually. Web-app changes still sync instantly on both platforms regardless.

## Installing unsigned builds

Builds are currently **unsigned** (code signing/notarization is the stretch Story 11.7).

- **macOS**: Gatekeeper shows "lostbae can't be opened — unidentified developer." Bypass: right-click the app → **Open** → Open, or `System Settings → Privacy & Security → Open Anyway`. On newer macOS you may need: `xattr -dr com.apple.quarantine /Applications/lostbae.app`.
- **Windows**: SmartScreen shows "Windows protected your PC." Click **More info → Run anyway**.

## Behavior notes

- OAuth (Google/GitHub/Discord, Google Docs import) completes fully in-window — the web app uses same-window redirects back to the hosted origin, so no custom protocol is needed. Navigation is allowlisted to the app origin + provider domains; everything else opens in the system browser.
- `contextIsolation: true`, `nodeIntegration: false`, sandboxed renderer; only clipboard permissions are granted.
- Single-instance lock, window size/position persistence, system tray (Show/Hide/Quit), optional "Launch at Login" toggle in the app/File menu.
- Offline or load failure shows a fallback screen with retry + 5s auto-reconnect.
- On macOS, closing the window hides to tray/dock (platform convention); quit from the menu or tray.
