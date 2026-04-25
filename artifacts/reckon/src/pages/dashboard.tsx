import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetJobs, useGetProfile, useUpdateJob, Job } from "@workspace/api-client-react";
import { Plus } from "lucide-react";
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
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STATUSES = [
  { id: "saved", label: "Saved", hint: "Bookmarked" },
  { id: "applied", label: "Applied", hint: "Submitted", accent: true },
  { id: "interview", label: "Interview", hint: "Active" },
  { id: "rejected", label: "Rejected", hint: "Closed" },
  { id: "offer", label: "Offer", hint: "Congrats!" },
] as const;

type StatusId = (typeof STATUSES)[number]["id"];

function scoreClass(score: number) {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

function JobCardContent({ job, isDragging = false }: { job: Job; isDragging?: boolean }) {
  const updatedOrCreated = job.updated_at ?? job.created_at;
  const isOldApplication =
    job.status === "applied" &&
    updatedOrCreated != null &&
    new Date().getTime() - new Date(updatedOrCreated).getTime() > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={`job-card${isDragging ? " dragging" : ""}`}>
      <div className="job-card-top">
        <div className="job-logo">
          {job.company_name?.charAt(0) ?? "?"}
        </div>
        {job.match_score != null ? (
          <span className={`score-badge ${scoreClass(job.match_score)}`}>
            {job.match_score}%
          </span>
        ) : (
          <span className="score-badge neutral">—</span>
        )}
      </div>

      <div className="job-company">{job.company_name}</div>
      <div className="job-title">{job.job_title}</div>

      <div className="job-card-foot">
        <span className="job-when">
          {job.created_at
            ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
            : ""}
        </span>
        {isOldApplication && (
          <span className="follow-badge">↑ Follow up</span>
        )}
      </div>
    </div>
  );
}

function DraggableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { job },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
  status: { id: string; label: string; hint?: string; accent?: boolean };
  jobs: Job[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status.id });
  const jobIds = jobs.map((j) => j.id);

  return (
    <div className={`kanban-col${status.accent ? " accent" : ""}${isOver ? " drag-over" : ""}`}>
      <div className="kanban-col-head">
        <div>
          <div className="kanban-col-title">{status.label}</div>
          {status.hint && <div className="kanban-col-hint">{status.hint}</div>}
        </div>
        <span className="kanban-count">{jobs.length}</span>
      </div>

      <div ref={setNodeRef} className="kanban-col-list">
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <DraggableJobCard key={job.id} job={job} />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div className="kanban-empty">
            {isOver ? "Drop here" : "No jobs yet"}
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
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({});
  const localOrderSnapshot = useRef<Record<string, string[]> | null>(null);

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

  useEffect(() => {
    if (!jobs.length && Object.keys(localOrder).length > 0) return;
    setLocalOrder((prev) => {
      const jobMap = new Map(jobs.map((j) => [j.id, j]));
      const next: Record<string, string[]> = {};
      STATUSES.forEach((s) => {
        const existing = (prev[s.id] || []).filter((id) => {
          const job = jobMap.get(id);
          return job && job.status === s.id;
        });
        const existingSet = new Set(existing);
        const newIds = jobs
          .filter((j) => j.status === s.id && !existingSet.has(j.id))
          .map((j) => j.id);
        next[s.id] = [...existing, ...newIds];
      });
      return next;
    });
  }, [jobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const columnStatusSet = new Set<string>(STATUSES.map((s) => s.id));

  function isColumnId(id: string): id is StatusId {
    return columnStatusSet.has(id);
  }

  function findContainer(id: string): string | undefined {
    if (isColumnId(id)) return id;
    return Object.entries(localOrder).find(([, ids]) => ids.includes(id))?.[0];
  }

  function handleDragStart(event: DragStartEvent) {
    const job = event.active.data.current?.job as Job;
    setActiveJob(job ?? null);
    localOrderSnapshot.current = localOrder;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) {
      setOverColumnId(overContainer ?? null);
      return;
    }

    setOverColumnId(overContainer);

    if (activeContainer === overContainer) return;

    setLocalOrder((prev) => {
      const sourceIds = [...(prev[activeContainer] || [])];
      const destIds = [...(prev[overContainer] || [])];

      const activeIndex = sourceIds.indexOf(activeId);
      if (activeIndex === -1) return prev;
      sourceIds.splice(activeIndex, 1);

      const isOverAColumn = isColumnId(overId);
      if (isOverAColumn) {
        destIds.push(activeId);
      } else {
        const overIndex = destIds.indexOf(overId);
        destIds.splice(overIndex >= 0 ? overIndex : destIds.length, 0, activeId);
      }

      return { ...prev, [activeContainer]: sourceIds, [overContainer]: destIds };
    });
  }

  function handleDragCancel() {
    setActiveJob(null);
    setOverColumnId(null);
    if (localOrderSnapshot.current) {
      setLocalOrder(localOrderSnapshot.current);
      localOrderSnapshot.current = null;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveJob(null);
    setOverColumnId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const job = active.data.current?.job as Job;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || !job) return;

    if (activeContainer === overContainer) {
      const isOverAColumn = isColumnId(overId);
      if (!isOverAColumn && activeId !== overId) {
        setLocalOrder((prev) => {
          const ids = [...(prev[activeContainer] || [])];
          const oldIdx = ids.indexOf(activeId);
          const newIdx = ids.indexOf(overId);
          if (oldIdx === -1 || newIdx === -1) return prev;
          return { ...prev, [activeContainer]: arrayMove(ids, oldIdx, newIdx) };
        });
      }
      localOrderSnapshot.current = null;
    } else {
      const newStatus = overContainer as StatusId;
      const validStatuses: StatusId[] = STATUSES.map((s) => s.id);
      if (validStatuses.includes(newStatus) && job.status !== newStatus) {
        const snapshot = localOrderSnapshot.current;
        localOrderSnapshot.current = null;
        updateJob.mutate(
          { id: job.id, data: { status: newStatus } },
          {
            onSuccess: () => refetch(),
            onError: () => {
              if (snapshot) setLocalOrder(snapshot);
            },
          },
        );
      } else {
        localOrderSnapshot.current = null;
      }
    }
  }

  if (jobsLoading || profileLoading) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </AppLayout>
    );
  }

  if (jobsError) {
    return (
      <AppLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 16, textAlign: "center" }}>
          <p style={{ color: "var(--text-3)" }}>Failed to load your jobs. Please try again.</p>
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </AppLayout>
    );
  }

  const totalApplied = jobs.filter((j) => ["applied", "interview", "offer", "rejected"].includes(j.status)).length;
  const totalInterviews = jobs.filter((j) => ["interview", "offer"].includes(j.status)).length;
  const scoredJobs = jobs.filter((j) => j.match_score != null);
  const avgMatch = scoredJobs.length > 0
    ? Math.round(scoredJobs.reduce((acc, j) => acc + (j.match_score || 0), 0) / scoredJobs.length)
    : 0;
  const totalOffers = jobs.filter((j) => j.status === "offer").length;

  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return (
    <AppLayout>
      <div className="main-header">
        <div>
          <div className="crumbs">Dashboard</div>
          <h1>
            {firstName ? `${greet}, ${firstName}.` : "Dashboard."}
          </h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          Add Job
        </button>
      </div>

      {profile?.subscription_type === "free" && (profile.jobs_count || 0) >= 3 && (
        <div className="alert-warn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>
            <strong>Free plan limit reached.</strong> You've analyzed {profile.jobs_count || 0} jobs.{" "}
            <Link href="/settings" style={{ color: "var(--violet-bright)" }}>Upgrade in Settings</Link> to analyze more.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Applied</div>
          <div className="stat-value">{totalApplied}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interviews</div>
          <div className="stat-value good">{totalInterviews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Match</div>
          <div className="stat-value violet">{avgMatch}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offers</div>
          <div className="stat-value warn">{totalOffers}</div>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="pulse-dot" />
        <span className="kicker">Live Board</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban">
          {STATUSES.map((status) => {
            const orderedIds = localOrder[status.id] || [];
            const colJobs = orderedIds
              .map((id) => jobMap.get(id))
              .filter((j): j is Job =>
                j !== undefined &&
                (j.status === status.id || j.id === activeJob?.id),
              );
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
