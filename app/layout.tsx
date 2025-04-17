import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/providers/next-auth-providers";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vault IITBBS",
  description: "Created and maintained by WebnD",
  icons: {
    icon: "/iitlogo.png", // 👈 This sets the favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster/>
          <PageTransition>
          {/* <Toaster/> */}
          
          <Navbar/>
        {children}
        {/* <Footer /> */}
        </PageTransition>
        </ThemeProvider>
        </NextAuthProvider>

        </body>
    </html>
  );
}
