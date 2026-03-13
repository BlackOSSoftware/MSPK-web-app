"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEconomicCalendarQuery } from "@/services/economic-calendar/economic-calendar.hooks";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Gauge,
  Globe2,
  Rows3,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const LIMIT_OPTIONS = [10, 20] as const;
type LimitOption = (typeof LIMIT_OPTIONS)[number];
type ImpactOption = "all" | "important" | "high" | "medium" | "low";
type RangePreset = "today" | "thisWeek" | "next7Days" | "thisMonth" | "custom";

const formatDateInput = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRangeValues = (preset: RangePreset) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "thisWeek") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(now.getDate() + mondayOffset);
    end.setDate(start.getDate() + 6);
  } else if (preset === "next7Days") {
    end.setDate(now.getDate() + 6);
  } else if (preset === "thisMonth") {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  }

  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
  };
};

const DEFAULT_RANGE_PRESET: RangePreset = "thisWeek";
const INITIAL_FILTERS = getRangeValues(DEFAULT_RANGE_PRESET);

const RANGE_PRESETS: Array<{ id: Exclude<RangePreset, "custom">; label: string }> = [
  { id: "today", label: "Today" },
  { id: "thisWeek", label: "This Week" },
  { id: "next7Days", label: "Next 7 Days" },
  { id: "thisMonth", label: "This Month" },
];

function formatDateParts(value?: string) {
  if (!value) return { dateLabel: "-", timeLabel: "-" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dateLabel: value, timeLabel: "-" };

  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return { dateLabel, timeLabel };
}

function impactMeta(impact?: string) {
  const normalized = String(impact || "").toLowerCase();
  if (normalized === "high") {
    return {
      label: "High",
      tone: "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:border-rose-300/35 dark:bg-rose-300/12 dark:text-rose-200",
      dot: "bg-rose-500 dark:bg-rose-300",
      rowHover:
        "hover:[filter:drop-shadow(0_16px_24px_rgba(244,63,94,0.24))] dark:hover:[filter:drop-shadow(0_14px_22px_rgba(251,113,133,0.18))]",
      cellHover: "group-hover/row:bg-rose-500/[0.07] dark:group-hover/row:bg-rose-400/[0.10]",
      valueHover: "group-hover/row:text-rose-700 dark:group-hover/row:text-rose-200",
      shimmer:
        "bg-[linear-gradient(110deg,transparent,rgba(244,63,94,0.32),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(251,113,133,0.35),transparent)]",
      badgeHover: "group-hover/row:scale-105 group-hover/row:animate-pulse",
    };
  }
  if (normalized === "medium") {
    return {
      label: "Medium",
      tone: "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-300/35 dark:bg-amber-300/12 dark:text-amber-200",
      dot: "bg-amber-500 dark:bg-amber-300",
      rowHover:
        "hover:[filter:drop-shadow(0_16px_24px_rgba(245,158,11,0.26))] dark:hover:[filter:drop-shadow(0_14px_22px_rgba(251,191,36,0.20))]",
      cellHover: "group-hover/row:bg-amber-500/[0.07] dark:group-hover/row:bg-amber-300/[0.10]",
      valueHover: "group-hover/row:text-amber-700 dark:group-hover/row:text-amber-200",
      shimmer:
        "bg-[linear-gradient(110deg,transparent,rgba(245,158,11,0.34),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(251,191,36,0.35),transparent)]",
      badgeHover:
        "group-hover/row:-translate-y-0.5 group-hover/row:shadow-[0_12px_20px_-14px_rgba(245,158,11,0.95)]",
    };
  }
  return {
    label: "Low",
    tone: "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-300/12 dark:text-emerald-200",
    dot: "bg-emerald-500 dark:bg-emerald-300",
    rowHover:
      "hover:[filter:drop-shadow(0_16px_24px_rgba(16,185,129,0.24))] dark:hover:[filter:drop-shadow(0_14px_22px_rgba(52,211,153,0.20))]",
    cellHover: "group-hover/row:bg-emerald-500/[0.07] dark:group-hover/row:bg-emerald-300/[0.10]",
    valueHover: "group-hover/row:text-emerald-700 dark:group-hover/row:text-emerald-200",
    shimmer:
      "bg-[linear-gradient(110deg,transparent,rgba(16,185,129,0.32),transparent)] dark:bg-[linear-gradient(110deg,transparent,rgba(52,211,153,0.35),transparent)]",
    badgeHover: "group-hover/row:scale-[1.04] group-hover/row:shadow-[0_12px_20px_-14px_rgba(16,185,129,0.95)]",
  };
}

