import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteDescription, siteName, siteOrigin } from "@/lib/site";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteOrigin()),
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },
    description: siteDescription,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      title: siteName,
      description: siteDescription,
      url: "/",
      images: [
        {
          url: "/logo.png",
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: ["/logo.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={roboto.variable}>
      <body className="bg-paper font-sans text-ink antialiased dark:bg-ink dark:text-white">
        <Providers>
          <Suspense>
            <Header />
          </Suspense>
          <main>{children}</main>
          <footer className="border-t border-black/10 px-4 py-10 dark:border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center text-sm text-muted dark:text-muted-dark">
              <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                <Link
                  href="/about"
                  className="hover:text-ink dark:hover:text-white"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-ink dark:hover:text-white"
                >
                  Contact
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-ink dark:hover:text-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/affiliate-disclosure"
                  className="hover:text-ink dark:hover:text-white"
                >
                  Affiliate Disclosure
                </Link>
              </nav>
              <ThemeToggle className="flex sm:hidden" />
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
