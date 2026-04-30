"use client";

import React from "react";
import Link from "next/link";

export function Navigation() {
  return (
    <header className="w-full border-b bg-primary z-50">
      <nav className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 font-bold text-lg text-primary-foreground">
            <span className="bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full w-7 h-7 flex items-center justify-center text-white font-bold">B</span>
            BizCard
          </span>
        </Link>
        {/* Right: Auth Actions */}
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-base font-medium text-primary-foreground hover:text-white/80 transition-colors">Log In</Link>
          <Link href="/signup" className="px-5 py-2 rounded-full bg-white text-primary font-semibold shadow hover:bg-white/90 transition-colors">Sign Up</Link>
        </div>
      </nav>
    </header>
  );
}
