import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUpdateProfile } from "@workspace/api-client-react";
import { LogoMark } from "@/components/LogoMark";
import { Aurora } from "@/components/Aurora";
import { Lock, Sparkles, Mail } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signup, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const updateProfile = useUpdateProfile();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const { needsConfirmation } = await signup(data.email, data.password);

      if (needsConfirmation) {
        setConfirmedEmail(data.email);
        return;
      }

      try {
        await updateProfile.mutateAsync({ data: { full_name: data.fullName } });
      } catch (e) {
        console.error("Failed to set full name", e);
      }

      setLocation("/dashboard");
    } catch (error: unknown) {
      toast({
        title: "Error signing up",
        description: error instanceof Error ? error.message : "An error occurred during sign up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (confirmedEmail) {
    return (
      <>
        <Aurora />
        <div className="page-center">
          <div className="status-card">
            <div style={{ marginBottom: 24 }}>
              <LogoMark />
            </div>
            <div className="icon-ring violet" style={{ width: 64, height: 64, marginBottom: 20 }}>
              <Mail size={28} />
            </div>
            <div className="h-display" style={{ fontSize: 24, marginBottom: 10 }}>Check your email</div>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 6 }}>
              We sent a confirmation link to
            </p>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 16, fontFamily: "var(--mono)" }}>
              {confirmedEmail}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              Click the link in the email to verify your account. Check your spam folder if you don't see it.
            </p>
            <Link href="/login" style={{ color: "var(--violet-bright)", fontSize: 13 }}>
              Return to sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Aurora />

      <div className="auth-page">
        <div className="auth-nav">
          <LogoMark />
        </div>

        <div className="auth-grid">
          {/* Left side */}
          <div className="auth-side">
            <div className="h-display" style={{ fontSize: 48 }}>
              Land your next<br />dream job with<br /><em>AI intelligence.</em>
            </div>
            <div className="auth-trust">
              <div className="trust-item">
                <Sparkles size={14} />
                Free to start — no credit card needed
              </div>
              <div className="trust-item">
                <Sparkles size={14} />
                3 free job analyses included
              </div>
              <div className="trust-item">
                <Sparkles size={14} />
                Full AI email generation included
              </div>
              <div className="trust-item">
                <Lock size={14} />
                Your data is always private and secure
              </div>
            </div>
          </div>

          {/* Right side — card */}
          <div>
            <div className="auth-card">
              {/* Tabs */}
              <div className="auth-tabs">
                <div className="auth-tab-pill" style={{ left: "calc(50%)" }} />
                <button onClick={() => setLocation("/login")}>Sign In</button>
                <button className="active">Sign Up</button>
              </div>

              {(form.formState.errors.fullName || form.formState.errors.email || form.formState.errors.password) && (
                <div className="auth-err">
                  {form.formState.errors.fullName?.message ||
                    form.formState.errors.email?.message ||
                    form.formState.errors.password?.message}
                </div>
              )}

              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="field">
                  <label className="field-label">Full name</label>
                  <input
                    autoComplete="name"
                    {...form.register("fullName")}
                    className="input"
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label className="field-label">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    {...form.register("email")}
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...form.register("password")}
                    className="input"
                    placeholder="At least 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary btn-block${loading ? " btn-loading" : ""}`}
                  style={{ height: 44, marginTop: 4 }}
                >
                  {loading ? <span className="spinner" /> : null}
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button type="button" onClick={() => loginWithGoogle()} className="btn-google">
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="auth-foot">
                Already have an account?{" "}
                <Link href="/login">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
