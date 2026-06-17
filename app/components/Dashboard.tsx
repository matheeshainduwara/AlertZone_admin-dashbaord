"use client";
 
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardKPIs {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  totalCitizens: number;
  activeCitizens: number;
  suspendedCitizens: number;
}

interface StatusDistributionItem {
  status: string;
  count: number;
  color: string;
}

interface CategorySnapshotItem {
  categoryId: string;
  name: string;
  color: string;
  count: number;
}

interface RecentPendingReport {
  id: string;
  category: string;
  categoryId: string;
  categoryColor: string;
  description: string;
  province: string;
  district: string;
  address: string;
  createdAt: string;
  upvoteCount: number;
}

interface ActivityEntry {
  reportId: string;
  category: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

interface LeaderboardItem {
  uid: string;
  fullName: string;
  avatarUrl: string | null;
  contributionPoints: number;
  level: number;
  reportsResolved: number;
}

interface DashboardData {
  kpis: DashboardKPIs;
  statusDistribution: StatusDistributionItem[];
  categorySnapshot: CategorySnapshotItem[];
  recentPending: RecentPendingReport[];
  mostUpvotedPending: RecentPendingReport[];
  recentActivity: ActivityEntry[];
  leaderboard: LeaderboardItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", ASSIGNED: "Assigned", FIXING: "Fixing",
  RESOLVED: "Resolved", REJECTED: "Rejected",
};

const STATUS_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  PENDING:  { text: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  ASSIGNED: { text: "text-cyan-300",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20"  },
  FIXING:   { text: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/20"  },
  RESOLVED: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  REJECTED: { text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"  },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Category icon SVGs ───────────────────────────────────────────────────────

function CategoryIcon({ id, size = 16, color }: { id: string; size?: number; color: string }) {
  const s = { width: size, height: size };
  switch (id) {
    case "road_traffic":
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 6H5l-2 7h13l2-7H13zm-4 7V6"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 17H3v-5l2-6h9l2 6h1a2 2 0 012 2v3h-2"/></svg>;
    case "water_drainage":
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>;
    case "waste_environment":
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>;
    case "social_safety":
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
    case "bridge_structural":
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>;
    default:
      return <svg style={s} fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
  }
}

// ─── KPI Stat Card ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accentColor, icon, loading }: {
  label: string; value: number | string; sub?: string;
  accentColor: string; icon: React.ReactNode; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse">
        <div className="h-3 w-20 bg-white/10 rounded-full mb-4" />
        <div className="h-8 w-16 bg-white/10 rounded-lg mb-2" />
        <div className="h-2.5 w-24 bg-white/5 rounded-full" />
      </div>
    );
  }
  return (
    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-1 transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5 group overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[80px] opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-xl border border-white/5 bg-white/5 group-hover:scale-110 transition-transform duration-300" style={{ color: accentColor }}>
          {icon}
        </div>
      </div>
      <span className="text-3xl font-bold text-white tracking-tight font-mono">{typeof value === "number" ? value.toLocaleString() : value}</span>
      {sub && <span className="text-[11px] text-slate-500 font-medium mt-0.5">{sub}</span>}
    </div>
  );
}

// ─── Status Donut ─────────────────────────────────────────────────────────────

function StatusDonut({ data, total }: { data: StatusDistributionItem[]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = 80, cy = 80, r = 58, sw = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const arcs = data.map(item => {
    const pct = total > 0 ? item.count / total : 0;
    const dash = circ * pct;
    const arc = { ...item, dash, offset };
    offset += dash;
    return arc;
  });

  const hoveredItem = hovered ? data.find(d => d.status === hovered) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff08" strokeWidth={sw} />
          {arcs.map(arc => (
            <circle
              key={arc.status}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === arc.status ? sw + 4 : sw}
              strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
              strokeDashoffset={-arc.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-300 cursor-pointer"
              style={{ opacity: hovered && hovered !== arc.status ? 0.35 : 1 }}
              onMouseEnter={() => setHovered(arc.status)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {hoveredItem ? (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace" fontWeight="700" letterSpacing="1">
                {STATUS_LABEL[hoveredItem.status] ?? hoveredItem.status}
              </text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontWeight="700" fontSize="20" fill="#e2e8f0">
                {hoveredItem.count.toLocaleString()}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace" fontWeight="700" letterSpacing="1">TOTAL</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontWeight="700" fontSize="20" fill="#e2e8f0">
                {total.toLocaleString()}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {data.map(item => (
          <div
            key={item.status}
            className="flex items-center justify-between px-3 py-2 rounded-xl cursor-default transition-all duration-200"
            style={{ background: hovered === item.status ? `${item.color}15` : "transparent" }}
            onMouseEnter={() => setHovered(item.status)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-300 font-semibold">{STATUS_LABEL[item.status] ?? item.status}</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Snapshot Bar Chart ──────────────────────────────────────────────

function CategorySnapshot({ data }: { data: CategorySnapshotItem[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-3.5">
      {data.map(item => (
        <div key={item.categoryId} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <CategoryIcon id={item.categoryId} size={13} color={item.color} />
              <span className="text-xs text-slate-300 font-semibold">{item.name}</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{item.count}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-125"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color, opacity: 0.8 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}



function ActivityFeed({ data, onOpenReport }: {
  data: ActivityEntry[];
  onOpenReport: (reportId: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-50">
        <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-500 font-medium">No recent activity</p>
      </div>
    );
  }

  const handleClick = async (reportId: string) => {
    setLoadingId(reportId);
    await onOpenReport(reportId);
    setLoadingId(null);
  };

  return (
    <div className="space-y-0 relative">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/5" />
      {data.map((entry, idx) => {
        const newSt = STATUS_COLORS[entry.newStatus] ?? STATUS_COLORS["PENDING"];
        const isLoading = loadingId === entry.reportId;
        return (
          <div
            key={`${entry.reportId}-${idx}`}
            onClick={() => handleClick(entry.reportId)}
            title="Click to open report"
            className="flex gap-4 py-3 group cursor-pointer rounded-xl px-1 hover:bg-white/[0.04] transition-all duration-150 active:scale-[0.99] relative"
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 w-9 flex items-start justify-center pt-0.5 z-10">
              <div className="w-3 h-3 rounded-full border-2 border-current mt-0.5" style={{ backgroundColor: STATUS_COLORS[entry.newStatus]?.bg.replace("bg-", "") ?? "#4CC2D1", borderColor: STATUS_COLORS[entry.newStatus] ? `color-mix(in srgb, ${entry.newStatus === "RESOLVED" ? "#34D399" : entry.newStatus === "PENDING" ? "#F59E0B" : entry.newStatus === "REJECTED" ? "#E05C5C" : "#4CC2D1"} 60%, transparent)` : "#4CC2D1" }}>
                {/* Rendered as CSS dot — styled inline */}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${STATUS_COLORS[entry.oldStatus]?.text ?? "text-slate-400"} ${STATUS_COLORS[entry.oldStatus]?.bg ?? "bg-white/5"} ${STATUS_COLORS[entry.oldStatus]?.border ?? "border-white/10"}`}>
                    {STATUS_LABEL[entry.oldStatus] ?? entry.oldStatus}
                  </span>
                  <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${newSt.text} ${newSt.bg} ${newSt.border}`}>
                    {STATUS_LABEL[entry.newStatus] ?? entry.newStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">{timeAgo(entry.changedAt)}</span>
                  {/* Open indicator */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {isLoading ? (
                      <svg className="w-3 h-3 text-[#4CC2D1] animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-[#4CC2D1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 group-hover:text-slate-200 transition-colors">
                <span className="text-slate-200 font-semibold">{entry.category}</span>
                {" · "}
                <span className="font-mono text-[10px] text-slate-500">{entry.reportId.slice(0, 8)}…</span>
              </p>
              {entry.note && (
                <p className="text-[10px] text-slate-500 mt-0.5 italic line-clamp-1">"{entry.note}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ─── Quick Nav Cards ──────────────────────────────────────────────────────────

function QuickNavCard({
  label, count, countLabel, color, icon, onClick,
}: {
  label: string; count: string | number; countLabel: string;
  color: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-3 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 text-left w-full cursor-pointer"
    >
      <div className="p-2.5 rounded-xl border border-white/10 group-hover:border-white/20 transition-all" style={{ color, background: `${color}15` }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold text-white font-mono mt-0.5">{typeof count === "number" ? count.toLocaleString() : count}</p>
        <p className="text-[10px] text-slate-500">{countLabel}</p>
      </div>
      <div className="ml-auto self-end text-slate-600 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

function LeaderboardWidget({ data, loading, onNavigate }: { data: LeaderboardItem[]; loading: boolean; onNavigate: (tab: string) => void }) {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-teal-500/20 transition-all duration-300 flex flex-col overflow-hidden w-full">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>🏆</span> Top Contributors
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Community leaderboards by points</p>
        </div>
        <button
          onClick={() => onNavigate("users")}
          className="text-xs text-[#4CC2D1] font-bold hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          View All
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="divide-y divide-white/5 overflow-y-auto custom-scrollbar flex-1 pr-1" style={{ maxHeight: 380 }}>
        {loading ? (
          <div className="space-y-3.5 py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded-full w-1/3" />
                  <div className="h-2 bg-white/5 rounded-full w-1/4" />
                </div>
                <div className="h-4 bg-white/10 rounded-full w-12" />
              </div>
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 font-medium">No contributor data available</div>
        ) : (
          data.map((item, idx) => {
            const ranks = ["🥇", "🥈", "🥉", "4th", "5th"];
            const rankGlows = [
              "bg-amber-500/10 border-amber-500/30 text-amber-300",
              "bg-slate-300/10 border-slate-300/30 text-slate-200",
              "bg-orange-600/10 border-orange-600/30 text-orange-400",
              "bg-white/5 border-white/5 text-slate-400",
              "bg-white/5 border-white/5 text-slate-400",
            ];
            return (
              <div key={item.uid} className="flex items-center justify-between py-3 group/item hover:bg-white/[0.02] px-2 rounded-xl transition-all">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border select-none flex-shrink-0 ${rankGlows[idx] || rankGlows[3]}`}>
                    {ranks[idx] || `${idx + 1}`}
                  </span>
                  
                  <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex-shrink-0">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold font-mono">
                        {getInitials(item.fullName)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover/item:text-teal-400 transition-colors" title={item.fullName}>{item.fullName}</p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 font-semibold">
                      <span className="inline-flex items-center px-1 rounded bg-teal-500/5 text-teal-400/80 border border-teal-500/10 text-[8px] font-black">
                        Lvl {item.level}
                      </span>
                      <span>•</span>
                      <span>Res: {item.reportsResolved}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-extrabold text-teal-400 font-mono">{item.contributionPoints.toLocaleString()}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold -mt-0.5">pts</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSort, setPendingSort] = useState<"newest" | "upvotes">("newest");

  const displayReports = pendingSort === "newest"
    ? (data?.recentPending ?? [])
    : (data?.mostUpvotedPending ?? []);
 
  // Poll /api/notifications/recent via Admin SDK to get unread count.
  // We do NOT use onSnapshot here because the admin dashboard uses cookie-based JWT auth,
  // meaning request.auth == null in Firestore security rules, which blocks all client reads.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications/recent", { credentials: "include" });
        if (!res.ok) return;
        const body = await res.json();
        if (typeof body.unreadCount === "number") {
          setUnreadCount(body.unreadCount);
        }
      } catch { /* non-critical */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed — status ${res.status}`);
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const openReport = (report: RecentPendingReport) => {
    if (typeof window !== "undefined") {
      (window as any).pendingReportDetail = report;
      window.dispatchEvent(new CustomEvent("changeNavTab", { detail: "reports" }));
      window.dispatchEvent(new CustomEvent("openReportDetail", { detail: { report } }));
    }
  };

  // Fetch a report by ID from /api/reports, then navigate to Reports Management and open its modal
  const openReportFromActivity = useCallback(async (reportId: string) => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      const body = await res.json();
      const reports: any[] = body.reports ?? body ?? [];
      const found = reports.find((r: any) => r.id === reportId);
      if (!found) throw new Error("Report not found");
      if (typeof window !== "undefined") {
        (window as any).pendingReportDetail = found;
        window.dispatchEvent(new CustomEvent("changeNavTab", { detail: "reports" }));
        window.dispatchEvent(new CustomEvent("openReportDetail", { detail: { report: found } }));
      }
    } catch (err: any) {
      console.error("[Dashboard] openReportFromActivity error:", err.message);
    }
  }, []);

  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" :
    greetingHour < 17 ? "Good afternoon" :
    "Good evening";

  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeString = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-200">Failed to load dashboard</p>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2.5 bg-[#4CC2D1]/10 hover:bg-[#4CC2D1]/20 border border-[#4CC2D1]/30 text-[#4CC2D1] text-xs font-bold rounded-xl transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = data?.kpis;
  const totalReports = kpis?.total ?? 0;

  const scopeLabel = (() => {
    if (!user) return "Loading view...";
    const scope = user.scope ?? "all";
    if (scope === "all") return "All Island View";
    if (scope === "province") return `Province: ${user.province ?? "Unknown"} View`;
    if (scope === "district") return `District: ${user.district ?? "Unknown"} View`;
    if (scope === "lga") return `LGA: ${user.lga ?? "Unknown"} View`;
    return "Assigned View";
  })();

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-0.5">
            {greeting}, {user?.displayName ?? "Admin"} 👋
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 text-xs text-slate-400 mt-1 font-medium">
            <div className="flex items-center">
              <span>{dateString}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="font-mono text-teal-400/70">{timeString}</span>
            </div>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 border border-teal-500/20 text-teal-300 w-fit">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {scopeLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("notifications")}
            className="relative flex items-center justify-center p-2.5 text-slate-400 hover:text-teal-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
            title="View Notifications"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e] animate-pulse" />
            )}
          </button>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-40"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Strip ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-slide-up stagger-1">
        <KpiCard
          loading={loading} label="Total Reports" value={kpis?.total ?? 0}
          sub="All-time incidents" accentColor="#4CC2D1"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
        />
        <KpiCard
          loading={loading} label="Pending" value={kpis?.pending ?? 0}
          sub="Awaiting action" accentColor="#F59E0B"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
        />
        <KpiCard
          loading={loading} label="In Progress" value={kpis?.inProgress ?? 0}
          sub="Assigned or being fixed" accentColor="#60A5FA"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
        />
        <KpiCard
          loading={loading} label="Resolved" value={kpis?.resolved ?? 0}
          sub={totalReports > 0 ? `${Math.round(((kpis?.resolved ?? 0) / totalReports) * 100)}% resolution rate` : "No reports yet"}
          accentColor="#34D399"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <KpiCard
          loading={loading} label="Citizens" value={kpis?.totalCitizens ?? 0}
          sub={`${kpis?.activeCitizens ?? 0} active · ${kpis?.suspendedCitizens ?? 0} suspended`}
          accentColor="#A78BFA"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
      </div>

      {/* ── Middle Row: Pending Reports List + Status Donut ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-slide-up stagger-2">

        {/* Pending Reports Triage */}
        <div className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden hover:border-amber-500/20 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0 gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white">Reports Needing Action</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {loading
                  ? "Loading…"
                  : `${displayReports.length} pending reports · ${pendingSort === "newest" ? "Newest first" : "Most upvoted"}`
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Sort Toggle */}
              {!loading && data && (
                <div className="flex items-center p-0.5 bg-white/5 border border-white/10 rounded-lg select-none">
                  <button
                    type="button"
                    onClick={() => setPendingSort("newest")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      pendingSort === "newest"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSort("upvotes")}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      pendingSort === "upvotes"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Upvotes
                  </button>
                </div>
              )}

              <button
                onClick={() => onNavigate("reports")}
                className="text-xs text-[#4CC2D1] font-bold hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                View All
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: 420 }}>
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : !displayReports.length ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">All Clear</p>
                <p className="text-xs text-slate-500 mt-1">No pending reports at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {displayReports.map(report => (
                  <div key={report.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group">
                    {/* Category Icon */}
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-xl border border-white/5" style={{ background: `${report.categoryColor}15` }}>
                      <CategoryIcon id={report.categoryId} size={16} color={report.categoryColor} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{report.category} Incident</span>
                        {report.upvoteCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-300 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l2.5 5.5H20l-4.5 4 1.5 6L12 16.5 7 19.5l1.5-6L4 9.5h5.5L12 4z"/></svg>
                            {report.upvoteCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{report.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {report.province && report.district
                          ? `${report.district}, ${report.province}`
                          : report.address || "Unknown location"}
                        <span className="mx-1.5 text-slate-700">·</span>
                        {timeAgo(report.createdAt)}
                      </p>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => openReport(report)}
                      className="flex-shrink-0 self-center px-3 py-1.5 text-[10px] font-bold text-[#4CC2D1] bg-[#4CC2D1]/10 hover:bg-[#4CC2D1] hover:text-white border border-[#4CC2D1]/30 hover:border-transparent rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                    >
                      Open →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="lg:col-span-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col hover:border-white/20 transition-all duration-300">
          <div className="mb-5 flex-shrink-0">
            <h2 className="text-sm font-bold text-white">Status Distribution</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Live breakdown of all reports by status</p>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-5 animate-pulse">
              <div className="w-40 h-40 rounded-full border-[18px] border-white/5" />
              <div className="space-y-2 w-full">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-8" />)}
              </div>
            </div>
          ) : data?.statusDistribution?.length ? (
            <StatusDonut data={data.statusDistribution} total={totalReports} />
          ) : (
            <div className="flex items-center justify-center flex-1 text-slate-500 text-sm">No report data</div>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Category Snapshot + Leaderboard + Activity Feed ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 animate-slide-up stagger-3">

        {/* Category Snapshot */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-white">Report Categories</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">All-time incident volume by type</p>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : data?.categorySnapshot?.length ? (
            <CategorySnapshot data={data.categorySnapshot} />
          ) : (
            <div className="text-center text-slate-500 text-sm py-8">No category data</div>
          )}
        </div>

        {/* Top Contributors Leaderboard */}
        <div className="lg:col-span-4 flex">
          <LeaderboardWidget data={data?.leaderboard ?? []} loading={loading} onNavigate={onNavigate} />
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden hover:border-white/20 transition-all duration-300">
          <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Latest status changes across all reports</p>
          </div>
          <div className="overflow-y-auto flex-1 px-4 custom-scrollbar" style={{ maxHeight: 380 }}>
            {loading ? (
              <div className="space-y-4 py-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <ActivityFeed data={data?.recentActivity ?? []} onOpenReport={openReportFromActivity} />
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Nav Cards ────────────────────────────────────────────────────── */}
      <div className="animate-slide-up stagger-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickNavCard
            label="Reports" color="#F59E0B"
            count={kpis?.pending ?? "—"} countLabel="pending reports"
            onClick={() => onNavigate("reports")}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
          />
          <QuickNavCard
            label="Map View" color="#4CC2D1"
            count={kpis?.total ?? "—"} countLabel="total report pins"
            onClick={() => onNavigate("map")}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>}
          />
          <QuickNavCard
            label="Citizens" color="#A78BFA"
            count={kpis?.totalCitizens ?? "—"} countLabel="registered citizens"
            onClick={() => onNavigate("users")}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
          />
          <QuickNavCard
            label="Analytics" color="#34D399"
            count={kpis?.resolved ?? "—"} countLabel="reports resolved"
            onClick={() => onNavigate("analytics")}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
          />
          <QuickNavCard
            label="Notifications" color="#60A5FA"
            count="→" countLabel="send broadcasts"
            onClick={() => onNavigate("notifications")}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>}
          />
        </div>
      </div>
    </>
  );
}
