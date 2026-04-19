import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ClinicaProvider } from "@/components/providers/clinica-provider";
import { Toaster } from "@/components/ui/sonner";

// Figtree — headings, KPIs, display (Medical Clean — ui-ux-pro-max)
const displayFont = localFont({
  src: "../../public/fonts/figtree-latin.woff2",
  variable: "--font-display",
  weight: "300 800",
  display: "swap",
});

// Noto Sans — body, tablas, formularios (máxima legibilidad)
const bodyFont = localFont({
  src: "../../public/fonts/noto-sans-latin.woff2",
  variable: "--font-body",
  weight: "300 700",
  display: "swap",
});

const monoFont = localFont({
  src: "../../public/fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
  weight: "400 500",
  display: "swap",
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
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
