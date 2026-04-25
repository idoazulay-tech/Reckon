import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/spinner";
import { Link } from "wouter";

const VALID_EMAIL_OTP_TYPES: EmailOtpType[] = [
  "email",
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] rounded-3xl border border-border bg-card p-12 shadow-sm text-center">
          <div className="mb-2 font-syne text-3xl font-extrabold text-foreground text-left">
            R<span className="text-primary">.</span>
          </div>
          <div className="mt-8 mb-4 flex items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Confirming your email address...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-[440px] rounded-3xl border border-border bg-card p-12 shadow-sm text-center">
          <div className="mb-2 font-syne text-3xl font-extrabold text-foreground text-left">
            R<span className="text-primary">.</span>
          </div>
          <div className="mt-8 mb-4 flex items-center justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Email confirmed!</h2>
          <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[440px] rounded-3xl border border-border bg-card p-12 shadow-sm text-center">
        <div className="mb-2 font-syne text-3xl font-extrabold text-foreground text-left">
          R<span className="text-primary">.</span>
        </div>
        <div className="mt-8 mb-4 flex items-center justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Confirmation failed</h2>
        <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
        <Link href="/signup" className="text-sm text-primary hover:underline">
          Back to sign up
        </Link>
      </div>
    </div>
  );
}
