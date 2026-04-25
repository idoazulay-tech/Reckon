import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { LogoMark } from "@/components/LogoMark";
import { CheckCircle, XCircle } from "lucide-react";

const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  "email", "signup", "recovery", "invite", "magiclink", "email_change",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (VALID_EMAIL_OTP_TYPES as string[]).includes(value);
}

export default function AuthConfirm() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleConfirmation = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const rawType = params.get("type");
      const rawNext = params.get("next") ?? "/dashboard";
      const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

      if (tokenHash) {
        if (!isEmailOtpType(rawType)) {
          setErrorMessage(
            rawType
              ? `Unrecognised confirmation type "${rawType}". The link may be malformed.`
              : "No confirmation type found. The link may be malformed."
          );
          setStatus("error");
          return;
        }

        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType });
        if (error) {
          setErrorMessage(error.message);
          setStatus("error");
          return;
        }

        setStatus("success");
        setTimeout(() => setLocation(next), 1500);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setTimeout(() => setLocation("/dashboard"), 1500);
      } else {
        setErrorMessage("No confirmation token found. The link may have expired or already been used.");
        setStatus("error");
      }
    };

    handleConfirmation();
  }, [setLocation]);

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="page-center">
        <div className="status-card">
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}>
            <LogoMark />
          </div>

          {status === "loading" && (
            <>
              <div className="icon-ring violet">
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              </div>
              <div className="h-display" style={{ fontSize: 22, marginBottom: 10 }}>Confirming…</div>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Verifying your email address</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="icon-ring good">
                <CheckCircle size={28} />
              </div>
              <div className="h-display" style={{ fontSize: 22, marginBottom: 10 }}>Email confirmed!</div>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Redirecting you to your dashboard…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="icon-ring bad">
                <XCircle size={28} />
              </div>
              <div className="h-display" style={{ fontSize: 22, marginBottom: 10 }}>Confirmation failed</div>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
                {errorMessage}
              </p>
              <Link href="/signup" style={{ color: "var(--violet-bright)", fontSize: 13 }}>
                Back to sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
