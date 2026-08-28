"use client";

import React, { useEffect } from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("❌ [Global App Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-page-bg text-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-[4px] p-8 flat-shadow text-center space-y-6">
        <div className="w-12 h-12 rounded-[4px] bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-headline-lg text-2xl font-bold text-ink">
            Something Went Wrong
          </h1>
          <p className="text-sm text-muted-slate">
            {error.message ||
              "An unexpected error occurred while processing dispute records. Our defense engine caught this gracefully."}
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-muted-slate/70 pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors flat-shadow cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/disputes"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] border border-border-subtle bg-white text-ink hover:bg-page-bg text-xs font-semibold transition-colors flat-shadow cursor-pointer"
          >
            <Home className="w-4 h-4 text-muted-slate" />
            <span>Return to Disputes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
