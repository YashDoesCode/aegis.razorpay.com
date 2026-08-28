import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-page-bg text-ink flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-[4px] p-8 flat-shadow text-center space-y-6">
        <div className="w-12 h-12 rounded-[4px] bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-wider text-muted-slate uppercase">
            404 — Page Not Found
          </div>
          <h1 className="font-headline-lg text-2xl font-bold text-ink">
            Dispute Record Missing
          </h1>
          <p className="text-sm text-muted-slate">
            The page or dispute record you requested could not be located on the Aegis defense console.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/disputes"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors flat-shadow cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Defense Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
