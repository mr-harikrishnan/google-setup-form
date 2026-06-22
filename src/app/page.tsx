"use client";

import { useState, useEffect } from "react";
import GoogleSetupForm from "@/components/GoogleSetupForm";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Set mounted to true once rendered on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen globally to the secret keystroke sequences
  useEffect(() => {
    if (!mounted) return;

    let keysBuffer = "";
    const secretCode = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "Jothi@24680";
    const enterCode = process.env.NEXT_PUBLIC_ADMIN_ENTER_KEY || "Googlesetup24680";
    const maxBufferLength = 50;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if typed inside inputs or textareas to prevent accidental triggers
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Backspace") {
        keysBuffer = keysBuffer.slice(0, -1);
        return;
      }

      if (e.key === "Enter") {
        if (keysBuffer.endsWith(enterCode)) {
          setAdminToken(enterCode);
          keysBuffer = ""; // Reset buffer
        }
        return;
      }

      if (e.key.length === 1) {
        keysBuffer += e.key;

        // Keep buffer size clamped to max length
        if (keysBuffer.length > maxBufferLength) {
          keysBuffer = keysBuffer.slice(-maxBufferLength);
        }

        if (keysBuffer.endsWith(secretCode)) {
          setAdminToken(secretCode);
          keysBuffer = ""; // Reset buffer
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mounted]);

  if (!mounted) {
    // Render a clean matching light skeleton while loading to prevent visual flashes
    return (
      <div className="flex flex-col min-h-screen bg-background text-dark">
        <header className="w-full border-b border-border bg-white/60 h-16" />
        <main className="flex-grow flex items-center justify-center py-10 px-4 md:px-8">
          <div className="animate-pulse w-full max-w-4xl h-96 bg-white border border-border rounded-3xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-dark selection:bg-primary/20 selection:text-dark">
      
      {/* Header bar (Switch removed for secret key trigger) */}
      <header className="w-full border-b border-border bg-white/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Google Setup Form Logo" className="h-9 w-auto object-contain mix-blend-multiply" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray">Onboarding Console</span>
          </div>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 md:px-8">
        <GoogleSetupForm />
      </main>

      {/* Submissions Viewer Admin Dashboard overlay */}
      {adminToken && (
        <AdminDashboard authToken={adminToken} onClose={() => setAdminToken(null)} />
      )}

      {/* Standard, user-friendly, footer */}
      <footer className="w-full border-t border-border bg-white py-6 text-center text-xs text-gray">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Google Business Profile Setup Portal. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Support Portal</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Guidelines</a>
            <a href="#" className="hover:text-primary transition-colors">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
