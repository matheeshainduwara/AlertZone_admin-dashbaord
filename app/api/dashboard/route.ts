// app/api/dashboard/route.ts
// GET /api/dashboard — Returns live aggregated data for the Dashboard Overview page.
// Data: KPIs, status distribution, category snapshot, recent pending reports, recent activity feed.

import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/services/auth.service";
import { adminDb } from "@/lib/firebase-admin";
import { resolveSrilankaRegion } from "@/lib/constants/sriLankaRegions";

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) return null;
  return session;
}

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { name: string; color: string }> = {
  road_traffic:      { name: "Road & Traffic",      color: "#4CC2D1" },
  water_drainage:    { name: "Water & Drainage",    color: "#60A5FA" },
  waste_environment: { name: "Waste & Environment", color: "#34D399" },
  social_safety:     { name: "Social Safety",       color: "#A78BFA" },
  bridge_structural: { name: "Bridge & Structural", color: "#F59E0B" },
  other:             { name: "Other",                color: "#94A3B8" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  totalCitizens: number;
  activeCitizens: number;
  suspendedCitizens: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  color: string;
}

export interface CategorySnapshotItem {
  categoryId: string;
  name: string;
  color: string;
  count: number;
}

export interface RecentPendingReport {
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

export interface ActivityEntry {
  reportId: string;
  category: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface LeaderboardItem {
  uid: string;
  fullName: string;
  avatarUrl: string | null;
  contributionPoints: number;
  level: number;
  reportsResolved: number;
}

export interface DashboardPayload {
  kpis: DashboardKPIs;
  statusDistribution: StatusDistributionItem[];
  categorySnapshot: CategorySnapshotItem[];
  recentPending: RecentPendingReport[];
  mostUpvotedPending: RecentPendingReport[];
  recentActivity: ActivityEntry[];
  leaderboard: LeaderboardItem[];
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // ── Fetch reports ──────────────────────────────────────────────────────
    const reportsSnap = await adminDb
      .collection("reports")
      .orderBy("createdAt", "desc")
      .get();

    // ── Fetch users for citizen counts ──────────────────────────────────────
    const usersSnap = await adminDb
      .collection("users")
      .where("role", "==", "citizen")
      .get();

    const totalCitizens = usersSnap.size;
    let activeCitizens = 0;
    let suspendedCitizens = 0;
    for (const doc of usersSnap.docs) {
      const status = doc.data().status ?? "active";
      if (status === "active") activeCitizens++;
      else suspendedCitizens++;
    }

    // ── Filter reports by admin scope ──────────────────────────────────────
    let docs = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (session.scope && session.scope !== "all") {
      docs = docs.filter((r: any) => {
        const loc = r.location ?? {};
        const resolved2 = resolveSrilankaRegion(
          {
            region: loc.province ?? loc.region ?? "",
            district: loc.district ?? "",
            subregion: loc.subregion ?? "",
            city: loc.city ?? "",
            name: loc.name ?? "",
            street: loc.street ?? "",
          },
          loc.address ?? loc.area ?? "",
          typeof loc.latitude === "number" ? loc.latitude : (loc.latitude ? parseFloat(loc.latitude) : undefined),
          typeof loc.longitude === "number" ? loc.longitude : (loc.longitude ? parseFloat(loc.longitude) : undefined)
        );
        if (session.scope === "province") {
          return resolved2.province.toLowerCase() === session.province?.toLowerCase();
        }
        if (session.scope === "district") {
          return resolved2.district.toLowerCase() === session.district?.toLowerCase();
        }
        if (session.scope === "lga") {
          return resolved2.localGovernmentArea?.toLowerCase() === session.lga?.toLowerCase();
        }
        return true;
      });
    }

    // ── Aggregate report data ──────────────────────────────────────────────
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let rejected = 0;
    let assigned = 0;
    let fixing = 0;

    const categoryCount: Map<string, number> = new Map();
    const allActivity: ActivityEntry[] = [];
    const allPendingReports: RecentPendingReport[] = [];

    for (const reportObj of docs) {
      const data = reportObj as any;
      if (data.isArchived === true) continue;

      total++;
      const status: string = data.status ?? "PENDING";

      switch (status) {
        case "PENDING":   pending++;   break;
        case "ASSIGNED":  assigned++;  break;
        case "FIXING":    fixing++;    break;
        case "RESOLVED":  resolved++;  break;
        case "REJECTED":  rejected++;  break;
      }

      // Category snapshot
      const catId: string = data.categoryId ?? "other";
      categoryCount.set(catId, (categoryCount.get(catId) ?? 0) + 1);

      // Collect PENDING reports
      if (status === "PENDING") {
        const loc = data.location ?? {};
        let province = loc.province ?? "";
        let district = loc.district ?? "";

        // Use resolver if province/district are missing
        if (!province || !district) {
          const resolved2 = resolveSrilankaRegion(
            {
              region: loc.province ?? loc.region ?? "",
              district: loc.district ?? "",
              subregion: "",
              city: "",
              name: "",
              street: "",
            },
            loc.address ?? loc.area ?? "",
            typeof loc.latitude === "number" ? loc.latitude : (loc.latitude ? parseFloat(loc.latitude) : undefined),
            typeof loc.longitude === "number" ? loc.longitude : (loc.longitude ? parseFloat(loc.longitude) : undefined)
          );
          province = province || resolved2.province;
          district = district || resolved2.district;
        }

        const createdAt = data.createdAt?.toDate 
          ? data.createdAt.toDate().toISOString() 
          : (data.createdAt ?? null);

        const catId2 = data.categoryId ?? "other";
        const catMeta = CATEGORY_META[catId2] ?? CATEGORY_META["other"];

        allPendingReports.push({
          id: reportObj.id,
          category: data.category ?? catMeta.name,
          categoryId: catId2,
          categoryColor: catMeta.color,
          description: data.description ?? "",
          province,
          district,
          address: loc.address ?? loc.area ?? "",
          createdAt,
          upvoteCount: data.upvoteCount ?? 0,
        });
      }

      // Build activity feed from statusHistory
      const statusHistory: any[] = data.statusHistory ?? [];
      for (let i = 1; i < statusHistory.length; i++) {
        const entry = statusHistory[i];
        if (!entry) continue;
        const changedAt = entry.changedAt?.toDate
          ? entry.changedAt.toDate().toISOString()
          : (entry.changedAt ?? null);

        if (!changedAt) continue;

        allActivity.push({
          reportId: reportObj.id,
          category: data.category ?? "Unknown",
          oldStatus: statusHistory[i - 1]?.status ?? "PENDING",
          newStatus: entry.status,
          changedBy: entry.changedBy ?? "system",
          changedAt,
          note: entry.note,
        });
      }
    }

    inProgress = assigned + fixing;

    // ── Sort activity by changedAt desc, take top 10 ───────────────────────
    allActivity.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    const recentActivity = allActivity.slice(0, 10);

    // ── Build status distribution ──────────────────────────────────────────
    const STATUS_COLORS: Record<string, string> = {
      PENDING:  "#F59E0B",
      ASSIGNED: "#4CC2D1",
      FIXING:   "#60A5FA",
      RESOLVED: "#34D399",
      REJECTED: "#E05C5C",
    };

    const statusDistribution: StatusDistributionItem[] = [
      { status: "PENDING",  count: pending,  color: STATUS_COLORS["PENDING"]  },
      { status: "ASSIGNED", count: assigned, color: STATUS_COLORS["ASSIGNED"] },
      { status: "FIXING",   count: fixing,   color: STATUS_COLORS["FIXING"]   },
      { status: "RESOLVED", count: resolved, color: STATUS_COLORS["RESOLVED"] },
      { status: "REJECTED", count: rejected, color: STATUS_COLORS["REJECTED"] },
    ].filter(s => s.count > 0);

    // ── Build category snapshot ────────────────────────────────────────────
    const categorySnapshot: CategorySnapshotItem[] = Object.entries(CATEGORY_META).map(([id, meta]) => ({
      categoryId: id,
      name: meta.name,
      color: meta.color,
      count: categoryCount.get(id) ?? 0,
    })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

    // ── Build leaderboard (top 5 citizens sorted by points) ────────────────
    const leaderboard: LeaderboardItem[] = usersSnap.docs
      .map((doc) => {
        const uData = doc.data();
        return {
          uid: doc.id,
          fullName: uData.fullName || "Anonymous Citizen",
          avatarUrl: uData.avatarUrl || null,
          contributionPoints: uData.contributionPoints || 0,
          level: uData.level || 1,
          reportsResolved: uData.reportsResolved || uData.reportsValidated || 0,
        };
      })
      .sort((a, b) => b.contributionPoints - a.contributionPoints)
      .slice(0, 5);

    // Slice and sort pending reports for the overview widget
    const recentPending = allPendingReports.slice(0, 8);
    const mostUpvotedPending = [...allPendingReports]
      .sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) {
          return b.upvoteCount - a.upvoteCount;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 8);

    const payload: DashboardPayload = {
      kpis: { total, pending, inProgress, resolved, rejected, totalCitizens, activeCitizens, suspendedCitizens },
      statusDistribution,
      categorySnapshot,
      recentPending,
      mostUpvotedPending,
      recentActivity,
      leaderboard,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("❌ GET /api/dashboard error:", error);
    return NextResponse.json({ error: error.message ?? "Failed to load dashboard data" }, { status: 500 });
  }
}
