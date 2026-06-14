import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOAuthAppUrl } from "@/lib/auth/oauth-url";
import { getSession } from "@/lib/auth/session";
import { exchangeCode, storeConnection, isSocialProvider } from "@/lib/social";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isSocialProvider(provider)) {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const storedState = request.cookies.get(`social_state_${provider}`)?.value;
  const verifier = request.cookies.get(`social_verifier_${provider}`)?.value;

  const fail = (reason: string) => {
    const r = NextResponse.redirect(
      new URL(`/posts?social=${provider}&status=error&reason=${reason}`, request.url)
    );
    r.cookies.set(`social_state_${provider}`, "", { maxAge: 0, path: "/" });
    r.cookies.set(`social_verifier_${provider}`, "", { maxAge: 0, path: "/" });
    return r;
  };

  if (oauthError) return fail(oauthError);
  if (!code || !state || state !== storedState) return fail("state_mismatch");

  try {
    const appUrl = getOAuthAppUrl(request);
    const redirectUri = `${appUrl}/api/social/${provider}/callback`;
    const tokens = await exchangeCode(provider, code, redirectUri, verifier);
    await storeConnection(user.id, provider, tokens);

    const ok = NextResponse.redirect(
      new URL(`/posts?social=${provider}&status=connected`, request.url)
    );
    ok.cookies.set(`social_state_${provider}`, "", { maxAge: 0, path: "/" });
    ok.cookies.set(`social_verifier_${provider}`, "", { maxAge: 0, path: "/" });
    return ok;
  } catch (err) {
    console.error(`[social/${provider}] callback error:`, err);
    return fail("exchange_failed");
  }
}
