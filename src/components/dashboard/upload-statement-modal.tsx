"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { useMerchantMode } from "@/context/merchant-mode-context";
import { cn } from "@/lib/utils";

interface UploadStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface UploadSuccessData {
  filename: string;
  recordsProcessed: number;
  newOrdersCreated: number;
  newDeliveriesCreated: number;
  matchedDisputes: number;
  exposureImpactPaise: number;
}

export function UploadStatementModal({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadStatementModalProps) {
  const { mode } = useMerchantMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successData, setSuccessData] = useState<UploadSuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setSuccessData(null);
    setError(null);
    setUploading(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".csv", ".txt", ".json", ".xlsx", ".pdf", ".docx"];

    if (!allowed.includes(ext)) {
      setError(`Unsupported format (${ext}). Supported: CSV, XLSX, PDF, DOCX, TXT, JSON.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum 10MB limit.");
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mode", mode);

      const res = await fetch("/api/statements/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.ok && json.data) {
        setSuccessData(json.data);
        toast.success(`Parsed ${json.data.recordsProcessed} statement records successfully`);
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        const errorMsg = json.error || "Failed to process statement file";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Statement upload error:", err);
      const errorMsg = "Network error communicating with statement parsing engine";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-primary flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                  Upload Custom Merchant Statement
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Ingest transaction sheets, POD delivery logs, and dispute records (Max 10MB)
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {successData ? (
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-emerald-950 dark:text-emerald-200">
                  Statement Ingested &amp; Normalized Successfully
                </p>
                <p className="text-emerald-800 dark:text-emerald-300">
                  File: <span className="font-mono font-medium">{successData.filename}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-sans block">Records Processed</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{successData.recordsProcessed}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-sans block">New Orders Extracted</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{successData.newOrdersCreated}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-sans block">Deliveries / PODs Linked</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{successData.newDeliveriesCreated}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-sans block">Disputes Linked</span>
                <span className="text-base font-bold text-primary">{successData.matchedDisputes}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-950 dark:bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-primary transition cursor-pointer"
              >
                Close &amp; View Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="py-3 space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2",
                dragActive
                  ? "border-primary bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.pdf,.docx,.txt,.json"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 text-primary flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Click to browse or drag and drop statement file
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supported formats: CSV, XLSX, PDF, DOCX, TXT, JSON (up to 10MB)
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:bg-primary-container disabled:opacity-50 transition shadow-xs cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Statement...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Extract Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
