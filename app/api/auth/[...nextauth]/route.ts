import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data: doctor, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !doctor) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          doctor.password_hash
        );

        if (!isValid) return null;

        return {
          id: doctor.id,
          email: doctor.email,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST };
