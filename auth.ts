import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signInSchema } from "@/lib/validation/auth";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.NEXT_AUTH_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role ?? UserRole.SUBSCRIBER;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : "";
        session.user.role = token.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.SUBSCRIBER;
      }
      return session;
    },
  },
});
