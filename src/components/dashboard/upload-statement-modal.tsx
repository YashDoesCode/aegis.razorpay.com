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
      <DialogContent className="sm:max-w-lg p-5 rounded-xl bg-card border border-border text-foreground shadow-lg">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Upload Merchant Statement
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ingest transaction sheets, POD delivery logs, and dispute records (Max 10MB)
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {successData ? (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                  Statement Ingested Successfully
                </p>
                <p className="text-emerald-700 dark:text-emerald-400">
                  File: <span className="font-mono">{successData.filename}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-sans block">Records Processed</span>
                <span className="text-sm font-medium text-foreground">{successData.recordsProcessed}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-sans block">New Orders Extracted</span>
                <span className="text-sm font-medium text-foreground">{successData.newOrdersCreated}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-sans block">Deliveries / PODs Linked</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{successData.newDeliveriesCreated}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground font-sans block">Disputes Linked</span>
                <span className="text-sm font-medium text-primary">{successData.matchedDisputes}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
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
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20 hover:border-muted-foreground/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.pdf,.docx,.txt,.json"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Click to browse or drag and drop statement file
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supported formats: CSV, XLSX, PDF, DOCX, TXT, JSON (up to 10MB)
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <span className="font-medium text-foreground truncate block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
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
                  className="p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition shadow-2xs cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Extract</span>
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
