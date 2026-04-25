import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateJob, useExtractJobFromUrl, useExtractJobFromImage, useAnalyzeJob, CreateJobBodyStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabId = "url" | "image" | "manual";

export function AddJobModal({ open, onOpenChange }: AddJobModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createJob = useCreateJob();
  const extractUrl = useExtractJobFromUrl();
  const extractImage = useExtractJobFromImage();
  const analyzeJob = useAnalyzeJob();

  const [activeTab, setActiveTab] = useState<TabId>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [manualForm, setManualForm] = useState({
    company_name: "",
    job_title: "",
    job_description: "",
    job_url: "",
    status: "saved" as CreateJobBodyStatus,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    if (isProcessing) return;
    onOpenChange(false);
    setUrl("");
    setFile(null);
    setManualForm({ company_name: "", job_title: "", job_description: "", job_url: "", status: "saved" });
    setActiveTab("url");
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsProcessing(true);
    try {
      const extracted = await extractUrl.mutateAsync({ data: { url } });
      const job = await createJob.mutateAsync({
        data: {
          company_name: extracted.extracted.company_name || "Unknown Company",
          job_title: extracted.extracted.job_title || "Unknown Title",
          job_description: extracted.extracted.job_description || "",
          job_url: url,
          status: "saved",
        },
      });
      void analyzeJob.mutateAsync({ id: job.job.id }).catch(console.error);
      toast({ title: "Job added!" });
      onOpenChange(false);
      setLocation(`/jobs/${job.job.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error extracting job", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const extracted = await extractImage.mutateAsync({ data: { image: file } });
      const job = await createJob.mutateAsync({
        data: {
          company_name: extracted.extracted.company_name || "Unknown Company",
          job_title: extracted.extracted.job_title || "Unknown Title",
          job_description: extracted.extracted.job_description || "",
          status: "saved",
        },
      });
      void analyzeJob.mutateAsync({ id: job.job.id }).catch(console.error);
      toast({ title: "Job added!" });
      onOpenChange(false);
      setLocation(`/jobs/${job.job.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error extracting job", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.company_name || !manualForm.job_title) return;
    setIsProcessing(true);
    try {
      const job = await createJob.mutateAsync({ data: manualForm });
      void analyzeJob.mutateAsync({ id: job.job.id }).catch(console.error);
      toast({ title: "Job added!" });
      onOpenChange(false);
      setLocation(`/jobs/${job.job.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error adding job", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop + centred modal */}
      <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-box" role="dialog" aria-modal onClick={(e) => e.stopPropagation()} aria-label="Add New Job">
        {/* Header */}
        <div className="modal-head">
          <div>
            <div className="modal-title">Add New Job</div>
            <div className="modal-sub">Paste a URL, upload a screenshot, or enter details manually.</div>
          </div>
          <button className="modal-close" onClick={handleClose} disabled={isProcessing}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {(["url", "image", "manual"] as TabId[]).map((tab) => (
            <button
              key={tab}
              className={`modal-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "url" ? "Paste URL" : tab === "image" ? "Screenshot" : "Manual"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === "url" && (
            <form onSubmit={handleUrlSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Job Posting URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/jobs/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input"
                  required
                />
                <span className="field-hint">Works with LinkedIn, Indeed, Greenhouse, Lever, and most job boards.</span>
              </div>
              <button
                type="submit"
                disabled={isProcessing || !url}
                className={`btn btn-primary btn-block${isProcessing ? " btn-loading" : ""}`}
                style={{ height: 44 }}
              >
                {isProcessing ? <span className="spinner" /> : null}
                {isProcessing ? "Extracting job…" : "Extract & Add Job"}
              </button>
            </form>
          )}

          {activeTab === "image" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="file-drop" onClick={() => document.getElementById("job-image-input")?.click()}>
                <input
                  type="file"
                  accept="image/*"
                  id="job-image-input"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload size={28} style={{ color: "var(--violet)", marginBottom: 8 }} />
                {file ? (
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{file.name}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>Click to upload screenshot</div>
                    <div style={{ fontSize: 12, color: "var(--text-4)" }}>PNG, JPG, WEBP up to 10MB</div>
                  </>
                )}
              </div>

              <button
                onClick={handleImageSubmit}
                disabled={isProcessing || !file}
                className={`btn btn-primary btn-block${isProcessing ? " btn-loading" : ""}`}
                style={{ height: 44 }}
              >
                {isProcessing ? <span className="spinner" /> : null}
                {isProcessing ? "Extracting job…" : "Extract & Add Job"}
              </button>
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label className="field-label">Company</label>
                  <input
                    value={manualForm.company_name}
                    onChange={(e) => setManualForm({ ...manualForm, company_name: e.target.value })}
                    className="input"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div className="field">
                  <label className="field-label">Job Title</label>
                  <input
                    value={manualForm.job_title}
                    onChange={(e) => setManualForm({ ...manualForm, job_title: e.target.value })}
                    className="input"
                    placeholder="Software Engineer"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Job URL (optional)</label>
                <input
                  type="url"
                  value={manualForm.job_url}
                  onChange={(e) => setManualForm({ ...manualForm, job_url: e.target.value })}
                  className="input"
                  placeholder="https://..."
                />
              </div>

              <div className="field">
                <label className="field-label">Status</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as CreateJobBodyStatus })}
                  className="input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Job Description (optional)</label>
                <textarea
                  value={manualForm.job_description}
                  onChange={(e) => setManualForm({ ...manualForm, job_description: e.target.value })}
                  className="textarea"
                  placeholder="Paste the job description here for better AI analysis..."
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualForm.company_name || !manualForm.job_title}
                className={`btn btn-primary btn-block${isProcessing ? " btn-loading" : ""}`}
                style={{ height: 44 }}
              >
                {isProcessing ? <span className="spinner" /> : null}
                {isProcessing ? "Adding job…" : "Add Job"}
              </button>
            </form>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
