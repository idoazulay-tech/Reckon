import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetProfile, useUpdateProfile, useUploadResume, useGetBillingStatus, useCancelSubscription } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export default function Settings() {
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
    values: { fullName: profile?.full_name || "" }
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
        data: {
          resume: file || undefined,
          resume_text: resumeText || undefined
        }
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
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isFree = profile?.subscription_type === 'free';
  const limits = billing?.limits;

  return (
    <AppLayout>
      <h1 className="mb-8 font-syne text-3xl font-extrabold tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-card p-7">
          <h2 className="mb-6 font-syne text-lg font-bold">Profile Settings</h2>
          
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#ff6b9d] font-syne text-lg font-bold text-white">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                {...form.register("fullName")}
                className="bg-secondary/50"
              />
            </div>
            <Button type="submit" disabled={isUpdating} className="bg-primary hover:bg-primary/90">
              {isUpdating ? "Saving..." : "Save Profile"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="mb-4 text-sm font-semibold">Update Resume</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload PDF</Label>
                <Input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-secondary/50"
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">OR</div>
              <div className="space-y-2">
                <Label>Paste Text</Label>
                <Textarea 
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  className="min-h-[100px] bg-secondary/50"
                />
              </div>
              <Button 
                onClick={handleResumeUpload} 
                disabled={isUploading || (!file && !resumeText)}
                variant="secondary"
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Update Resume"}
              </Button>
            </div>
            
            {profile?.resume_text && (
              <div className="mt-4">
                <Label className="mb-2 block text-xs">Current Resume Snippet:</Label>
                <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground line-clamp-3">
                  {profile.resume_text}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-2xl border border-border bg-card p-7">
          <h2 className="mb-6 font-syne text-lg font-bold">Subscription & Usage</h2>
          
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[13px] font-semibold text-primary capitalize">
            {profile?.subscription_type ?? "free"} Plan
          </div>

          <div className="space-y-6">
            {/* Jobs Analyzed Usage */}
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Jobs Analyzed</span>
                <span>{billing?.jobs_count ?? 0} {limits?.free_jobs ? `/ ${limits.free_jobs}` : ''}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: limits?.free_jobs ? `${Math.min(100, ((billing?.jobs_count ?? 0) / limits.free_jobs) * 100)}%` : '10%' }}
                />
              </div>
            </div>

            {/* Daily AI Calls Usage */}
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Daily AI Analyses Used</span>
                <span>{billing?.today_ai_calls ?? 0} {limits?.daily_ai_analyses ? `/ ${limits.daily_ai_analyses}` : ''}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-[#00d4aa] transition-all"
                  style={{ width: limits?.daily_ai_analyses ? `${Math.min(100, ((billing?.today_ai_calls ?? 0) / limits.daily_ai_analyses) * 100)}%` : '10%' }}
                />
              </div>
            </div>

            {isFree ? (
              <div className="mt-8 rounded-xl border border-[#ff6b9d]/30 bg-[#ff6b9d]/5 p-5">
                <h3 className="mb-2 font-syne font-bold text-foreground">Upgrade to Pro</h3>
                <p className="mb-4 text-sm text-muted-foreground">Unlock unlimited job analysis, full missing skills list, and AI email generation.</p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-[#ff6b9d] text-white hover:bg-[#ff6b9d]/90">
                    Monthly — $19/mo
                  </Button>
                  <Button variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground">
                    Pay As You Go — $1 / 12 jobs
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 border-t border-border pt-6 space-y-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground capitalize">{profile?.subscription_type}</span> plan is active
                </div>
                <Button variant="destructive" onClick={handleCancelSub} className="bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/20">
                  Cancel Subscription
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
