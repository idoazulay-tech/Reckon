import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogoMark } from "@/components/LogoMark";
import { Aurora } from "@/components/Aurora";
import { Lock, Sparkles } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

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

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      setLocation("/dashboard");
    } catch (error: unknown) {
      toast({
        title: "Error signing in",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Aurora />

      <div className="auth-page">
        <div className="auth-nav">
          <LogoMark />
        </div>

        <div className="auth-grid">
          {/* Left side — pitch */}
          <div className="auth-side">
            <div className="h-display" style={{ fontSize: 48 }}>
              Your unfair<br />advantage in<br /><em>job search.</em>
            </div>
            <div className="auth-trust">
              <div className="trust-item">
                <Sparkles size={14} />
                AI match scores for every role
              </div>
              <div className="trust-item">
                <Sparkles size={14} />
                Missing skills pinpointed instantly
              </div>
              <div className="trust-item">
                <Sparkles size={14} />
                Personalized outreach emails generated
              </div>
              <div className="trust-item">
                <Lock size={14} />
                Your data is always private and secure
              </div>
            </div>
          </div>

          {/* Right side — auth card */}
          <div>
            <div className="auth-card">
              {/* Tabs */}
              <div className="auth-tabs">
                <div
                  className="auth-tab-pill"
                  style={{ left: activeTab === "login" ? "4px" : "calc(50%)" }}
                />
                <button
                  className={activeTab === "login" ? "active" : ""}
                  onClick={() => setActiveTab("login")}
                >
                  Sign In
                </button>
                <button
                  className={activeTab === "signup" ? "active" : ""}
                  onClick={() => { setActiveTab("signup"); setLocation("/signup"); }}
                >
                  Sign Up
                </button>
              </div>

              {/* Error from form */}
              {form.formState.errors.email || form.formState.errors.password ? (
                <div className="auth-err">
                  {form.formState.errors.email?.message || form.formState.errors.password?.message}
                </div>
              ) : null}

              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                    autoComplete="current-password"
                    {...form.register("password")}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary btn-block${loading ? " btn-loading" : ""}`}
                  style={{ height: 44, marginTop: 4 }}
                >
                  {loading ? <span className="spinner" /> : null}
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="btn-google"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="auth-foot">
                Don't have an account?{" "}
                <Link href="/signup">Sign up free</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
