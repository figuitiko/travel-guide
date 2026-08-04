import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from 'sonner';
import './globals.css';
import { APP_NAME, ESTIMATE_DISCLAIMER } from '@/lib/constants';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: APP_NAME, description: 'AI-powered travel inspiration that returns three possible trips for your constraints.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}><a className="sr-only focus:not-sr-only" href="#main">Skip to content</a><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link href="/" className="text-lg font-black">TripPossible</Link><nav aria-label="Main" className="flex items-center gap-3 text-sm font-semibold text-stone-700 sm:gap-5"><Link className="hidden sm:inline" href="/about-methodology">How it works</Link><Link href="/plan" className="rounded-full bg-[#ef4828] px-5 py-3 font-black text-white shadow-[0_10px_25px_rgba(239,72,40,0.18)] sm:px-6">Plan My Trip</Link></nav></header><main id="main">{children}</main><footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[#e7dcc8] px-5 py-10 text-sm text-stone-600"><span>{ESTIMATE_DISCLAIMER}</span><Link className="font-semibold text-slate-700" href="/about-methodology">How estimates work</Link></footer><Toaster richColors /></body></html>;
}
