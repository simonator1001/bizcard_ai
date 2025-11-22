"use client";
import { ReactNode } from "react";
import { Navigation } from "@/components/layout/Navigation";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export default function AppLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname && (pathname.startsWith("/auth") || pathname.startsWith("/signin") || pathname.startsWith("/signup"));
  if (isAuthPage) {
    return <>{children}<Toaster /></>;
  }
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-x-hidden">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <Navigation />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 w-full border-b bg-green-500">
          <div className="container flex h-16 items-center px-4">
            <span className="font-bold text-xl">Simon.AI BizCard</span>
          </div>
        </header>
        <main className="flex-1 w-full px-2 sm:px-4 md:px-8 max-w-full">
          {children}
          <Toaster />
        </main>
      </div>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden justify-around items-center h-16 bg-white border-t shadow-lg">
        {/* Example nav items, replace with your icons/routes */}
        <button className="flex flex-col items-center text-xs font-medium text-foreground focus:text-primary"><svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>Menu</button>
        <button className="flex flex-col items-center text-xs font-medium text-foreground focus:text-primary"><svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>Scan</button>
        <button className="flex flex-col items-center text-xs font-medium text-foreground focus:text-primary"><svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>Cards</button>
        <button className="flex flex-col items-center text-xs font-medium text-foreground focus:text-primary"><svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>Activity</button>
      </nav>
    </div>
  );
} 