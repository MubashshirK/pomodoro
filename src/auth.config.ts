import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/sign-in" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user && typeof user.id === "string") {
        const n = Number.parseInt(user.id, 10);
        if (Number.isFinite(n)) {
          token.id = n;
        }
      }
      if (user && typeof user.isGuest === "boolean") {
        token.isGuest = user.isGuest;
      }
      if (
        user &&
        (typeof user.name === "string" || user.name === null)
      ) {
        token.name = user.name;
      }
      if (trigger === "update") {
        const nextName = (session as { user?: { name?: unknown } } | undefined)
          ?.user?.name;
        if (typeof nextName === "string" || nextName === null) {
          token.name = nextName;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "number" && session.user) {
        session.user.id = String(token.id);
      }
      if (typeof token.isGuest === "boolean" && session.user) {
        session.user.isGuest = token.isGuest;
      }
      if (session.user && (typeof token.name === "string" || token.name === null)) {
        session.user.name = token.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig satisfies NextAuthConfig;