export default function EconomicCalendarPage() {
  const [draftFrom, setDraftFrom] = useState(INITIAL_FILTERS.from);
  const [draftTo, setDraftTo] = useState(INITIAL_FILTERS.to);
  const [draftImpact, setDraftImpact] = useState<ImpactOption>("all");
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [appliedImpact, setAppliedImpact] = useState<ImpactOption>("all");
  const [selectedPreset, setSelectedPreset] = useState<RangePreset>(DEFAULT_RANGE_PRESET);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<LimitOption>(20);

  const dateRangeInvalid = useMemo(() => {
    if (!draftFrom || !draftTo) return false;
    return new Date(draftFrom).getTime() > new Date(draftTo).getTime();
  }, [draftFrom, draftTo]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
      ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
      ...(appliedImpact !== "all" ? { impact: appliedImpact } : {}),
    }),
    [page, limit, appliedFilters.from, appliedFilters.to, appliedImpact],
  );

  const { data, isLoading, isFetching, error } = useEconomicCalendarQuery(queryParams);

  const events = data?.results ?? [];
  const pagination = data?.pagination;
  const currentPage = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalResults = pagination?.totalResults ?? events.length;
  const hasPrevPage = pagination?.hasPrevPage ?? currentPage > 1;
  const hasNextPage = pagination?.hasNextPage ?? currentPage < totalPages;
  const pageStart = totalResults === 0 ? 0 : (currentPage - 1) * limit + 1;
  const pageEnd = Math.min(currentPage * limit, totalResults);

  const paginationItems = useMemo(() => {
    const points = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = Array.from(points).filter((item) => item >= 1 && item <= totalPages).sort((a, b) => a - b);
    const items: Array<number | "gap"> = [];

    sorted.forEach((value, index) => {
      const prev = sorted[index - 1];
      if (index > 0 && prev && value - prev > 1) {
        items.push("gap");
      }
      items.push(value);
    });

    return items;
  }, [currentPage, totalPages]);

  const appliedRangeLabel = useMemo(() => {
    if (!appliedFilters.from && !appliedFilters.to) return "Flexible Range";
    if (appliedFilters.from === appliedFilters.to) return appliedFilters.from;
    return `${appliedFilters.from} to ${appliedFilters.to}`;
  }, [appliedFilters.from, appliedFilters.to]);

  const applyPreset = (preset: Exclude<RangePreset, "custom">) => {
    const nextRange = getRangeValues(preset);
    setSelectedPreset(preset);
    setDraftFrom(nextRange.from);
    setDraftTo(nextRange.to);
    setAppliedFilters(nextRange);
    setPage(1);
  };

  const applyFilters = () => {
    if (dateRangeInvalid) return;
    setAppliedFilters({ from: draftFrom, to: draftTo });
    setAppliedImpact(draftImpact);
    setSelectedPreset("custom");
    setPage(1);
  };

  const resetFilters = () => {
    const resetRange = getRangeValues(DEFAULT_RANGE_PRESET);
    setDraftFrom(resetRange.from);
    setDraftTo(resetRange.to);
    setDraftImpact("all");
    setAppliedFilters(resetRange);
    setAppliedImpact("all");
    setSelectedPreset(DEFAULT_RANGE_PRESET);
    setPage(1);
  };

  const changeLimit = (value: string) => {
    const nextLimit: LimitOption = value === "20" ? 20 : 10;
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <div className="flex-1 space-y-6 py-2">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-300/60 dark:border-primary/20 bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.18),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))] dark:bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.2),transparent_40%),linear-gradient(135deg,rgba(2,6,23,0.92),rgba(15,23,42,0.85))] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-55 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.52)_50%,transparent_65%)] dark:bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.08)_50%,transparent_65%)]" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            MSPK Macro Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-foreground">
            Global Economic Events Hub
          </h2>
          <p className="max-w-3xl text-sm sm:text-base text-slate-700 dark:text-slate-300">
            Institutional-style table view for macro releases with clear timeline, country, impact tier, and
            Actual-Forecast-Previous numbers in one fast decision screen.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-700 dark:text-sky-200">
              <Rows3 className="h-3.5 w-3.5" />
              Live Table View
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
              <Gauge className="h-3.5 w-3.5" />
              Smart Pagination
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-200">
              <CalendarClock className="h-3.5 w-3.5" />
              Date + Impact Filters
            </span>
          </div>
        </div>
      </section>

      <Card className="rounded-[1.5rem] border border-slate-300/60 dark:border-primary/20 bg-white/70 dark:bg-slate-950/45">
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  selectedPreset === preset.id
                    ? "bg-primary text-primary-foreground shadow-[0_10px_25px_-16px_rgba(14,165,233,0.95)]"
                    : "border border-slate-300/70 bg-white/80 text-slate-700 hover:border-primary/35 hover:text-primary dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_170px_170px_auto_auto]">
            <input
              type="date"
              value={draftFrom}
              onChange={(event) => {
                setSelectedPreset("custom");
                setDraftFrom(event.target.value);
              }}
              className="h-11 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-background/75 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <input
              type="date"
              value={draftTo}
              onChange={(event) => {
                setSelectedPreset("custom");
                setDraftTo(event.target.value);
              }}
              className="h-11 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-background/75 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            <select
              value={String(limit)}
              onChange={(event) => changeLimit(event.target.value)}
              className="h-11 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-background/75 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
            <select
              value={draftImpact}
              onChange={(event) => setDraftImpact(event.target.value as ImpactOption)}
              className="h-11 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-background/75 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <option value="all">All Impact</option>
              <option value="important">Important</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <Button className="h-11 rounded-xl gap-2" onClick={applyFilters} disabled={dateRangeInvalid}>
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            <Button variant="outline" className="h-11 rounded-xl gap-2" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
          {dateRangeInvalid ? (
            <p className="mt-3 text-xs text-rose-500">From date must be before or equal to To date.</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Total Events: {totalResults.toLocaleString("en-IN")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-700 dark:text-sky-200">
              Range: {appliedRangeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/70 dark:border-slate-700 px-2.5 py-1">
              Impact: {appliedImpact.charAt(0).toUpperCase() + appliedImpact.slice(1)}
            </span>
            <span>
              Showing {pageStart.toLocaleString("en-IN")} - {pageEnd.toLocaleString("en-IN")} | Page {currentPage} of{" "}
              {totalPages}
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="overflow-hidden rounded-[1.7rem] border border-slate-300/65 dark:border-primary/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(248,250,252,0.8))] dark:bg-[linear-gradient(160deg,rgba(2,6,23,0.9),rgba(15,23,42,0.82))]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-300/65 dark:border-primary/20 px-4 py-3 sm:px-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-primary">
            <Rows3 className="h-3.5 w-3.5" />
            Calendar Ledger
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 dark:border-slate-600/70 bg-white/80 dark:bg-slate-900/70 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-700 dark:text-slate-200">
            <Globe2 className="h-3.5 w-3.5" />
            {limit} Rows / Page
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-100/90 dark:bg-slate-900/80">
              <tr className="border-b border-slate-300/65 dark:border-primary/20">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">#</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Event</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Country</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Date / Time</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Impact</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Actual</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Forecast</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">Previous</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 dark:divide-primary/15">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading events...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-rose-500">
                    {error instanceof Error ? error.message : "Failed to load events."}
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No events found in this range. Try `This Week`, `Next 7 Days`, or reset filters.
                  </td>
                </tr>
              ) : (
                events.map((event, index) => {
                  const position = (currentPage - 1) * limit + index + 1;
                  const impact = impactMeta(event.impact);
                  const { dateLabel, timeLabel } = formatDateParts(event.date);

                  return (
                    <tr
                      key={event._id || event.eventId || `${event.event || "event"}-${index}`}
                      className={`group/row isolate bg-transparent transition-all duration-300 ${impact.rowHover}`}
                    >
                      <td
                        className={`relative px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all duration-300 ${impact.cellHover} ${impact.valueHover}`}
                      >
                        <span
                          className={`pointer-events-none absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 transition-opacity duration-300 group-hover/row:opacity-100 ${impact.dot}`}
                        />
                        {position}
                      </td>
                      <td className={`px-4 py-3 transition-colors duration-300 ${impact.cellHover}`}>
                        <div className="relative overflow-hidden rounded-lg px-2 py-1">
                          <span
                            className={`pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[180%] opacity-0 transition-all duration-700 group-hover/row:translate-x-[380%] group-hover/row:opacity-100 ${impact.shimmer}`}
                          />
                          <div className={`font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-300 ${impact.valueHover}`}>
                            {event.event || "-"}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{event.currency || "-"} macro release</div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 transition-colors duration-300 ${impact.cellHover}`}>
                        <div className={`text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors duration-300 ${impact.valueHover}`}>
                          {event.country || "Global"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{event.currency || "-"}</div>
                      </td>
                      <td className={`px-4 py-3 transition-colors duration-300 ${impact.cellHover}`}>
                        <div className={`text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors duration-300 ${impact.valueHover}`}>
                          {dateLabel}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{timeLabel}</div>
                      </td>
                      <td className={`px-4 py-3 transition-colors duration-300 ${impact.cellHover}`}>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-300 ${impact.tone} ${impact.badgeHover}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${impact.dot}`} />
                          {impact.label}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200 transition-all duration-300 ${impact.cellHover} ${impact.valueHover}`}
                      >
                        {event.actual ?? "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200 transition-all duration-300 ${impact.cellHover} ${impact.valueHover}`}
                      >
                        {event.forecast ?? "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200 transition-all duration-300 ${impact.cellHover} ${impact.valueHover}`}
                      >
                        {event.previous ?? "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300/65 dark:border-primary/20 px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrevPage || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {paginationItems.map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-2 text-xs text-muted-foreground">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  disabled={isFetching}
                  className={`h-9 min-w-9 rounded-lg border px-3 text-xs font-semibold transition ${
                    item === currentPage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-slate-300/70 dark:border-slate-700 bg-background/80 text-foreground hover:border-primary/40"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNextPage || isFetching}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
