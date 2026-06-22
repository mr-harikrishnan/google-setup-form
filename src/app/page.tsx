"use client";

import { useState, useEffect, useRef } from "react";
import GoogleSetupForm from "@/components/GoogleSetupForm";
import AdminDashboard from "@/components/AdminDashboard";
import { X } from "lucide-react";

export default function Home() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Visible enter-code input overlay state
  const [showEnterInput, setShowEnterInput] = useState(false);
  const [enterInputValue, setEnterInputValue] = useState("");
  const [enterInputError, setEnterInputError] = useState(false);
  const enterInputRef = useRef<HTMLInputElement>(null);

  // Back-from-admin confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Invisible buffer for the secret direct-access code
  const secretBufferRef = useRef("");
  const bufferResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus the enter input whenever it becomes visible
  useEffect(() => {
    if (showEnterInput) {
      setTimeout(() => enterInputRef.current?.focus(), 50);
    }
  }, [showEnterInput]);

  // Invisible listener ONLY for the direct secret code (Jothi@24680)
  // The enter code (Googlesetup24680) is handled via a visible input panel triggered below
  useEffect(() => {
    if (!mounted) return;

    const secretCode = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "Jothi@24680";
    const maxBufferLength = 50;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // If the visible enter-code input is shown, let it handle all input — don't intercept
      if (showEnterInput) return;

      // Ignore key events typed inside normal inputs/textareas
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        secretBufferRef.current = "";
        return;
      }

      if (e.key === "Backspace") {
        secretBufferRef.current = secretBufferRef.current.slice(0, -1);
        return;
      }

      if (e.key.length === 1) {
        secretBufferRef.current += e.key;

        if (secretBufferRef.current.length > maxBufferLength) {
          secretBufferRef.current = secretBufferRef.current.slice(-maxBufferLength);
        }

        // Auto-reset buffer after 4 seconds of inactivity
        if (bufferResetRef.current) clearTimeout(bufferResetRef.current);
        bufferResetRef.current = setTimeout(() => {
          secretBufferRef.current = "";
        }, 4000);

        // Check if buffer ends with secret code → open admin instantly (invisible)
        if (secretBufferRef.current.endsWith(secretCode)) {
          setAdminToken(secretCode);
          secretBufferRef.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (bufferResetRef.current) clearTimeout(bufferResetRef.current);
    };
  }, [mounted, showEnterInput]);

  const handleEnterCodeSubmit = () => {
    const enterCode = process.env.NEXT_PUBLIC_ADMIN_ENTER_KEY || "Googlesetup24680";
    if (enterInputValue === enterCode) {
      setAdminToken(enterCode);
      setShowEnterInput(false);
      setEnterInputValue("");
      setEnterInputError(false);
    } else {
      setEnterInputError(true);
      setTimeout(() => setEnterInputError(false), 1500);
    }
  };

  const handleAdminClose = () => {
    setShowExitConfirm(true);
  };

  const confirmExitAdmin = () => {
    setAdminToken(null);
    setShowExitConfirm(false);
  };

  if (!mounted) {
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

      {/* Header bar */}
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

      {/* Hidden * trigger — clicking opens the admin access code input panel */}
      <button
        type="button"
        onClick={() => { setShowEnterInput(true); setEnterInputValue(""); setEnterInputError(false); }}
        className="fixed bottom-3 right-3 z-30 text-transparent select-none cursor-default w-5 h-5 flex items-center justify-center"
        aria-hidden="true"
        tabIndex={-1}
      >
        *
      </button>

      {/* Visible Enter-Code Input Panel */}
      {showEnterInput && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-10 px-4 pointer-events-none">
          <div className="pointer-events-auto bg-white border border-border rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 w-full max-w-sm">
            <input
              ref={enterInputRef}
              type="password"
              value={enterInputValue}
              onChange={(e) => { setEnterInputValue(e.target.value); setEnterInputError(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEnterCodeSubmit();
                if (e.key === "Escape") { setShowEnterInput(false); setEnterInputValue(""); setEnterInputError(false); }
              }}
              placeholder="Enter access code"
              className={`flex-1 text-sm rounded-xl border px-3 py-2 bg-background text-dark focus:outline-none transition-all ${
                enterInputError ? "border-danger text-danger placeholder:text-danger/50" : "border-border focus:border-primary"
              }`}
            />
            <button
              type="button"
              onClick={handleEnterCodeSubmit}
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-[#1a73e8] transition-all cursor-pointer shrink-0"
            >
              Enter
            </button>
            <button
              type="button"
              onClick={() => { setShowEnterInput(false); setEnterInputValue(""); setEnterInputError(false); }}
              className="p-1.5 text-gray hover:text-dark transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Dashboard overlay */}
      {adminToken && (
        <AdminDashboard authToken={adminToken} onClose={handleAdminClose} />
      )}

      {/* Exit admin confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-sm w-full p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-dark">Exit Admin Portal?</h3>
                <p className="text-sm text-gray mt-1">You will be taken back to the user form. Are you sure?</p>
              </div>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="p-1 rounded-lg text-gray hover:text-dark transition-colors ml-3 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-border text-gray hover:text-dark hover:bg-background transition-all cursor-pointer"
              >
                Stay in Admin
              </button>
              <button
                onClick={confirmExitAdmin}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-[#1a73e8] transition-all cursor-pointer shadow-sm"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
