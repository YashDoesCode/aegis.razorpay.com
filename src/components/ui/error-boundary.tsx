"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LocalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LocalErrorBoundary error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-danger/30 p-6 shadow-xs space-y-4 my-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-danger/10 text-danger shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-ink text-base">
                {this.props.fallbackTitle || "Unable to display this component"}
              </h3>
              <p className="text-xs text-muted-slate leading-relaxed">
                {this.props.fallbackMessage ||
                  this.state.error?.message ||
                  "A rendering error occurred in this section. The rest of the application remains functional."}
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-start">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-container text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
