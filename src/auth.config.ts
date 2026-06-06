import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user && typeof user.id === "string") {
        const n = Number.parseInt(user.id, 10);
        if (Number.isFinite(n)) {
          token.id = n;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "number" && session.user) {
        session.user.id = String(token.id);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig satisfies NextAuthConfig;
