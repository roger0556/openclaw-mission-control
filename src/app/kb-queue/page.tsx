"use client";

import { useEffect, useState, useCallback } from "react";

const BRIDGE = "/bridge";

type QueueItem = {
  id: number;
  content_type: string;
  content_preview: string;
  source_file: string;
  source_type: string;
  confidence_level: string;
  target_kb_table: string;
  flagged_by: string;
  flagged_at: string;
  extraction_notes: string | null;
  full_content: string | null;
};

type HistoryItem = {
  id: number;
  content_type: string;
  content_preview: string;
  source_file: string;
  target_kb_table: string;
  flagged_by: string;
  flagged_at: string;
  status: "approved" | "rejected";
  reviewed_at: string;
  reviewer_note: string | null;
};

function confidenceColor(level: string | null) {
  if (!level) return "text-zinc-500";
  const l = level.toLowerCase();
  if (l.includes("high")) return "text-green-400";
  if (l.includes("medium")) return "text-yellow-400";
  if (l.includes("low")) return "text-red-400";
  return "text-zinc-400";
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function QueueCard({
  item,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, note: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(item.id);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(item.id, rejectNote);
    setLoading(false);
    setRejectMode(false);
    setRejectNote("");
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden mb-3">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                {item.content_type}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-blue-300 font-mono">
                → {item.target_kb_table}
              </span>
              <span className={`text-xs font-mono ${confidenceColor(item.confidence_level)}`}>
                {item.confidence_level}
              </span>
            </div>
            <p className="text-sm text-zinc-200 leading-snug">{item.content_preview}</p>
            <div className="text-xs text-zinc-500 mt-1.5 space-x-3">
              <span>Source: <span className="text-zinc-400 font-mono">{item.source_file}</span></span>
              <span>By: <span className="text-zinc-400">{item.flagged_by}</span></span>
              <span>Flagged: {formatDate(item.flagged_at)}</span>
            </div>
          </div>
        </div>

        {/* Expand toggle */}
        {(item.extraction_notes || item.full_content) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 underline underline-offset-2"
          >
            {expanded ? "Hide detail" : "Show extraction notes & full content"}
          </button>
        )}

        {expanded && (
          <div className="mt-3 space-y-2">
            {item.extraction_notes && (
              <div>
                <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Extraction Notes</p>
                <p className="text-xs text-zinc-300 bg-zinc-950 rounded p-2 border border-zinc-800">
                  {item.extraction_notes}
                </p>
              </div>
            )}
            {item.full_content && (
              <div>
                <p className="text-xs text-zinc-500 mb-1 font-semibold uppercase tracking-wide">Full Content</p>
                <pre className="text-xs text-zinc-300 bg-zinc-950 rounded p-2 border border-zinc-800 overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {item.full_content}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          {!rejectMode ? (
            <>
              <button
                disabled={loading}
                onClick={handleApprove}
                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 transition-colors"
              >
                {loading ? "Approving…" : "✓ Approve"}
              </button>
              <button
                disabled={loading}
                onClick={() => setRejectMode(true)}
                className="px-3 py-1.5 rounded text-sm font-medium bg-red-900/60 hover:bg-red-700/80 text-red-300 border border-red-800 disabled:opacity-50 transition-colors"
              >
                ✗ Reject
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Rejection note (optional)…"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                disabled={loading}
                onClick={handleReject}
                className="px-3 py-1.5 rounded text-sm font-medium bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
              >
                {loading ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button
                onClick={() => { setRejectMode(false); setRejectNote(""); }}
                className="px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800 last:border-0 text-xs">
      <span
        className={`shrink-0 px-1.5 py-0.5 rounded font-mono border ${
          item.status === "approved"
            ? "bg-green-500/10 text-green-400 border-green-700/40"
            : "bg-red-500/10 text-red-400 border-red-700/40"
        }`}
      >
        {item.status}
      </span>
      <span className="flex-1 text-zinc-300 truncate">{item.content_preview}</span>
      <span className="shrink-0 text-zinc-600 font-mono">{item.target_kb_table}</span>
      <span className="shrink-0 text-zinc-600">{formatDate(item.reviewed_at)}</span>
      {item.reviewer_note && (
        <span className="shrink-0 text-zinc-500 truncate max-w-[160px]" title={item.reviewer_note}>
          "{item.reviewer_note}"
        </span>
      )}
    </div>
  );
}

export default function KbQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BRIDGE}/api/kb/queue`);
      if (!r.ok) throw new Error(`Bridge returned ${r.status}`);
      const data = await r.json();
      setItems(data.items || []);
      setPendingCount((data.items || []).length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Could not load queue: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${BRIDGE}/api/kb/queue/history`);
      const data = await r.json();
      setHistory(data.items || []);
    } catch {
      // ignore history load failures
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadHistory();
  }, [loadQueue, loadHistory]);

  // SSE for live queue count updates
  useEffect(() => {
    const es = new EventSource(`${BRIDGE}/api/sse/queue`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data.pending_count === "number") {
          setPendingCount(data.pending_count);
          // Reload queue list if count changes
          loadQueue();
        }
      } catch {}
    };
    return () => es.close();
  }, [loadQueue]);

  const handleApprove = async (id: number) => {
    await fetch(`${BRIDGE}/api/kb/queue/${id}/approve`, { method: "POST" });
    await loadQueue();
    await loadHistory();
  };

  const handleReject = async (id: number, note: string) => {
    await fetch(`${BRIDGE}/api/kb/queue/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    await loadQueue();
    await loadHistory();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            KB Promotion Queue
            {pendingCount > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-mono">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Review and approve enrichment items before KB commit — nothing hits the KB without passing here
          </p>
        </div>
        <button
          onClick={() => { loadQueue(); loadHistory(); }}
          className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-zinc-800">
        {(["pending", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "pending" ? `Pending (${pendingCount})` : "History"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Pending tab */}
      {tab === "pending" && (
        <div>
          {loading ? (
            <div className="text-zinc-500 text-sm p-6 text-center">Loading queue…</div>
          ) : items.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <p className="text-zinc-500 text-sm">Queue is empty</p>
              <p className="text-zinc-600 text-xs mt-1">Will and Hendrik will flag items here when they need Roger&apos;s review before KB commit</p>
            </div>
          ) : (
            items.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No history yet</div>
          ) : (
            history.map((item) => <HistoryRow key={item.id} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}
