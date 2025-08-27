import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        console.log("Credentials received:", credentials);
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await pool.query("SELECT * FROM users WHERE email = $1", [
            credentials.email,
          ]);
          const user = res.rows[0];
          if (user && (await bcrypt.compare(credentials.password, user.password))) {
            const selectedRole = credentials.role;

            // Ensure roles is always an array
            const validRoles = Array.isArray(user.roles)
              ? user.roles
              : JSON.parse(user.roles || "[]");

            const activeRole = validRoles.includes(selectedRole)
              ? selectedRole
              : validRoles[0];

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              roles: validRoles,
              activeRole,
            };
          }
          return null;
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // ✅ fixed
  session: {
    strategy: "jwt", // ✅ explicit
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.roles = token.roles;
        session.user.activeRole = token.activeRole;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.activeRole = user.activeRole;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/register",
  },
};

export default NextAuth(authOptions);