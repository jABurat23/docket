import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Docket",
    template: "%s · Docket",
  },
  description: "A calm, private workspace for your budget, pipeline, goals, and monthly reports.",
  applicationName: "Docket",
  category: "finance",
  keywords: ["personal finance", "budget", "goals", "freelance pipeline"],
  icons: {
    icon: "/docket-mark.jpg",
    apple: "/docket-mark.jpg",
  },
  openGraph: {
    title: "Docket",
    description: "Personal finance, clearly kept.",
    siteName: "Docket",
    type: "website",
    images: [{ url: "/docket-brand.jpg", width: 948, height: 752, alt: "Docket personal finance dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Docket",
    description: "Personal finance, clearly kept.",
    images: ["/docket-brand.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const saved = localStorage.getItem('docket-theme');
                  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (error) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-ink font-sans text-paper antialiased">{children}</body>
    </html>
  );
}
