import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useGetJob, useUpdateJob, useRegenerateEmail, useGetProfile,
  useAnalyzeJob, getGetJobQueryKey, UpdateJobBodyStatus,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Sparkles, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function scoreClass(score: number) {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}
function scoreColor(score: number) {
  if (score >= 80) return "var(--good)";
  if (score >= 50) return "var(--warn)";
  return "var(--bad)";
}

export default function JobDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobResponse, isLoading } = useGetJob(id!, {
    query: { enabled: !!id, queryKey: getGetJobQueryKey(id!) },
  });
  const { data: profileResponse } = useGetProfile();

  const updateJob = useUpdateJob();
  const regenerateEmail = useRegenerateEmail();
  const analyzeJob = useAnalyzeJob();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const job = jobResponse?.job;
  const profile = profileResponse?.profile;
  const isFree = profile?.subscription_type === "free";

  if (isLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-3)" }}>
          Job not found
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as UpdateJobBodyStatus;
    try {
      await updateJob.mutateAsync({ id: job.id, data: { status } });
      await queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      await queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
      toast({ title: "Status updated" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to update status", description: message, variant: "destructive" });
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateEmail.mutateAsync({ id: job.id });
      await queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
      toast({ title: "Email regenerated" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to regenerate", description: message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await analyzeJob.mutateAsync({ id: job.id });
      await queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
      toast({ title: "Analysis complete" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "Failed to analyze", description: message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (job.generated_email) {
      void navigator.clipboard.writeText(job.generated_email);
      toast({ title: "Copied to clipboard" });
    }
  };

  const displayedSkills = isFree && job.missing_skills ? job.missing_skills.slice(0, 2) : job.missing_skills;
  const sc = job.match_score ?? null;

  return (
    <AppLayout>
      <button className="back-btn" onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/dashboard")}>
        <ArrowLeft size={14} />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="main-header">
        <div>
          <div className="crumbs">{job.company_name}</div>
          <h1>{job.job_title}</h1>
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "var(--violet-bright)", marginTop: 4, display: "inline-block" }}
            >
              View original posting ↗
            </a>
          )}
        </div>
        <select
          className="status-select"
          value={job.status}
          onChange={handleStatusChange}
        >
          <option value="saved">Saved</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="rejected">Rejected</option>
          <option value="offer">Offer</option>
        </select>
      </div>

      <div className="detail-layout">
        {/* Left column */}
        <div>
          {/* Job Description */}
          {job.job_description && (
            <div className="detail-section">
              <div className="card-h">
                <span className="kicker">Job Description</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, maxHeight: 280, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {job.job_description}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          <div className="detail-section">
            <div className="card-h">
              <span className="kicker">Missing Skills</span>
              {displayedSkills && displayedSkills.length > 0 && (
                <span className="pill pill-bad">
                  <span className="dot" />
                  {displayedSkills.length} missing
                </span>
              )}
            </div>

            {displayedSkills && displayedSkills.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {displayedSkills.map((skill, i) => (
                  <span key={i} className="pill pill-bad">{skill.skill}</span>
                ))}
                {isFree && job.missing_skills && job.missing_skills.length > 2 && (
                  <Link href="/settings">
                    <span className="pill" style={{ cursor: "pointer" }}>
                      +{job.missing_skills.length - 2} more (upgrade)
                    </span>
                  </Link>
                )}
              </div>
            ) : job.match_score != null ? (
              <p style={{ fontSize: 13, color: "var(--good)" }}>No critical skills missing.</p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Not analyzed yet</p>
            )}
          </div>

          {/* Resume Suggestions */}
          <div className="detail-section">
            <div className="card-h">
              <span className="kicker">Resume Suggestions</span>
            </div>
            {job.resume_suggestions && job.resume_suggestions.length > 0 ? (
              <ul style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {job.resume_suggestions.map((sug, i) => (
                  <li key={i} className="suggestion-item">
                    <span className="suggestion-arrow">→</span>
                    {sug}
                  </li>
                ))}
              </ul>
            ) : job.match_score != null ? (
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Resume looks solid for this role.</p>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-3)" }}>Not analyzed yet</p>
            )}
          </div>

          {/* Generated Email */}
          <div className="detail-section">
            <div className="card-h">
              <span className="kicker">Generated Email</span>
              {job.generated_email && !isFree && (
                <button
                  className="btn btn-soft btn-sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || (job.email_generates_count || 0) >= 3}
                >
                  {isRegenerating ? <span className="spinner" /> : <Sparkles size={12} />}
                  Regenerate ({job.email_generates_count || 0}/3)
                </button>
              )}
            </div>

            {job.match_score == null ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>
                  Analyze this job to generate a personalized email.
                </p>
                <button
                  className={`btn btn-primary${isAnalyzing ? " btn-loading" : ""}`}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <span className="spinner" /> : <Sparkles size={14} />}
                  {isAnalyzing ? "Analyzing…" : "Analyze Job"}
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <div className={`email-box${isFree ? "" : ""}`} style={isFree ? { maxHeight: 200, overflow: "hidden" } : {}}>
                  {job.generated_email || "No email generated."}
                </div>
                {isFree && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to top, var(--surface), transparent)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 12 }}>
                    <Link href="/settings" className="btn btn-primary btn-sm">
                      Upgrade to Unlock
                    </Link>
                  </div>
                )}
              </div>
            )}

            {job.generated_email && !isFree && (
              <button
                className="btn btn-ghost btn-block"
                onClick={handleCopy}
                style={{ marginTop: 12 }}
              >
                <Copy size={14} />
                Copy Email
              </button>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="detail-right-sticky">
          <div className="score-panel">
            {/* Score ring */}
            <div style={{ width: 140, height: 140, margin: "0 auto 16px", position: "relative" }}>
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                {sc != null && (
                  <circle
                    cx="70" cy="70" r="60"
                    fill="none"
                    stroke={scoreColor(sc)}
                    strokeWidth="10"
                    strokeDasharray={`${(sc / 100) * 377} 377`}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 36, color: sc != null ? scoreColor(sc) : "var(--text-3)", lineHeight: 1 }}>
                  {sc != null ? `${sc}%` : "--"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "var(--mono)", marginTop: 4 }}>match</div>
              </div>
            </div>

            <div className="kicker" style={{ marginBottom: 20 }}>Match Score</div>

            {sc == null && (
              <button
                className={`btn btn-primary btn-block${isAnalyzing ? " btn-loading" : ""}`}
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{ marginBottom: 12 }}
              >
                {isAnalyzing ? <span className="spinner" /> : <Sparkles size={14} />}
                {isAnalyzing ? "Analyzing…" : "Analyze Job"}
              </button>
            )}

            {sc != null && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>ATS Risk</span>
                  <span style={{ fontWeight: 600 }}>
                    <span className={`pill pill-${sc >= 70 ? "good" : sc >= 40 ? "warn" : "bad"}`} style={{ height: 20, fontSize: 10 }}>
                      {sc >= 70 ? "Low" : sc >= 40 ? "Medium" : "High"}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>Missing Skills</span>
                  <span style={{ color: "var(--bad)", fontWeight: 600 }}>{job.missing_skills?.length ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--text-3)" }}>Suggestions</span>
                  <span style={{ fontWeight: 600 }}>{job.resume_suggestions?.length ?? 0}</span>
                </div>
              </div>
            )}
          </div>

          {isFree && (
            <div style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(124,58,237,0.04))", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 18, marginBottom: 8 }}>Upgrade to Pro</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.5 }}>
                Unlock unlimited analyses, full skill gap list, and AI email generation.
              </p>
              <Link href="/settings" className="btn btn-primary btn-block btn-sm">
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
