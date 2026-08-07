import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Renamed from `middleware.ts` in Next.js 16. The route protection itself lives
// in the `authorized` callback of auth.config.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/skusavvy", "/skusavvy/:path*"],
};
