import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { FaviconSwitcher } from "@/components/favicon-switcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocsGPT - Your trusted documentation assistant",
  description: "An AI-powered documentation assistant that provides accurate answers from your documentation. Get instant, reliable responses based on your docs.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FaviconSwitcher />
          <div className="fixed top-4 right-4">
            <ModeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
