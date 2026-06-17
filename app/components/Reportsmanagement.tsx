"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReports } from "@/lib/hooks/useReports";
import { Report, ReportStatus } from "@/lib/types/report";
import { UserProfile } from "@/lib/types/user";
import { categoryStyleMeta } from "@/lib/constants/categories";
import { statusStyleMeta } from "@/lib/constants/statuses";
import { sriLankaGeographics, resolveSrilankaRegion } from "@/lib/constants/sriLankaRegions";
import { useAuth } from "@/lib/hooks/useAuth";
import MiniMap from "./MiniMap";
import UserDetailsModal from "./UserDetailsModal";
import logo1 from "../assets/logo1.png";


interface CalendarProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    onClose: () => void;
}

function formatDateOnly(dateStr: string) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
}

const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
};

function CustomCalendar({ value, onChange, onClose }: CalendarProps) {
    const today = new Date();
    const initialDate = value ? new Date(value) : today;
    const [viewDate, setViewDate] = useState(initialDate);
    const containerRef = useRef<HTMLDivElement>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Click outside listener
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleSelectDay = (day: number, isPrevMonth = false, isNextMonth = false) => {
        let targetMonth = month;
        let targetYear = year;
        if (isPrevMonth) {
            targetMonth = month - 1;
            if (targetMonth < 0) {
                targetMonth = 11;
                targetYear = year - 1;
            }
        } else if (isNextMonth) {
            targetMonth = month + 1;
            if (targetMonth > 11) {
                targetMonth = 0;
                targetYear = year + 1;
            }
        }
        const formattedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        onChange(formattedDate);
        onClose();
    };

    const handleSelectToday = () => {
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        onChange(formattedDate);
        onClose();
    };

    const handleClear = () => {
        onChange("");
        onClose();
    };

    const days = [];
    // Previous month offset days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        days.push({ day: prevMonthDays - i, isCurrentMonth: false, isPrevMonth: true });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, isCurrentMonth: true });
    }
    // Next month offset days to fill exactly 42 slots (6 rows of 7)
    const totalSlots = 42;
    const nextDaysNeeded = totalSlots - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
        days.push({ day: i, isCurrentMonth: false, isNextMonth: true });
    }

    // Selected date parsed
    const selectedDay = value ? new Date(value).getDate() : null;
    const selectedMonth = value ? new Date(value).getMonth() : null;
    const selectedYear = value ? new Date(value).getFullYear() : null;

    return (
        <div
            ref={containerRef}
            className="absolute top-full left-0 mt-2 z-50 w-72 bg-[#091622] border border-teal-500/20 rounded-2xl p-4 shadow-2xl shadow-black/80 ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-teal-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <span className="text-xs font-extrabold text-slate-200 tracking-wide select-none">
                    {monthNames[month]} {year}
                </span>

                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-teal-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                    <span key={d} className="text-[9px] font-extrabold text-slate-500 tracking-wider uppercase select-none">{d}</span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((item, idx) => {
                    const isSelected = item.isCurrentMonth &&
                        selectedDay === item.day &&
                        selectedMonth === month &&
                        selectedYear === year;

                    const isToday = item.isCurrentMonth &&
                        today.getDate() === item.day &&
                        today.getMonth() === month &&
                        today.getFullYear() === year;

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectDay(item.day, item.isPrevMonth, item.isNextMonth)}
                            className={`w-8 h-8 text-[11px] rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${!item.isCurrentMonth
                                    ? "text-slate-600 opacity-40 hover:bg-white/5 hover:text-slate-400 hover:scale-105"
                                    : isSelected
                                        ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-teal-500/30 scale-105"
                                        : isToday
                                            ? "border border-teal-500/50 text-teal-400 font-semibold"
                                            : "text-slate-300 hover:bg-white/10 hover:text-white hover:scale-105"
                                }`}
                        >
                            {item.day}
                        </button>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-white/5 mt-3 pt-3 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleSelectToday}
                    className="px-2.5 py-1 text-[10px] font-extrabold text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all cursor-pointer"
                >
                    Today
                </button>
                <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 text-[10px] font-extrabold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

export default function ReportsManagement() {
    const { user } = useAuth();
    const [showArchive, setShowArchive] = useState(false);
    const { reports, loading, error, changeStatus, archiveReport, refresh } = useReports("All", showArchive);
    const [selectedTab, setSelectedTab] = useState<ReportStatus | "All">("All");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [tempStatus, setTempStatus] = useState<ReportStatus | "">("");
    const [statusReason, setStatusReason] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [statusChangeFeedback, setStatusChangeFeedback] = useState<{
        status: ReportStatus;
        previousStatus: ReportStatus;
        message: string;
    } | null>(null);

    // Archive confirmation states
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [reportToArchive, setReportToArchive] = useState<Report | null>(null);

    // User details modal state
    const [selectedReporter, setSelectedReporter] = useState<UserProfile | null>(null);
    const [fetchingReporter, setFetchingReporter] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Load logo
            try {
                const img = new window.Image();
                img.src = logo1.src;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                if (img.complete && img.naturalWidth > 0) {
                    const logoWidth = 15;
                    const logoHeight = 15;
                    const xPos = (pageWidth - logoWidth) / 2;
                    doc.addImage(img, "PNG", xPos, 10, logoWidth, logoHeight);
                }
            } catch (e) {
                console.log("Logo load failed", e);
            }

            // Header
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("AlertZone Reports", pageWidth / 2, 34, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);

            // Filtered Dates
            let dateText = "All Time";
            if (startDate && endDate) {
                dateText = `${startDate} to ${endDate}`;
            } else if (startDate) {
                dateText = `From ${startDate}`;
            } else if (endDate) {
                dateText = `Until ${endDate}`;
            }
            doc.text(`Filtered Period: ${dateText}`, pageWidth / 2, 40, { align: "center" });

            doc.text(`Generated on: ${new Date().toLocaleString()}  |  Total Reports: ${filteredReports.length}`, pageWidth / 2, 46, { align: "center" });

            const tableColumn = ["ID", "Category", "Location", "Status", "Date", "Time"];
            const tableRows = filteredReports.map(report => {
                const loc = resolveLocation(report.location);
                const dateTime = getFormattedDateTime(report.createdAt);
                return [
                    report.id || "N/A",
                    report.category || "Unknown",
                    `${report.location?.address || ""}, ${loc.lga}, ${loc.district}`,
                    report.status,
                    dateTime.date,
                    dateTime.time
                ];
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 52,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [20, 184, 166] }
            });

            doc.save(`alertzone_reports_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Failed to export PDF:", error);
            alert("Failed to export PDF. Please ensure jspdf and jspdf-autotable are installed.");
        } finally {
            setIsExporting(false);
        }
    };
    const [showReporterModal, setShowReporterModal] = useState(false);

    // Filter states
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterProvince, setFilterProvince] = useState<string>("all");
    const [filterDistrict, setFilterDistrict] = useState<string>("all");
    const [filterLGA, setFilterLGA] = useState<string>("all");
    const [filterAdmin, setFilterAdmin] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "upvotes">("newest");

    // Memoized list of unique admins from statusHistory
    const uniqueAdmins = useMemo(() => {
        const admins = new Set<string>();
        reports.forEach(r => {
            (r.statusHistory || []).forEach(h => {
                if (h.changedBy) admins.add(h.changedBy);
            });
        });
        return Array.from(admins);
    }, [reports]);

    // Initialize filters based on admin scope
    useEffect(() => {
        if (user && user.scope && user.scope !== "all") {
            if (user.province) setFilterProvince(user.province);
            if ((user.scope === "district" || user.scope === "lga") && user.district) {
                setFilterDistrict(user.district);
            }
            if (user.scope === "lga" && user.lga) {
                setFilterLGA(user.lga);
            }
        }
    }, [user]);

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterProvince(e.target.value);
        setFilterDistrict("all");
        setFilterLGA("all");
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterDistrict(e.target.value);
        setFilterLGA("all");
    };

    const hasActiveFilters = startDate || endDate || filterCategory !== "all" || filterProvince !== "all" || filterDistrict !== "all" || filterLGA !== "all" || filterAdmin !== "all" || sortBy !== "newest";

    const clearAllFilters = () => {
        setStartDate("");
        setEndDate("");
        setShowStartCalendar(false);
        setShowEndCalendar(false);
        setFilterCategory("all");
        setFilterAdmin("all");
        setSortBy("newest");
        if (user && user.scope && user.scope !== "all") {
            if (user.province) setFilterProvince(user.province);
            if (user.scope === "province") {
                setFilterDistrict("all");
                setFilterLGA("all");
            } else if (user.scope === "district") {
                setFilterDistrict(user.district || "all");
                setFilterLGA("all");
            } else if (user.scope === "lga") {
                setFilterDistrict(user.district || "all");
                setFilterLGA(user.lga || "all");
            }
        } else {
            setFilterProvince("all");
            setFilterDistrict("all");
            setFilterLGA("all");
        }
    };

    function getReportDateString(dateValue: any) {
        if (!dateValue) return "";
        let dateObj: Date;
        if (typeof dateValue?.toDate === 'function') {
            dateObj = dateValue.toDate();
        } else {
            dateObj = new Date(dateValue);
        }
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    const filteredReports = reports.filter(report => {
        if (selectedTab !== "All" && report.status !== selectedTab) {
            return false;
        }

        if (startDate || endDate) {
            const reportDateStr = getReportDateString(report.createdAt);
            if (startDate && reportDateStr < startDate) {
                return false;
            }
            if (endDate && reportDateStr > endDate) {
                return false;
            }
        }

        if (filterCategory !== "all") {
            const catLower = report.category.toLowerCase().trim();
            const filterLower = filterCategory.toLowerCase().trim();

            const match = catLower === filterLower ||
                (filterLower === "water & drainage" && catLower === "water and drainage") ||
                (filterLower === "social safety" && catLower === "social security") ||
                (filterLower === "waste & environment" && catLower === "waste & env.");

            if (!match) {
                return false;
            }
        }

        const loc = resolveLocation(report.location);

        if (filterProvince !== "all") {
            const cleanReportProvince = loc.province.replace(/ Province/gi, "").trim().toLowerCase();
            const cleanFilterProvince = filterProvince.trim().toLowerCase();
            if (cleanReportProvince !== cleanFilterProvince) {
                return false;
            }
        }

        if (filterDistrict !== "all") {
            const cleanReportDistrict = loc.district.replace(/ District/gi, "").trim().toLowerCase();
            const cleanFilterDistrict = filterDistrict.trim().toLowerCase();
            if (cleanReportDistrict !== cleanFilterDistrict) {
                return false;
            }
        }

        if (filterLGA !== "all") {
            const cleanReportLGA = loc.lga.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").trim().toLowerCase();
            const cleanFilterLGA = filterLGA.replace(/ Municipal Council| Urban Council| Pradeshiya Sabha/gi, "").trim().toLowerCase();
            if (cleanReportLGA !== cleanFilterLGA) {
                return false;
            }
        }

        if (showArchive && filterAdmin !== "all") {
            const latestEntry = report.statusHistory && report.statusHistory.length > 0
                ? report.statusHistory[report.statusHistory.length - 1]
                : null;
            const changedBy = latestEntry?.changedBy?.toLowerCase().trim() || "";
            if (changedBy !== filterAdmin.toLowerCase().trim()) {
                return false;
            }
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === "upvotes") {
            const upvotesDiff = (b.upvoteCount || 0) - (a.upvoteCount || 0);
            if (upvotesDiff !== 0) return upvotesDiff;
            // secondary sort: newest first
            const aTime = a.createdAt ? new Date(typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : b.createdAt).getTime() : 0;
            return bTime - aTime;
        } else if (sortBy === "oldest") {
            const aTime = a.createdAt ? new Date(typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : b.createdAt).getTime() : 0;
            return aTime - bTime;
        } else { // default: newest first
            const aTime = a.createdAt ? new Date(typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : b.createdAt).getTime() : 0;
            return bTime - aTime;
        }
    });

    // ─── Update Status Function ───────────────────────────────────────────────
    const handleSaveStatus = async () => {
        if (!selectedReport || !tempStatus || tempStatus === selectedReport.status) return;

        setIsSaving(true);
        const newStatus = tempStatus as ReportStatus;
        const previousStatus = selectedReport.status;

        try {
            await changeStatus(selectedReport.id, newStatus, statusReason.trim() ? statusReason : undefined);

            // Status changes in Firestore will trigger onSnapshot and update the list,
            // but we also update the local selected report for immediate feedback
            setSelectedReport(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    status: newStatus,
                    statusHistory: [
                        ...(prev.statusHistory || []),
                        { status: newStatus, changedAt: new Date().toISOString(), changedBy: "Admin", note: statusReason }
                    ]
                };
            });
            setStatusReason("");
            setShowConfirm(false);
            setStatusChangeFeedback({
                status: newStatus,
                previousStatus,
                message: `Status successfully updated to ${newStatus}. ${newStatus === "RESOLVED"
                        ? "Citizen has been notified and rewarded +10 contribution points!"
                        : "Citizen has been notified."
                    }`
            });
        } catch (error) {
            console.error("Failed to save status", error);
            alert("Failed to update report status.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleArchiveToggle = (report: Report) => {
        setReportToArchive(report);
        setShowArchiveConfirm(true);
    };

    const confirmArchiveToggle = async () => {
        if (!reportToArchive) return;
        setIsSaving(true);
        try {
            const nextArchiveState = !reportToArchive.isArchived;
            await archiveReport(reportToArchive.id, nextArchiveState);

            // If the archived report is currently selected, update its local isArchived state
            if (selectedReport && selectedReport.id === reportToArchive.id) {
                setSelectedReport(prev => prev ? { ...prev, isArchived: nextArchiveState } : null);
            }

            // If we archived it (isArchived === true) and we're not in the archive view,
            // or if we unarchived it (isArchived === false) and we're in the archive view,
            // we should close the selection detail since it won't be in the active list anymore
            if (selectedReport && selectedReport.id === reportToArchive.id) {
                if ((nextArchiveState && !showArchive) || (!nextArchiveState && showArchive)) {
                    setSelectedReport(null);
                }
            }

            setShowArchiveConfirm(false);
            setReportToArchive(null);
        } catch (error) {
            console.error("Failed to archive report:", error);
            alert("Failed to update report archive status.");
        } finally {
            setIsSaving(false);
        }
    };

    const fetchReporterProfile = async (uid: string) => {
        if (!uid) return;
        setFetchingReporter(true);
        try {
            const res = await fetch(`/api/users/${uid}`);
            if (!res.ok) throw new Error("Failed to fetch user");
            const data = await res.json();
            setSelectedReporter(data.user);
        } catch (error) {
            console.error("Error fetching reporter profile:", error);
        } finally {
            setFetchingReporter(false);
        }
    };

    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [upvoters, setUpvoters] = useState<any[]>([]);
    const [loadingUpvoters, setLoadingUpvoters] = useState(false);

    const fetchComments = async (reportId: string) => {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/reports/${reportId}/comments`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
            const data = await res.json();
            setComments(data.comments ?? []);
        } catch (err) {
            console.error("Error loading comments:", err);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchUpvoters = async (reportId: string) => {
        setLoadingUpvoters(true);
        try {
            const res = await fetch(`/api/reports/${reportId}/upvotes`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load upvoters (${res.status})`);
            const data = await res.json();
            setUpvoters(data.upvoters ?? []);
        } catch (err) {
            console.error("Error loading upvoters:", err);
        } finally {
            setLoadingUpvoters(false);
        }
    };

    const handleReporterClick = () => {
        if (selectedReporter) {
            setShowReporterModal(true);
        }
    };

    function resolveLocation(location: any) {
        if (!location) return { province: "Unknown Province", district: "Unknown District", lga: "Unknown Area" };

        let resolvedProvince = location.province || "";
        let resolvedDistrict = location.district || "";
        let resolvedLGA = location.localGovernmentArea || "";

        if (!resolvedProvince || !resolvedDistrict || !resolvedLGA) {
            const areaStr = (location.area || "").trim();
            const addressStr = (location.address || "").trim();
            const fallbackStr = addressStr || areaStr;
            const latitude = typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude);
            const longitude = typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude);

            const res = resolveSrilankaRegion(
                {
                    region: resolvedProvince,
                    district: resolvedDistrict,
                    subregion: "",
                    city: "",
                    name: "",
                    street: "",
                },
                fallbackStr,
                latitude,
                longitude
            );
            resolvedProvince = res.province;
            resolvedDistrict = res.district;
            resolvedLGA = res.localGovernmentArea;
        }

        return {
            province: resolvedProvince || "Unknown Province",
            district: resolvedDistrict || "Unknown District",
            lga: resolvedLGA || "Unknown Area"
        };
    }

    const openDetails = (report: Report) => {
        setSelectedReport(report);
        setTempStatus(report.status);
        setSelectedReporter(null);
        setShowReporterModal(false);
        fetchReporterProfile(report.uid);
        fetchComments(report.id);
        fetchUpvoters(report.id);
    };

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).pendingReportDetail && reports.length > 0) {
            const report = (window as any).pendingReportDetail;
            const found = reports.find(r => r.id === report.id);
            const targetReport = found || report;
            if (targetReport) {
                setSelectedTab(targetReport.status);
                openDetails(targetReport);
            }
            (window as any).pendingReportDetail = null;
        }
    }, [reports]);

    useEffect(() => {
        const handleOpenReportDetail = (e: Event) => {
            const customEvent = e as CustomEvent<{ report: Report }>;
            if (customEvent.detail?.report) {
                const report = customEvent.detail.report;
                const found = reports.find(r => r.id === report.id);
                const targetReport = found || report;
                if (targetReport) {
                    setSelectedTab(targetReport.status);
                    openDetails(targetReport);
                }
            }
        };
        window.addEventListener("openReportDetail", handleOpenReportDetail);
        return () => window.removeEventListener("openReportDetail", handleOpenReportDetail);
    }, [reports]);

    function formatDate(dateValue: any) {
        if (!dateValue) return "Unknown date";
        if (typeof dateValue?.toDate === 'function') {
            return dateValue.toDate().toLocaleString();
        }
        return new Date(dateValue).toLocaleString();
    }

    function getFormattedDateTime(dateValue: any) {
        if (!dateValue) return { date: "Unknown date", time: "" };
        let dateObj: Date;
        if (typeof dateValue?.toDate === 'function') {
            dateObj = dateValue.toDate();
        } else {
            dateObj = new Date(dateValue);
        }
        return {
            date: dateObj.toLocaleDateString(undefined, { dateStyle: "medium" }),
            time: dateObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
        };
    }

    return (
        <div className="space-y-6 relative">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-100 to-teal-300 tracking-tight pb-1">
                        {showArchive ? "Archived Reports" : "Reports Management"}
                    </h1>
                    <p className="text-xs text-slate-300 mt-0.5">
                        {showArchive ? "View, filter, and restore soft-deleted emergency reports." : "Filter, monitor, and manage citizen emergency reports."}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setShowArchive(!showArchive);
                            clearAllFilters();
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${showArchive
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                : "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {showArchive ? "Go to Active Reports" : "Go to Archive"}
                    </button>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-teal-400 hover:border-teal-500/30 transition-all disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting || typeof filteredReports === 'undefined' || filteredReports.length === 0}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {isExporting ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        )}
                        {isExporting ? "Exporting..." : "Export PDF"}
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Reset */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up stagger-1">
                <div className="flex items-center gap-1 p-1 bg-[#0f2233]/60 backdrop-blur-md border border-white/5 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
                    {(["All", "PENDING", "ASSIGNED", "FIXING", "RESOLVED", "REJECTED"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${selectedTab === tab
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                }`}
                        >
                            {tab === "All" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            {tab === "All" ? "" : ` (${reports.filter(r => r.status === tab).length})`}
                        </button>
                    ))}
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-xs font-semibold text-rose-400 transition-all flex items-center gap-1.5 self-end sm:self-auto"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Filter Grid */}
            <div className={`relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${showArchive ? 'xl:grid-cols-8' : 'xl:grid-cols-7'} gap-3 p-4 bg-[#0f2233]/40 backdrop-blur-md border border-white/5 rounded-2xl animate-slide-up stagger-1.5`}>
                {/* Sort By Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sort By</label>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "upvotes")}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer"
                        >
                            <option value="newest" className="bg-[#0b1a26] text-slate-300">Newest First</option>
                            <option value="oldest" className="bg-[#0b1a26] text-slate-300">Oldest First</option>
                            <option value="upvotes" className="bg-[#0b1a26] text-slate-300">Most Upvoted</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Start Date Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">From Date</label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowStartCalendar(!showStartCalendar);
                                setShowEndCalendar(false);
                            }}
                            className={`w-full bg-white/5 border border-white/10 rounded-xl pl-10 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all text-left flex items-center h-[38px] cursor-pointer ${startDate ? "pr-8" : "pr-4"
                                }`}
                        >
                            {startDate ? formatDateOnly(startDate) : <span className="text-slate-500 font-medium">Select date</span>}
                        </button>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        {startDate && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setStartDate("");
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-md transition-all cursor-pointer z-10"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {showStartCalendar && (
                            <CustomCalendar
                                value={startDate}
                                onChange={(date) => setStartDate(date)}
                                onClose={() => setShowStartCalendar(false)}
                            />
                        )}
                    </div>
                </div>

                {/* End Date Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">To Date</label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEndCalendar(!showEndCalendar);
                                setShowStartCalendar(false);
                            }}
                            className={`w-full bg-white/5 border border-white/10 rounded-xl pl-10 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all text-left flex items-center h-[38px] cursor-pointer ${endDate ? "pr-8" : "pr-4"
                                }`}
                        >
                            {endDate ? formatDateOnly(endDate) : <span className="text-slate-500 font-medium">Select date</span>}
                        </button>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        {endDate && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEndDate("");
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-md transition-all cursor-pointer z-10"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {showEndCalendar && (
                            <CustomCalendar
                                value={endDate}
                                onChange={(date) => setEndDate(date)}
                                onClose={() => setShowEndCalendar(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Category Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Category</label>
                    <div className="relative">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer"
                        >
                            <option value="all" className="bg-[#0b1a26] text-slate-300">All Categories</option>
                            <option value="Road & Traffic" className="bg-[#0b1a26] text-slate-300">Road & Traffic</option>
                            <option value="Water & Drainage" className="bg-[#0b1a26] text-slate-300">Water & Drainage</option>
                            <option value="Waste & Environment" className="bg-[#0b1a26] text-slate-300">Waste & Environment</option>
                            <option value="Social Safety" className="bg-[#0b1a26] text-slate-300">Social Safety</option>
                            <option value="Bridge & Structural" className="bg-[#0b1a26] text-slate-300">Bridge & Structural</option>
                            <option value="Other" className="bg-[#0b1a26] text-slate-300">Other</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Province Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Province</label>
                    <div className="relative">
                        <select
                            value={filterProvince}
                            onChange={handleProvinceChange}
                            disabled={!!(user?.scope && user.scope !== "all")}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="all" className="bg-[#0b1a26] text-slate-300">All Provinces</option>
                            {Object.keys(sriLankaGeographics).map(province => (
                                <option key={province} value={province} className="bg-[#0b1a26] text-slate-300">
                                    {province}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* District Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">District</label>
                    <div className="relative">
                        <select
                            value={filterDistrict}
                            onChange={handleDistrictChange}
                            disabled={filterProvince === "all" || !!(user?.scope === "district" || user?.scope === "lga")}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="all" className="bg-[#0b1a26] text-slate-300">All Districts</option>
                            {filterProvince !== "all" && Object.keys(sriLankaGeographics[filterProvince] || {}).map(district => (
                                <option key={district} value={district} className="bg-[#0b1a26] text-slate-300">
                                    {district}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors group-disabled:opacity-40">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* LGA Filter */}
                <div className="relative group flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">LGA</label>
                    <div className="relative">
                        <select
                            value={filterLGA}
                            onChange={(e) => setFilterLGA(e.target.value)}
                            disabled={filterDistrict === "all" || !!(user?.scope === "lga")}
                            className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="all" className="bg-[#0b1a26] text-slate-300">All LGAs</option>
                            {filterProvince !== "all" && filterDistrict !== "all" && (sriLankaGeographics[filterProvince]?.[filterDistrict] || []).map(lga => (
                                <option key={lga} value={lga} className="bg-[#0b1a26] text-slate-300">
                                    {lga}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors group-disabled:opacity-40">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Admin Filter (Only shown when viewing archive) */}
                {showArchive && (
                    <div className="relative group flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Admin</label>
                        <div className="relative">
                            <select
                                value={filterAdmin}
                                onChange={(e) => setFilterAdmin(e.target.value)}
                                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/25 transition-all font-semibold cursor-pointer"
                            >
                                <option value="all" className="bg-[#0b1a26] text-slate-300">All Admins</option>
                                {uniqueAdmins.map(admin => (
                                    <option key={admin} value={admin} className="bg-[#0b1a26] text-slate-300">
                                        {admin}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-400 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reports Found Count */}
            {!loading && !error && (
                <div className="text-xs text-slate-400 font-semibold pl-1 animate-fade-in">
                    {filteredReports.length} Reports found
                </div>
            )}

            {/* Reports List */}
            <div className="grid grid-cols-1 gap-4 animate-slide-up stagger-2">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                        <div className="text-red-400 text-3xl mb-3">⚠️</div>
                        <h3 className="text-red-200 font-semibold text-sm">Failed to Load Reports</h3>
                        <p className="text-slate-400 text-xs mt-1">{error}</p>
                        <button
                            onClick={refresh}
                            className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl mb-4 opacity-50">
                            📁
                        </div>
                        <h3 className="text-slate-200 font-semibold">No reports found</h3>
                        <p className="text-slate-500 text-xs mt-1">There are no reports matching the selected filter.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => {
                        const cat = categoryStyleMeta[report.category] || categoryStyleMeta["Other"];
                        const st = statusStyleMeta[report.status] || { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" };
                        const loc = resolveLocation(report.location);
                        const { date, time } = getFormattedDateTime(report.createdAt);

                        return (
                            <div
                                key={report.id}
                                className="group bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl p-5 hover:border-teal-500/30 hover:shadow-[0_0_30px_rgb(20,184,166,0.05)] transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                                            {cat.icon}
                                        </div>
                                        <div className="space-y-1.5 text-left">
                                            <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                                                <span>{report.category} Incident</span>
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none ${
                                                    report.upvoteCount > 0 
                                                        ? "text-orange-300 bg-orange-500/10 border border-orange-500/20" 
                                                        : "text-slate-500 bg-white/5 border border-white/10"
                                                }`}>
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l2.5 5.5H20l-4.5 4 1.5 6L12 16.5 7 19.5l1.5-6L4 9.5h5.5L12 4z"/></svg>
                                                    {report.upvoteCount || 0} {report.upvoteCount === 1 ? "upvote" : "upvotes"}
                                                </span>
                                                <span className="text-[10px] font-normal text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5 text-teal-500/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {date} • {time}
                                                </span>
                                            </h3>
                                            <div className="space-y-0.5 text-[11px] text-slate-400">
                                                <p className="flex items-center gap-1">
                                                    <span className="font-semibold text-slate-500">Province:</span>
                                                    <span className="text-slate-300">{loc.province}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="font-semibold text-slate-500">District:</span>
                                                    <span className="text-slate-300">{loc.district}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="font-semibold text-slate-500">LGA:</span>
                                                    <span className="text-slate-300">{loc.lga}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 pt-0.5">
                                                <span className="text-[10px] text-slate-500 font-mono">Incident ID: {report.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.color} border border-white/5`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                            {report.status}
                                        </span>
                                        {(report.status === "RESOLVED" || report.status === "REJECTED") && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleArchiveToggle(report);
                                                }}
                                                title={report.isArchived ? "Restore from Archive" : "Archive Report"}
                                                className={`p-2.5 border rounded-xl transition-all group/btn cursor-pointer ${report.isArchived
                                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:bg-white/10"
                                                    }`}
                                            >
                                                {report.isArchived ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openDetails(report)}
                                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-teal-400 hover:bg-white/10 transition-all group/btn"
                                        >
                                            <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl italic line-clamp-2">
                                        "{report.description}"
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── Detail Modal ────────────────────────────────────────────────── */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedReport(null)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[95vh] bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col mx-2 sm:mx-0">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${(categoryStyleMeta[selectedReport.category] || categoryStyleMeta["Other"]).bg} flex items-center justify-center text-2xl border border-white/5 shadow-inner`}>
                                    {(categoryStyleMeta[selectedReport.category] || categoryStyleMeta["Other"]).icon}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl text-white font-bold tracking-tight">{selectedReport.category} Incident</h2>
                                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {(() => {
                                            const loc = resolveLocation(selectedReport.location);
                                            return [loc.province, loc.district, loc.lga].filter(Boolean).join(", ");
                                        })()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
                            {/* Full-width Status Banner */}
                            {(() => {
                                const st = statusStyleMeta[selectedReport.status] || { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" };
                                const latestEntry = selectedReport.statusHistory && selectedReport.statusHistory.length > 0
                                    ? selectedReport.statusHistory[selectedReport.statusHistory.length - 1]
                                    : null;
                                const lastChangedAt = latestEntry?.changedAt || selectedReport.createdAt;
                                const { date, time } = getFormattedDateTime(lastChangedAt);
                                return (
                                    <div className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${st.bg} border-white/5 ${st.color}`}>
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-2 h-2 rounded-full ${st.dot} animate-pulse`} />
                                            <span className="text-xs font-bold uppercase tracking-widest">
                                                Status: {selectedReport.status}
                                            </span>
                                        </div>
                                        <span className="text-[10px] opacity-75 font-semibold">
                                            Status Updated: {date} · {time}
                                        </span>
                                    </div>
                                );
                            })()}

                            {/* Top Grid: Overview + Map */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</p>
                                            <p className="text-sm font-semibold text-slate-200">{selectedReport.category}</p>
                                        </div>
                                        <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</p>
                                            {(() => {
                                                const { date, time } = getFormattedDateTime(selectedReport.createdAt);
                                                return (
                                                    <>
                                                        <p className="text-sm font-semibold text-slate-200">{date}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className="p-3 bg-white/3 border border-white/5 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Community Upvotes</p>
                                            <p className="text-sm font-bold text-orange-400 flex items-center gap-1.5 mt-0.5">
                                                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l2.5 5.5H20l-4.5 4 1.5 6L12 16.5 7 19.5l1.5-6L4 9.5h5.5L12 4z"/></svg>
                                                {selectedReport.upvoteCount || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Separated Location Blocks & Google Maps link */}
                                    <div className="p-4 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Geographical & Location Details
                                        </p>
                                        <div className="space-y-2.5">
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="p-2 bg-white/2 border border-white/5 rounded-xl space-y-1">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Province</span>
                                                    <span className="text-xs font-bold text-slate-200">{(() => { const loc = resolveLocation(selectedReport.location); return loc.province; })()}</span>
                                                </div>
                                                <div className="p-2 bg-white/2 border border-white/5 rounded-xl space-y-1">
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">District</span>
                                                    <span className="text-xs font-bold text-slate-200">{(() => { const loc = resolveLocation(selectedReport.location); return loc.district; })()}</span>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-white/2 border border-white/5 rounded-xl space-y-1">
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Local Government Area (LGA)</span>
                                                <span className="text-xs font-bold text-slate-200 block">{(() => { const loc = resolveLocation(selectedReport.location); return loc.lga; })()}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-2">
                                            <div className="space-y-0.5 text-xs">
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Reported Address</span>
                                                <p className="text-slate-300 font-medium text-[11px] leading-relaxed">{selectedReport.location?.address || "No formal address provided"}</p>
                                            </div>
                                            {selectedReport.location?.latitude && selectedReport.location?.longitude && (
                                                <div className="pt-1.5 flex items-center justify-between border-t border-white/5 gap-4">
                                                    <div className="text-[10px] text-slate-500 font-mono">
                                                        Coords: {selectedReport.location.latitude.toFixed(6)}, {selectedReport.location.longitude.toFixed(6)}
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedReport.location.latitude},${selectedReport.location.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 hover:border-teal-500/40 rounded-lg text-[9px] font-bold text-teal-400 transition-all hover:scale-[1.02]"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                        Google Maps Link
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/3 border border-white/5 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reporter Evidence</p>
                                        <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedReport.description}"</p>
                                        <div className="flex gap-2.5 mt-2 overflow-x-auto pb-1">
                                            {selectedReport.imageUrls?.map((img, i) => (
                                                <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group/img">
                                                    <img src={img} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                                </div>
                                            ))}
                                            {(!selectedReport.imageUrls || selectedReport.imageUrls.length === 0) && (
                                                <div className="text-xs text-slate-500 italic py-2">No images provided.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Map Placeholder */}
                                <div className="relative h-full min-h-[240px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 group/map">
                                    <MiniMap report={selectedReport} />
                                    <div className="absolute top-4 left-4 p-2 bg-[#0f2233]/90 backdrop-blur-md rounded-lg border border-white/10 text-[10px] text-slate-200 z-[1000] max-w-[280px]">
                                        {(() => {
                                            const loc = resolveLocation(selectedReport.location);
                                            return [loc.province, loc.district, loc.lga].filter(Boolean).join(", ");
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Citizen Details & Management */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {/* Reporter Card */}
                                <div
                                    onClick={handleReporterClick}
                                    className="p-5 bg-white/2 hover:bg-white/5 border border-white/5 rounded-2xl space-y-4 flex flex-col justify-between cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                            Reporter Details
                                            {fetchingReporter && <span className="text-teal-400 normal-case tracking-normal">Loading...</span>}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            {selectedReporter?.avatarUrl ? (
                                                <img src={selectedReporter.avatarUrl} alt="Reporter" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                                                    {selectedReport.authorName ? selectedReport.authorName.split(' ').map(n => n[0]).join('').substring(0, 2) : '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{selectedReport.authorName}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 relative z-10 flex items-center justify-between">
                                        <span className="text-[10px] text-teal-400 font-semibold group-hover:underline">View Full Profile</span>
                                        <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </div>
                                </div>

                                {/* Status Update Dropdown Section */}
                                <div className="lg:col-span-2 p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col gap-4 shadow-inner">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Update Progress Status</p>
                                        <p className="text-xs text-slate-400 italic">Select the stage and provide a reason for the reporter.</p>
                                    </div>

                                    {!showConfirm ? (
                                        <div className="space-y-3">
                                            <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                                                <div className="w-full relative group">
                                                    <select
                                                        value={tempStatus}
                                                        onChange={(e) => setTempStatus(e.target.value as ReportStatus)}
                                                        className="w-full appearance-none bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer hover:bg-[#0f2233]"
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="ASSIGNED">Assigned</option>
                                                        <option value="FIXING">Fixing</option>
                                                        <option value="RESOLVED">Resolved</option>
                                                        <option value="REJECTED">Rejected</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-teal-400 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" /></svg>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowConfirm(true)}
                                                    disabled={isSaving || tempStatus === selectedReport.status}
                                                    className={`min-w-[140px] px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${tempStatus === selectedReport.status
                                                        ? "bg-slate-700/20 text-slate-500 border border-white/5 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-teal-900/40 hover:brightness-110 active:scale-[0.98]"
                                                        }`}
                                                >
                                                    Review Change
                                                </button>
                                            </div>

                                            <div className="relative">
                                                <textarea
                                                    value={statusReason}
                                                    onChange={(e) => setStatusReason(e.target.value)}
                                                    placeholder="Provide a reason or update details for the citizen..."
                                                    className="w-full bg-[#0d1f2d] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors resize-none h-16 placeholder:text-slate-600"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 border border-teal-500/30 bg-teal-500/10 rounded-xl animate-in fade-in zoom-in-95">
                                            <p className="text-sm font-semibold text-slate-200 mb-2">Confirm Status Change</p>
                                            <p className="text-xs text-slate-300 mb-4">
                                                You are about to change the status from <span className="font-bold text-orange-400">{selectedReport.status}</span> to <span className="font-bold text-teal-400">{tempStatus}</span>. This will send a notification to the citizen.
                                            </p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSaveStatus}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    {isSaving ? "Saving..." : "Confirm & Send"}
                                                </button>
                                                <button
                                                    onClick={() => setShowConfirm(false)}
                                                    disabled={isSaving}
                                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-white/10"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status History Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Timeline & Notes</p>
                                    <span className="text-[10px] text-slate-400 font-mono">{(selectedReport.statusHistory || []).length} items</span>
                                </div>

                                <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                    {(!selectedReport.statusHistory || selectedReport.statusHistory.length === 0) && (
                                        <p className="text-xs text-slate-500 italic">No history available for this report.</p>
                                    )}
                                    {/* Reversing history to show latest first */}
                                    {selectedReport.statusHistory?.slice().reverse().map((entry, idx) => {
                                        const stColor = statusStyleMeta[entry.status]?.color || "text-teal-400";
                                        return (
                                            <div key={idx} className="p-4 border rounded-2xl space-y-2 relative transition-all bg-white/3 border-white/5">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[10px] font-bold ${stColor}`}>Status changed to {entry.status}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] text-slate-500 font-mono">{formatDate(entry.changedAt)}</span>
                                                    </div>
                                                </div>
                                                {entry.note && (
                                                    <p className="text-[11px] text-slate-300 leading-relaxed italic">Note: "{entry.note}"</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Community Interaction Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-6 sm:pt-8">
                                {/* Upvoters List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <span>Community Upvotes</span>
                                            <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono">
                                                {upvoters.length}
                                            </span>
                                        </h3>
                                    </div>

                                    {loadingUpvoters ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                                        </div>
                                    ) : upvoters.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic py-4">No community upvotes yet.</p>
                                    ) : (
                                        <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                            {upvoters.map((upvoter, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (upvoter.upvoterUser) {
                                                            setSelectedReporter(upvoter.upvoterUser);
                                                            setShowReporterModal(true);
                                                        }
                                                    }}
                                                    className="flex items-center justify-between bg-white/2 hover:bg-white/5 border border-white/5 hover:border-teal-500/20 p-2.5 rounded-xl cursor-pointer transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {upvoter.avatar ? (
                                                            <img src={upvoter.avatar} alt={upvoter.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-teal-400 text-xs font-bold font-mono border border-teal-500/10">
                                                                {getInitials(upvoter.name)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{upvoter.name}</p>
                                                            {upvoter.upvoterUser?.email && (
                                                                <p className="text-[10px] text-slate-500">{upvoter.upvoterUser.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 font-mono">
                                                        {upvoter.createdAt ? new Date(upvoter.createdAt.toDate ? upvoter.createdAt.toDate() : upvoter.createdAt).toLocaleDateString() : ""}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                            <span>Community Comments</span>
                                            <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono">
                                                {comments.length}
                                            </span>
                                        </h3>
                                    </div>

                                    {loadingComments ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic py-4">No comments posted yet.</p>
                                    ) : (
                                        <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                            {comments.map((comment) => (
                                                <div
                                                    key={comment.id}
                                                    className="bg-white/2 border border-white/5 p-3 rounded-xl space-y-2 text-left"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div
                                                            onClick={() => {
                                                                if (comment.commenterUser) {
                                                                    setSelectedReporter(comment.commenterUser);
                                                                    setShowReporterModal(true);
                                                                }
                                                            }}
                                                            className="flex items-center gap-2.5 cursor-pointer group"
                                                        >
                                                            {comment.commenterAvatar ? (
                                                                <img src={comment.commenterAvatar} alt={comment.commenterName} className="w-6.5 h-6.5 rounded-full object-cover border border-white/10" />
                                                            ) : (
                                                                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-teal-400 text-[10px] font-bold font-mono border border-teal-500/10">
                                                                    {getInitials(comment.commenterName)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{comment.commenterName}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 font-mono">
                                                            {comment.createdAt ? new Date(comment.createdAt.toDate ? comment.createdAt.toDate() : comment.createdAt).toLocaleString() : ""}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed pl-9">
                                                        {comment.body}
                                                    </p>
                                                    <div className="flex items-center gap-1 pl-9 text-[10px] text-slate-500 font-medium">
                                                        <span className="text-teal-500/80">👍</span>
                                                        <span>{comment.upvoteCount} upvotes</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-white/2 border-t border-white/5 flex justify-end flex-shrink-0">
                            {(selectedReport.status === "RESOLVED" || selectedReport.status === "REJECTED") && (
                                <button
                                    onClick={() => handleArchiveToggle(selectedReport)}
                                    className={`mr-3 px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${selectedReport.isArchived
                                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                            : "bg-white/5 border-white/10 text-slate-300 hover:text-amber-400 hover:bg-white/10 hover:border-amber-500/20"
                                        }`}
                                >
                                    {selectedReport.isArchived ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                            </svg>
                                            Restore from Archive
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                            Archive Report
                                        </>
                                    )}
                                </button>
                            )}
                            <button onClick={() => setSelectedReport(null)} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold rounded-xl transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Confirmation Modal */}
            {showArchiveConfirm && reportToArchive && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => setShowArchiveConfirm(false)}
                    />
                    <div className="relative w-full max-w-md bg-[#0f2233] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                ⚠️
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-base font-bold text-white">
                                    {reportToArchive.isArchived ? "Confirm Restore" : "Confirm Archive"}
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Are you sure you want to {reportToArchive.isArchived ? "restore" : "archive"} this report?
                                    {reportToArchive.isArchived
                                        ? " It will be returned to the active reports list."
                                        : " It will be soft-deleted and moved to the archive."}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={confirmArchiveToggle}
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                >
                                    {isSaving ? "Processing..." : "Yes, Proceed"}
                                </button>
                                <button
                                    onClick={() => setShowArchiveConfirm(false)}
                                    disabled={isSaving}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-white/10 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showReporterModal && selectedReporter && (
                <UserDetailsModal
                    user={selectedReporter}
                    onClose={() => setShowReporterModal(false)}
                />
            )}

            {/* Status Change Feedback Modal */}
            {statusChangeFeedback && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setStatusChangeFeedback(null)}
                    />
                    <div className="relative w-full max-w-md bg-[#0f2233]/95 border border-emerald-500/30 backdrop-blur-xl rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Close button top right */}
                        <button
                            onClick={() => setStatusChangeFeedback(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center space-y-5">
                            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-bounce">
                                ✓
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-white tracking-tight">Status Changed</h3>
                                <p className="text-xs text-slate-400">The report status has been successfully updated.</p>
                            </div>

                            {(() => {
                                const prevSt = statusStyleMeta[statusChangeFeedback.previousStatus] || { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" };
                                const newSt = statusStyleMeta[statusChangeFeedback.status] || { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" };
                                return (
                                    <div className="flex items-center justify-center gap-3 bg-white/3 border border-white/5 p-3 rounded-xl">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${prevSt.bg} ${prevSt.color}`}>
                                            {statusChangeFeedback.previousStatus}
                                        </span>
                                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${newSt.bg} ${newSt.color} ring-1 ring-emerald-500/30`}>
                                            {statusChangeFeedback.status}
                                        </span>
                                    </div>
                                );
                            })()}

                            <div className="space-y-2 bg-[#091622] border border-white/5 p-4 rounded-xl text-left text-xs">
                                <div className="flex justify-between border-b border-white/5 pb-1.5">
                                    <span className="text-slate-500 font-semibold">Incident ID</span>
                                    <span className="text-slate-300 font-mono font-bold">{selectedReport?.id}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 py-1.5">
                                    <span className="text-slate-500 font-semibold">Citizen / Reporter</span>
                                    <span className="text-slate-300 font-semibold">{selectedReport?.authorName || "Anonymous"}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 py-1.5">
                                    <span className="text-slate-500 font-semibold">In-app Alert</span>
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sent
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-500 font-semibold">Push Notification</span>
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sent
                                    </span>
                                </div>
                                {statusChangeFeedback.status === "RESOLVED" && (
                                    <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 text-[10px] text-emerald-300 font-bold bg-emerald-500/5 p-2 rounded-lg flex items-center gap-1.5">
                                        🎁 Reward: +10 Contribution Points awarded!
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex justify-center">
                                <button
                                    onClick={() => setStatusChangeFeedback(null)}
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
