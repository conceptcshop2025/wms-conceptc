import { NextResponse } from "next/server";
import { type NextAuthConfig } from "next-auth";
import { isSkusavvyAllowed } from "@/app/lib/auth/allowedEmails";

/** Everything else in the app stays public. */
const PROTECTED_PATHS = ["/skusavvy"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Edge safe part of the config: no provider, so the middleware bundle stays small
 * and free of Node only code. The providers live in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      if (!isProtectedPath(request.nextUrl.pathname)) return true;

      if (!auth?.user) return false;

      if (!auth.user.canAccessSkusavvy) {
        return NextResponse.redirect(new URL("/unauthorized", request.nextUrl));
      }

      return true;
    },
    jwt({ token, profile }) {
      // Entra ID only sends the `email` claim when the account has one set,
      // so fall back to the UPN to keep the whitelist check reliable.
      if (profile) {
        token.email = profile.email ?? profile.preferred_username ?? token.email;
      }

      return token;
    },
    session({ session, token }) {
      // Resolved on every session read instead of being baked into the token,
      // so removing an email from the whitelist takes effect immediately.
      session.user.canAccessSkusavvy = isSkusavvyAllowed(token.email);

      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
