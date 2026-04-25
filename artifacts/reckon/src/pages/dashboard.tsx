import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetJobs, useGetProfile, useUpdateJob, Job } from "@workspace/api-client-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddJobModal } from "@/components/AddJobModal";
import { formatDistanceToNow } from "date-fns";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const STATUSES = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "interview", label: "Interview" },
  { id: "rejected", label: "Rejected" },
  { id: "offer", label: "Offer" },
] as const;

type StatusId = (typeof STATUSES)[number]["id"];

function JobCardContent({ job, isDragging = false }: { job: Job; isDragging?: boolean }) {
  const updatedOrCreated = job.updated_at ?? job.created_at;
  const isOldApplication =
    job.status === "applied" &&
    updatedOrCreated != null &&
    new Date().getTime() - new Date(updatedOrCreated).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      className={`rounded-xl border bg-card p-4 transition-all mb-3 ${
        isDragging
          ? "border-primary shadow-lg opacity-95 rotate-1"
          : "border-border hover:-translate-y-0.5 hover:border-primary cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="mb-1 text-xs text-muted-foreground">{job.company_name}</div>
      <div className="mb-3 font-syne text-sm font-bold leading-tight">{job.job_title}</div>

      <div className="flex items-center justify-between">
        {job.match_score != null ? (
          <div
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              job.match_score >= 80
                ? "bg-[#00d4aa]/10 text-[#00d4aa]"
                : job.match_score >= 50
                  ? "bg-[#ffd166]/10 text-[#ffd166]"
                  : "bg-[#ff6b6b]/10 text-[#ff6b6b]"
            }`}
          >
            {job.match_score}% Match
          </div>
        ) : (
          <div className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Unscored
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          {job.created_at
            ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
            : ""}
        </div>
      </div>

      {isOldApplication && (
        <div className="mt-2 inline-block rounded-full bg-[#ff6b9d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ff6b9d]">
          Follow Up
        </div>
      )}
    </div>
  );
}

function DraggableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
    data: { job },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Link href={`/jobs/${job.id}`} onClick={(e) => isDragging && e.preventDefault()}>
        <JobCardContent job={job} />
      </Link>
    </div>
  );
}

function DroppableColumn({
  status,
  jobs,
  isOver,
}: {
  status: { id: string; label: string };
  jobs: Job[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status.id });

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {status.label}
        </h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col min-h-[200px] rounded-xl p-1 transition-colors ${
          isOver ? "bg-primary/5 ring-2 ring-primary/30" : ""
        }`}
      >
        {jobs.map((job) => (
          <DraggableJobCard key={job.id} job={job} />
        ))}

        {jobs.length === 0 && (
          <div
            className={`rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground h-24 flex items-center justify-center transition-colors ${
              isOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/20"
            }`}
          >
            {isOver ? "Drop here" : "No jobs"}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    isError: jobsError,
    refetch,
  } = useGetJobs();
  const { data: profileResponse, isLoading: profileLoading } = useGetProfile();
  const updateJob = useUpdateJob();

  const jobs = jobsResponse?.jobs || [];
  const profile = profileResponse?.profile;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const job = event.active.data.current?.job as Job;
    setActiveJob(job ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | null;
    setOverColumnId(overId ?? null);
  }

  function handleDragCancel() {
    setActiveJob(null);
    setOverColumnId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const job = active.data.current?.job as Job;
    const newStatus = over.id as StatusId;

    if (!job || job.status === newStatus) return;

    const validStatuses: StatusId[] = STATUSES.map((s) => s.id);
    if (!validStatuses.includes(newStatus)) return;

    updateJob.mutate(
      { id: job.id, data: { status: newStatus } },
      { onSuccess: () => refetch() },
    );
  }

  if (jobsLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (jobsError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <p className="text-muted-foreground">Failed to load your jobs. Please try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalApplied = jobs.filter((j) =>
    ["applied", "interview", "offer", "rejected"].includes(j.status),
  ).length;
  const totalInterviews = jobs.filter((j) => ["interview", "offer"].includes(j.status)).length;
  const scoredJobs = jobs.filter((j) => j.match_score != null);
  const avgMatch =
    scoredJobs.length > 0
      ? Math.round(
          scoredJobs.reduce((acc, j) => acc + (j.match_score || 0), 0) / scoredJobs.length,
        )
      : 0;
  const totalOffers = jobs.filter((j) => j.status === "offer").length;

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <h1 className="font-syne text-3xl font-extrabold tracking-tight">
            {profile?.full_name ? `Welcome, ${profile.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90 rounded-xl px-5"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </Button>
      </div>

      {profile?.subscription_type === "free" && (profile.jobs_count || 0) >= 3 && (
        <div className="mb-6 rounded-xl border border-[#ffd166]/30 bg-[#ffd166]/5 p-4 text-sm text-[#ffd166]">
          <strong>Free plan limit reached.</strong> You have analyzed {profile.jobs_count || 0}{" "}
          jobs. Please upgrade your plan in Settings to analyze more jobs.
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Applied
          </div>
          <div className="font-syne text-3xl font-extrabold">{totalApplied}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Interviews
          </div>
          <div className="font-syne text-3xl font-extrabold text-[#00d4aa]">{totalInterviews}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg Match
          </div>
          <div className="font-syne text-3xl font-extrabold text-primary">{avgMatch}%</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Offers
          </div>
          <div className="font-syne text-3xl font-extrabold text-[#ffd166]">{totalOffers}</div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {STATUSES.map((status) => {
            const colJobs = jobs.filter((j) => j.status === status.id);
            return (
              <DroppableColumn
                key={status.id}
                status={status}
                jobs={colJobs}
                isOver={overColumnId === status.id}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeJob ? <JobCardContent job={activeJob} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <AddJobModal open={modalOpen} onOpenChange={setModalOpen} />
    </AppLayout>
  );
}
