import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ClinicaProvider } from "@/components/providers/clinica-provider";

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://avaxhealth.com"),
  title: "Avax Health - CRM SaaS para Clínicas Médicas",
  description: "Sistema integral de gestión para clínicas y consultorios médicos impulsado por IA",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Avax Health - CRM SaaS para Clínicas Médicas",
    description: "Sistema integral de gestión para clínicas y consultorios médicos impulsado por IA",
    url: "https://avaxhealth.com",
    siteName: "Avax Health",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>
            <ClinicaProvider>{children}</ClinicaProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
