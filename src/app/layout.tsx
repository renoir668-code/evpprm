import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getSession } from "@/lib/auth";
import { getDict, getLocale } from "@/lib/i18n";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EVP PRM",
  description: "Modern Partner Relationship Manager",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const dict = await getDict();
  const lang = await getLocale();

  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased mesh-light min-h-screen text-slate-800 flex overflow-hidden`}>
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/30 blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-indigo-300/30 blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-200/30 blur-[100px] mix-blend-multiply pointer-events-none" />

        <div className="relative z-10 p-6 flex h-screen w-full gap-6">
          <Sidebar userName={session?.name as string | undefined} userRole={session?.role as string | undefined} dict={dict} initialLang={lang} />
          <main className="flex-1 glass rounded-[32px] overflow-y-auto p-10 relative shadow-2xl border-white/60 scroll-smooth">
            <div className="max-w-6xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
