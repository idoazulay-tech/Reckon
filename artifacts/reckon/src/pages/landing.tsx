import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#05050a] text-foreground font-sans">
      <nav className="sticky top-0 z-50 flex flex-wrap items-center gap-2 border-b border-border bg-[#05050a] px-8 py-6">
        <div className="mr-4 flex items-center gap-2 font-syne text-xl font-extrabold text-foreground">
          R<span className="text-primary">.</span>
        </div>
        <div className="ml-auto flex gap-2">
          {user ? (
            <Link href="/dashboard" className="nav-btn">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="nav-btn">
                Login
              </Link>
              <Link href="/signup" className="nav-btn active bg-primary text-primary-foreground border-primary hover:bg-primary/90">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <div className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-8 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,111,255,0.15)_0%,transparent_70%)]" />
          
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            AI-Powered Job Search
          </div>

          <h1 className="mb-6 max-w-[680px] font-syne text-[clamp(32px,4vw,56px)] font-bold leading-[1.2] tracking-tight">
            Stop guessing why you're not{" "}
            <em className="bg-gradient-to-br from-primary to-[#ff6b9d] bg-clip-text not-italic text-transparent">
              getting interviews
            </em>
          </h1>

          <p className="mb-12 max-w-[520px] text-lg font-light leading-relaxed text-muted-foreground">
            Reckon reads every job posting, compares it to your resume, and tells you exactly what's missing -- then writes the perfect email for you.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-xl px-8 py-6 text-base h-auto">
                Start Free -- No Credit Card
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-xl px-8 py-6 text-base h-auto border-border bg-transparent hover:border-primary hover:text-primary">
              See How It Works
            </Button>
          </div>

          <div className="mt-20 flex gap-12 border-t border-border pt-12">
            <div className="text-center">
              <div className="font-syne text-3xl font-extrabold text-primary">78%</div>
              <div className="mt-1 text-[13px] text-[#555577]">average match score improvement</div>
            </div>
            <div className="text-center">
              <div className="font-syne text-3xl font-extrabold text-primary">3x</div>
              <div className="mt-1 text-[13px] text-[#555577]">more interview callbacks</div>
            </div>
            <div className="text-center">
              <div className="font-syne text-3xl font-extrabold text-primary">&lt;30s</div>
              <div className="mt-1 text-[13px] text-[#555577]">to analyze any job posting</div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-8 pb-32">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                <svg xmlns="http://www.w3.org/-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
              <div className="mb-2 font-syne text-[17px] font-bold">Paste Any Job URL</div>
              <div className="text-sm leading-[1.6] text-muted-foreground">Drop a link from LinkedIn, Indeed, or any company careers page. Reckon reads it instantly and extracts everything.</div>
            </div>
            
            <div className="rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                <svg xmlns="http://www.w3.org/-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="mb-2 font-syne text-[17px] font-bold">AI Match Analysis</div>
              <div className="text-sm leading-[1.6] text-muted-foreground">Get a precise match score plus a list of exactly what skills and experience are missing from your resume for that role.</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                <svg xmlns="http://www.w3.org/-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"></path><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path></svg>
              </div>
              <div className="mb-2 font-syne text-[17px] font-bold">Opening Emails Written</div>
              <div className="text-sm leading-[1.6] text-muted-foreground">Generates a highly personalized cold email or cover letter based on your exact skill gaps and strengths.</div>
            </div>
          </div>
        </div>
      </main>
      
      <style>{`
        .nav-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-card);
          color: var(--color-muted-foreground);
          font-size: 13px;
          transition: all 0.2s;
        }
        .nav-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
      `}</style>
    </div>
  );
}
