import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetProfile, useUpdateProfile, useUploadResume,
  useGetBillingStatus, useCancelSubscription,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileResponse, isLoading: profileLoading } = useGetProfile();
  const { data: billingResponse, isLoading: billingLoading } = useGetBillingStatus();

  const updateProfile = useUpdateProfile();
  const uploadResume = useUploadResume();
  const cancelSub = useCancelSubscription();

  const profile = profileResponse?.profile;
  const billing = billingResponse;

  const form = useForm({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.full_name || "" },
  });

  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleProfileUpdate = async (data: { fullName: string }) => {
    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync({ data: { full_name: data.fullName } });
      toast({ title: "Profile updated" });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to update profile", description: message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!file && !resumeText) return;
    setIsUploading(true);
    try {
      await uploadResume.mutateAsync({
        data: { resume: file || undefined, resume_text: resumeText || undefined },
      });
      toast({ title: "Resume updated" });
      setFile(null);
      setResumeText("");
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to upload resume", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSub = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      await cancelSub.mutateAsync(undefined);
      toast({ title: "Subscription cancelled" });
      await queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to cancel", description: message, variant: "destructive" });
    }
  };

  if (profileLoading || billingLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </AppLayout>
    );
  }

  const isFree = profile?.subscription_type === "free";
  const limits = billing?.limits;

  const nameStr = profile?.full_name ?? "";
  const initials = nameStr
    ? nameStr.split(" ").map((s: string) => s[0]).slice(0, 2).join("")
    : "U";

  const jobsUsed = billing?.jobs_count ?? 0;
  const jobsCap = limits?.free_jobs;
  const jobsPct = jobsCap ? Math.min(100, (jobsUsed / jobsCap) * 100) : 10;

  const aiUsed = billing?.today_ai_calls ?? 0;
  const aiCap = limits?.daily_ai_analyses;
  const aiPct = aiCap ? Math.min(100, (aiUsed / aiCap) * 100) : 10;

  return (
    <AppLayout>
      <div className="main-header">
        <div>
          <div className="crumbs">Your Account</div>
          <h1>Settings.</h1>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile */}
        <div className="set-card">
          <div className="card-h">
            <span className="kicker">Profile</span>
          </div>
          <div className="profile-row">
            <div className="avatar-lg">{initials}</div>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--text)" }}>
                {nameStr || "Account"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 2 }}>
                {user?.email}
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleProfileUpdate)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-label">Full name</label>
              <input {...form.register("fullName")} className="input" />
            </div>
            <div className="field">
              <label className="field-label">Email address</label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="input"
                style={{ opacity: 0.6, cursor: "default" }}
              />
            </div>
            <button
              type="submit"
              disabled={isUpdating}
              className={`btn btn-primary${isUpdating ? " btn-loading" : ""}`}
              style={{ alignSelf: "flex-start" }}
            >
              {isUpdating ? <span className="spinner" /> : null}
              {isUpdating ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>

        {/* Resume */}
        <div className="set-card">
          <div className="card-h">
            <span className="kicker">Resume</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label className="field-label">Upload PDF / DOCX</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input"
                style={{ padding: "10px 14px" }}
              />
            </div>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <div className="field">
              <label className="field-label">Paste resume text</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="textarea"
              />
            </div>

            <button
              onClick={handleResumeUpload}
              disabled={isUploading || (!file && !resumeText)}
              className={`btn btn-soft btn-block${isUploading ? " btn-loading" : ""}`}
            >
              {isUploading ? <span className="spinner" /> : null}
              {isUploading ? "Uploading…" : "Update Resume"}
            </button>

            {profile?.resume_text && (
              <div>
                <div className="field-label" style={{ marginBottom: 6 }}>Current resume (preview)</div>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {profile.resume_text}
                </div>
              </div>
            )}
            {profile?.resume_url && !profile.resume_text && (
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                Resume PDF on file.{" "}
                <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ color: "var(--violet-bright)" }}>View</a>
              </div>
            )}
          </div>
        </div>

        {/* Plan & Usage */}
        <div className="set-card">
          <div className="card-h">
            <span className="kicker">Plan &amp; Usage</span>
            <span className={`pill pill-${isFree ? "neutral" : "violet"}`} style={{ height: 24 }}>
              <span className="dot" />
              {profile?.subscription_type ?? "free"}
            </span>
          </div>

          <div className="usage-row" style={{ marginBottom: 20 }}>
            <div className="usage-item">
              <div className="usage-item-head">
                <span className="usage-item-label">Jobs Analyzed</span>
                <span className="usage-item-val">{jobsUsed}{jobsCap ? ` / ${jobsCap}` : ""}</span>
              </div>
              <div className="usage-bar">
                <div className="usage-bar-fill" style={{ width: `${jobsPct}%` }} />
              </div>
            </div>
            <div className="usage-item">
              <div className="usage-item-head">
                <span className="usage-item-label">Daily AI Analyses</span>
                <span className="usage-item-val">{aiUsed}{aiCap ? ` / ${aiCap}` : ""}</span>
              </div>
              <div className="usage-bar">
                <div className={`usage-bar-fill${aiPct >= 80 ? " warn" : " good"}`} style={{ width: `${aiPct}%` }} />
              </div>
            </div>
          </div>

          {isFree ? (
            <div style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(124,58,237,0.04))", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} style={{ color: "var(--violet-bright)" }} />
                Upgrade to Pro
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.5 }}>
                Unlock unlimited job analysis, full missing skills list, and AI email generation.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-primary btn-block">Monthly — $19/mo</button>
                <button className="btn btn-ghost btn-block">Pay As You Go — $1 / 12 jobs</button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                <span style={{ fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{profile?.subscription_type}</span> plan is active.
              </div>
              <button
                onClick={handleCancelSub}
                className="btn btn-danger btn-sm"
                style={{ alignSelf: "flex-start" }}
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>

        {/* Billing History */}
        <div className="set-card">
          <div className="card-h">
            <span className="kicker">Billing History</span>
          </div>

          {isFree ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-4)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 40, height: 40, margin: "0 auto 12px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>No billing history yet.</p>
              <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 4 }}>Invoices will appear here after your first payment.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="plan-block">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{profile?.subscription_type} Plan</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Current active subscription</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>
                    {profile?.subscription_type === "monthly" ? "$19.00" : billing?.amount_owed != null ? `$${(billing.amount_owed / 100).toFixed(2)}` : "--"}
                  </div>
                  <span className="pill pill-good" style={{ height: 18, fontSize: 10, marginTop: 4 }}>Active</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-4)" }}>
                Full billing history is available in the customer portal.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
