"use client";

import { useEffect, useState, useCallback } from "react";

const BRIDGE = "/bridge";

const STAGE_ORDER = ["hendrik", "normalize", "will", "simon", "linus"];

type StageData = {
  key: string;
  label: string;
  status: "complete" | "in_progress" | "pending" | "failed";
  confidence: string | null;
  started_at: string | null;
  completed_at: string | null;
  gaps: string[];
};

type RunSummary = {
  run_id: string;
  company: string;
  company_key: string;
  industry: string;
  mode: string;
  initiated_by: string;
  initiated_at: string;
  overall_status: string;
  current_stage: string;
  elapsed_seconds: number;
  status_color: "green" | "yellow" | "red" | "gray";
  stage_progress: StageData[];
  cost_entries: unknown[];
};

function formatElapsed(secs: number): string {
  if (!secs || secs < 0) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    in_progress: "bg-green-500/20 text-green-400 border-green-500/30",
    simon_complete: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    complete: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
  };
  const cls = map[status] || "bg-zinc-700/50 text-zinc-400 border-zinc-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function colorBar(color: string) {
  const map: Record<string, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    gray: "bg-zinc-500",
  };
  return map[color] || "bg-zinc-500";
}

function StageBar({ stages }: { stages: StageData[] }) {
  return (
    <div className="flex items-center gap-1 my-2">
      {stages.map((stage, i) => {
        let bg = "bg-zinc-700";
        let textCol = "text-zinc-500";
        if (stage.status === "complete") { bg = "bg-blue-600"; textCol = "text-white"; }
        if (stage.status === "in_progress") { bg = "bg-green-500 animate-pulse"; textCol = "text-white"; }
        if (stage.status === "failed") { bg = "bg-red-600"; textCol = "text-white"; }
        return (
          <div key={stage.key} className="flex items-center gap-1">
            <div className={`px-2 py-1 rounded text-xs font-mono font-medium ${bg} ${textCol}`}>
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <span className="text-zinc-600 text-xs">→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RunCard({ run }: { run: RunSummary }) {
  const [expanded, setExpanded] = useState(false);
  const [fullRun, setFullRun] = useState<{ run: RunSummary; raw: unknown } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDetail = useCallback(async () => {
    if (fullRun) return;
    setLoadingDetail(true);
    try {
      const r = await fetch(`${BRIDGE}/api/runs/${run.run_id}`);
      const data = await r.json();
      setFullRun(data);
    } catch {
      // ignore
    } finally {
      setLoadingDetail(false);
    }
  }, [run.run_id, fullRun]);

  const toggle = () => {
    if (!expanded) loadDetail();
    setExpanded((v) => !v);
  };

  const barColor = colorBar(run.status_color);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mb-3">
      {/* Color indicator bar */}
      <div className={`h-1 w-full ${barColor}`} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{run.company}</span>
              <span className="text-xs text-zinc-500 font-mono">{run.industry}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                {run.mode}
              </span>
              {statusBadge(run.overall_status)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Run: <span className="font-mono text-zinc-400">{run.run_id}</span>
              {" · "}Started: {formatDate(run.initiated_at)}
              {" · "}Elapsed: {formatElapsed(run.elapsed_seconds)}
            </div>
          </div>
          <button
            onClick={toggle}
            className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2 py-1 rounded transition-colors shrink-0"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {/* Stage progress bar */}
        <StageBar stages={run.stage_progress} />

        {/* Current stage confidence summary */}
        {run.stage_progress.map((s) => {
          if (s.key === run.current_stage && s.confidence) {
            return (
              <div key={s.key} className="text-xs text-zinc-400 mt-1">
                <span className="text-zinc-500">Confidence ({s.label}):</span>{" "}
                {s.confidence}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {loadingDetail && <p className="text-xs text-zinc-500">Loading detail…</p>}

          {run.stage_progress.map((stage) => {
            if (stage.status === "pending") return null;
            return (
              <div key={stage.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300 font-mono uppercase">
                    {stage.label}
                  </span>
                  {statusBadge(stage.status)}
                  {stage.confidence && (
                    <span className="text-xs text-zinc-500">{stage.confidence}</span>
                  )}
                </div>
                {stage.gaps.length > 0 && (
                  <ul className="mt-1 space-y-0.5 ml-2">
                    {stage.gaps.map((gap, i) => (
                      <li key={i} className="text-xs text-yellow-400/80 before:content-['⚠'] before:mr-1">
                        {gap}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}

          {fullRun && (
            <details className="mt-2">
              <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">
                Raw Run_Controller.json
              </summary>
              <pre className="mt-2 text-xs text-zinc-400 bg-zinc-950 rounded p-3 overflow-x-auto max-h-80">
                {JSON.stringify(fullRun.raw, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunsPage() {
  const [active, setActive] = useState<RunSummary[]>([]);
  const [recent, setRecent] = useState<RunSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch to populate immediately before SSE fires
    fetch(`${BRIDGE}/api/runs/recent`)
      .then((r) => r.json())
      .then((data) => {
        if (data.runs) setRecent(data.runs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      es = new EventSource(`${BRIDGE}/api/sse/runs`);

      es.onopen = () => {
        setConnected(true);
        setError(null);
      };

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setActive(data.active || []);
          setRecent(data.recent || []);
          setLastUpdate(new Date());
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        setError("Bridge API not reachable — retrying…");
        es?.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      es?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Run Monitor</h1>
          <p className="text-sm text-zinc-500 mt-0.5">AVEVA pipeline runs — live view</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`flex items-center gap-1.5 ${connected ? "text-green-400" : "text-red-400"}`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
            />
            {connected ? "Live" : "Disconnected"}
          </span>
          {lastUpdate && (
            <span className="text-zinc-600">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Active Runs */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Active Runs
          </h2>
          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono">
            {active.length}
          </span>
        </div>
        {active.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-sm">
            No active runs
          </div>
        ) : (
          active.map((run) => <RunCard key={run.run_id} run={run} />)
        )}
      </section>

      {/* Recent Runs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Recent Runs
          </h2>
          <span className="text-xs bg-zinc-700/50 text-zinc-400 border border-zinc-600 px-2 py-0.5 rounded font-mono">
            {recent.length}
          </span>
        </div>
        {recent.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-600 text-sm">
            No completed runs yet
          </div>
        ) : (
          recent.map((run) => <RunCard key={run.run_id} run={run} />)
        )}
      </section>
    </div>
  );
}
