export type EnvName = "dev" | "staging" | "prod";

const URLS: Record<EnvName, string> = {
  dev: process.env.REVISON_DEV_URL ?? "http://localhost:3000",
  staging: process.env.REVISON_STAGING_URL ?? "https://www.lostbae.com",
  prod: "https://www.lostbae.com",
};

export function resolveEnv(argv: string[]): EnvName {
  const flag = argv.find((a) => a.startsWith("--env="))?.split("=")[1];
  const fromEnv = process.env.REVISON_ENV;
  const name = (flag ?? fromEnv ?? "prod") as EnvName;
  return name in URLS ? name : "prod";
}

export function appUrl(env: EnvName): string {
  return (process.env.REVISON_APP_URL ?? URLS[env]).replace(/\/$/, "");
}

// Origins the BrowserWindow itself may navigate to. Everything else is
// cancelled and opened in the system browser. OAuth providers are full-page
// redirects in the web app (src/app/api/auth/[provider]/route.ts), so they
// must be navigable in-window for login to complete.
export function allowedNavigationHosts(env: EnvName): string[] {
  const app = new URL(appUrl(env)).hostname;
  return [
    app,
    app.replace(/^www\./, ""),
    "accounts.google.com",
    "accounts.youtube.com",
    "github.com",
    "discord.com",
    "localhost",
  ];
}
