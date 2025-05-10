"use client";

import React from "react";

export function Navigation() {
  return (
    <header className="w-full border-b bg-green-500 z-50">
      <nav className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 font-bold text-lg">
            <span className="bg-gradient-to-tr from-primary to-secondary rounded-full w-7 h-7 flex items-center justify-center text-white font-bold">S</span>
            Simon.AI
          </span>
        </div>
        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-base font-medium text-foreground">
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">Launch Pad <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
          </div>
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-primary transition-colors">Community <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
          </div>
        </div>
        {/* Right: Auth Actions */}
        <div className="flex items-center gap-3">
          <button className="text-base font-medium text-foreground hover:text-primary transition-colors">Log In</button>
          <button className="px-5 py-2 rounded-full bg-foreground text-white font-semibold shadow hover:bg-primary transition-colors">Sign In</button>
      </div>
    </nav>
    </header>
  );
} 