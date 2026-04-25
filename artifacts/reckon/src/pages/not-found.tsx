import { Link } from "wouter";
import { LogoMark } from "@/components/LogoMark";
import { Aurora } from "@/components/Aurora";

export default function NotFound() {
  return (
    <>
      <Aurora />
      <div className="page-center">
        <div className="status-card">
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <LogoMark />
          </div>
          <div className="h-display" style={{ fontSize: 80, opacity: 0.15, lineHeight: 1, marginBottom: 8 }}>
            404
          </div>
          <div className="h-display" style={{ fontSize: 28, marginBottom: 12 }}>
            Page not found
          </div>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 28 }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    </>
  );
}
