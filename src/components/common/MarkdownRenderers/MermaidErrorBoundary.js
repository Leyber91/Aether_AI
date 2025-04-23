import React from "react";

export class MermaidErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could log errorInfo here if needed
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mermaid-error-box">
          <strong>Mermaid render error (component):</strong><br/>
          {this.state.error?.message || String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
