import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: "20px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h2>Algo salió mal.</h2>
          <details style={{ whiteSpace: "pre-wrap", textAlign: "left", marginTop: "10px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 20px", background: "#4c1d95", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
