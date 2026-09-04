import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { JobCard } from "@/components/jobs/job-card";
import { BOARD_LABELS, BOARD_STATUSES, type BoardStatus, type JobRecord } from "@/lib/jobs-data";

type KanbanBoardProps = {
  jobs: JobRecord[];
  onOpenJob: (job: JobRecord) => void;
  onMove: (job: JobRecord, to: BoardStatus) => void;
};

/**
 * Restrained semantic cues: a thin top border plus a small header dot. Colour is
 * never the only signal — every column still carries its text label and count.
 */
const COLUMN_CUES: Record<BoardStatus, { top: string; dot: string }> = {
  saved: { top: "border-t-border-strong", dot: "bg-subtle-foreground" },
  applied: { top: "border-t-primary", dot: "bg-primary" },
  interview: { top: "border-t-accent", dot: "bg-accent" },
  offer: { top: "border-t-success", dot: "bg-success" },
  rejected: { top: "border-t-destructive", dot: "bg-destructive" },
  withdrawn: { top: "border-t-warning", dot: "bg-warning" },
  closed: { top: "border-t-border-strong", dot: "bg-subtle-foreground" },
};

function DraggableCard({
  job,
  onOpen,
  suppressClick,
}: {
  job: JobRecord;
  onOpen: () => void;
  suppressClick: () => boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <JobCard
      ref={setNodeRef}
      job={job}
      dragging={isDragging}
      {...listeners}
      {...attributes}
      aria-label={`${job.title} at ${job.company} — open job detail. Press space to pick the card up, then use the arrow keys to move it between stages.`}
      onClick={() => {
        if (suppressClick()) return;
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onOpen();
          return;
        }
        listeners?.["onKeyDown"]?.(event);
      }}
    />
  );
}

function Column({
  status,
  jobs,
  children,
}: {
  status: BoardStatus;
  jobs: JobRecord[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cue = COLUMN_CUES[status];
  return (
    <section
      ref={setNodeRef}
      aria-label={`${BOARD_LABELS[status]} column`}
      className={cn(
        "flex w-[290px] min-w-[290px] shrink-0 grow basis-[290px] flex-col rounded-xl border border-t-2 border-border bg-surface-muted",
        cue.top,
        isOver && "border-primary/60 bg-primary/5",
      )}
    >
      <header className="flex items-center justify-between px-3 py-2.5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={cn("size-2 rounded-full", cue.dot)} aria-hidden="true" />
          {BOARD_LABELS[status]}
        </h3>
        <span className="rounded-md bg-card px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {jobs.length}
        </span>
      </header>
      <div className="flex min-h-[180px] flex-col gap-2 px-2 pb-3">{children}</div>
    </section>
  );
}

export function KanbanBoard({ jobs, onOpenJob, onMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const suppressUntil = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    const grouped = new Map<BoardStatus, JobRecord[]>();
    for (const status of BOARD_STATUSES) grouped.set(status, []);
    for (const job of jobs) grouped.get(job.boardStatus)?.push(job);
    return grouped;
  }, [jobs]);

  const activeJob = activeId ? jobs.find((job) => job.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const job = jobs.find((item) => item.id === String(event.active.id));
    setActiveId(null);
    suppressUntil.current = Date.now() + 250;
    const target = event.over ? String(event.over.id) : null;
    if (!job || !target) return;
    if (!(BOARD_STATUSES as readonly string[]).includes(target)) return;
    const to = target as BoardStatus;
    if (to === job.boardStatus) return;
    onMove(job, to);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        suppressUntil.current = Date.now() + 250;
      }}
    >
      <p className="sr-only" id="kanban-drag-help">
        Focus a job card and press space to pick it up, then use the arrow keys to move it to another
        stage and press space again to drop it. Press Enter to open the job instead.
      </p>

      {/* One continuous row for all seven stages. It scrolls horizontally
          whenever the seven fixed-width columns exceed the viewport, and never
          wraps to a second line. */}
      <section
        aria-label="Job stages"
        aria-describedby="kanban-drag-help"
        className="-mx-1 overflow-x-auto overflow-y-visible pb-3"
      >
        <div className="flex w-max min-w-full flex-nowrap items-stretch gap-4 px-1">
          {BOARD_STATUSES.map((status) => {
            const columnJobs = columns.get(status) ?? [];
            return (
              <Column key={status} status={status} jobs={columnJobs}>
                {columnJobs.length === 0 ? (
                  <p className="px-1 py-3 text-xs text-subtle-foreground">No jobs here yet.</p>
                ) : (
                  columnJobs.map((job) => (
                    <DraggableCard
                      key={job.id}
                      job={job}
                      onOpen={() => onOpenJob(job)}
                      suppressClick={() => Date.now() < suppressUntil.current}
                    />
                  ))
                )}
              </Column>
            );
          })}
        </div>
      </section>

      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} raised className="w-[274px]" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
