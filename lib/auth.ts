import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { checkExistence, CreateNewUser } from "./action";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase() ?? "";
      const emailDomain = email.split("@")[1];
  
      // Restrict email domain
      if (emailDomain !== "iitbbs.ac.in") {
        return false; // Reject sign-in
      }
      try {
        // Creating user 
        const response = await checkExistence(email);
        if (!response) {
          // Create a new user if not found
          let role = "Student";
          if(email.includes('secy'))
            role = "Society"
          await CreateNewUser(user.name!, email, user.image!, role);
        }

      } catch (error) {
        console.error("Error creating user:", error);
      }

      return true; // Always return true to allow sign-in
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub;
      }
      return token;
    },

  },
};