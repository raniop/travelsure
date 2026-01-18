import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh", 
          flexDirection: "column", 
          padding: "20px", 
          textAlign: "center", 
          fontFamily: "Arial, sans-serif",
          direction: "rtl"
        }}>
          <h1 style={{ color: "#ea580c", marginBottom: "20px" }}>שגיאה בטעינת האפליקציה</h1>
          <p style={{ color: "#666", marginBottom: "20px" }}>אנא רענן את הדף או נסה שוב מאוחר יותר</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: "10px 20px", 
              background: "#ea580c", 
              color: "white", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer" 
            }}
          >
            רענן דף
          </button>
          {this.state.error && (
            <details style={{ marginTop: "20px", textAlign: "right", direction: "rtl" }}>
              <summary style={{ cursor: "pointer", color: "#666" }}>פרטי השגיאה</summary>
              <pre style={{ 
                marginTop: "10px", 
                padding: "10px", 
                background: "#f5f5f5", 
                borderRadius: "5px", 
                overflow: "auto",
                textAlign: "left",
                direction: "ltr"
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
