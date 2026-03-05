"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Info,
  LifeBuoy,
  ListFilter,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMeQuery } from "@/hooks/use-auth";
import { useCreateTicketMutation, useTicketsQuery } from "@/hooks/use-tickets";
import type { TicketItem } from "@/services/tickets/ticket.types";
import { useCreateDashboardTicketMutation } from "@/services/dashboard-tickets/dashboard-ticket.hooks";

type TicketFormState = {
  subject: string;
  ticketType: string;
  description: string;
  contactEmail: string;
  contactNumber: string;
};

const DEFAULT_TICKET_TYPE = "Billing";

const initialForm: TicketFormState = {
  subject: "",
  ticketType: DEFAULT_TICKET_TYPE,
  description: "",
  contactEmail: "",
  contactNumber: "",
};

const TICKET_TYPES = ["Billing", "Technical", "Account", "General"] as const;
const SUPPORT_EMAIL = "support@mspktrading.com";
const SUPPORT_WHATSAPP = "917770039037";

function getStatusNode(status?: string) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "resolved") {
    return {
      icon: CheckCircle2,
      nodeClassName: "border-emerald-500/35 bg-emerald-500/15 text-emerald-500",
      label: "Closed",
      chipClassName: "bg-emerald-500 text-white",
    };
  }
  return {
    icon: Clock3,
    nodeClassName: "border-amber-500/35 bg-amber-500/15 text-amber-500",
    label: "In Progress",
    chipClassName: "bg-amber-500 text-slate-950",
  };
}

function getTicketTypeTone(ticketType?: string) {
  const normalized = (ticketType || "").toLowerCase();
  if (normalized.includes("billing")) {
    return "border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:border-cyan-300/35 dark:bg-cyan-300/12 dark:text-cyan-200";
  }
  if (normalized.includes("technical")) {
    return "border-violet-500/35 bg-violet-500/12 text-violet-700 dark:border-violet-300/35 dark:bg-violet-300/12 dark:text-violet-200";
  }
  if (normalized.includes("account")) {
    return "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-300/35 dark:bg-amber-300/12 dark:text-amber-200";
  }
  return "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:border-emerald-300/35 dark:bg-emerald-300/12 dark:text-emerald-200";
}

function formatAssignedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeTickets(data: TicketItem[] | undefined): TicketItem[] {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => {
    const left = new Date(b.createdAt).getTime();
    const right = new Date(a.createdAt).getTime();
    return left - right;
  });
}

export default function SupportPage() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [form, setForm] = useState<TicketFormState>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const meQuery = useMeQuery(true);
  const ticketsQuery = useTicketsQuery(true);
  const createTicketMutation = useCreateTicketMutation();
  const createDashboardTicketMutation = useCreateDashboardTicketMutation();

  const tickets = useMemo(
    () => normalizeTickets(ticketsQuery.data).filter((ticket) => ticket.status?.toLowerCase() !== "rejected"),
    [ticketsQuery.data]
  );

  const pendingCount = tickets.filter((ticket) => ticket.status?.toLowerCase() === "pending").length;
  const resolvedCount = tickets.filter((ticket) => ticket.status?.toLowerCase() === "resolved").length;
  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status?.toLowerCase() !== "resolved"),
    [tickets]
  );
  const closedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status?.toLowerCase() === "resolved"),
    [tickets]
  );
  const resolutionRate = tickets.length ? Math.round((resolvedCount / tickets.length) * 100) : 0;

  const updateField = (key: keyof TicketFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openTicketModal = () => {
    setFormError(null);
    setSubmitSuccess(null);
    setIsTicketModalOpen(true);
  };

  const closeTicketModal = () => {
    setIsTicketModalOpen(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    const resolvedEmail = (form.contactEmail || meQuery.data?.email || "").trim();
    const resolvedNumber = (form.contactNumber || meQuery.data?.phone || "").trim();

    if (!form.subject.trim() || !form.description.trim() || !resolvedEmail || !resolvedNumber) {
      setFormError("Please fill subject, description, email and contact number.");
      return;
    }

    try {
      await createTicketMutation.mutateAsync({
        subject: form.subject.trim(),
        ticketType: form.ticketType.trim() || DEFAULT_TICKET_TYPE,
        description: form.description.trim(),
        contactEmail: resolvedEmail,
        contactNumber: resolvedNumber,
      });
      await ticketsQuery.refetch();

      setSubmitSuccess("Ticket submitted successfully.");
      setForm((prev) => ({
        ...initialForm,
        contactEmail: prev.contactEmail,
        contactNumber: prev.contactNumber,
      }));
      closeTicketModal();
    } catch {
      setFormError("Unable to submit ticket. Please check data and try again.");
    }
  };

  const onSubmitDashboardTicket = async () => {
    setFormError(null);
    setSubmitSuccess(null);

    const resolvedEmail = (form.contactEmail || meQuery.data?.email || "").trim();
    const resolvedNumber = (form.contactNumber || meQuery.data?.phone || "").trim();

    if (!form.subject.trim() || !form.description.trim() || !resolvedEmail || !resolvedNumber) {
      setFormError("Please fill subject, description, email and contact number.");
      return;
    }

    try {
      await createDashboardTicketMutation.mutateAsync({
        subject: form.subject.trim(),
        ticketType: form.ticketType.trim() || DEFAULT_TICKET_TYPE,
        description: form.description.trim(),
        contactEmail: resolvedEmail,
        contactNumber: resolvedNumber,
      });
      await ticketsQuery.refetch();
      setSubmitSuccess("Dashboard ticket submitted successfully.");
      setForm((prev) => ({
        ...initialForm,
        contactEmail: prev.contactEmail,
        contactNumber: prev.contactNumber,
      }));
      closeTicketModal();
    } catch {
      setFormError("Unable to submit dashboard ticket. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-6 sm:space-y-8 py-2">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-300/70 bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.12),transparent_46%),linear-gradient(140deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] p-6 sm:p-8 dark:border-primary/20 dark:bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.2),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.16),transparent_46%),linear-gradient(140deg,rgba(2,6,23,0.92),rgba(15,23,42,0.82))]">
        <div className="pointer-events-none absolute -top-28 -right-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-45 bg-[linear-gradient(120deg,transparent_36%,rgba(255,255,255,0.45)_52%,transparent_68%)] dark:bg-[linear-gradient(120deg,transparent_36%,rgba(255,255,255,0.07)_52%,transparent_68%)]" />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              MSPK Support Command
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground sm:text-3xl">
                Premium Ticket Support Desk
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                Raise issue with full context, track ticket lifecycle, and stay updated with a cleaner and faster
                support workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={openTicketModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(14,165,233,0.9)]"
              >
                <Send className="h-4 w-4" />
                Raise New Ticket
              </button>
              <div className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300/70 bg-white/65 px-4 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-300">
                <LifeBuoy className="h-4 w-4 text-emerald-500" />
                Fast support with clear details
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-1">
              <div className="rounded-xl border border-slate-300/70 bg-white/65 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-300">
                <div className="inline-flex items-center gap-1.5">
                  <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                  Support Email
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {SUPPORT_EMAIL}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/12 p-4">
              <Clock3 className="h-4 w-4 text-amber-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-100/70">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/12 p-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-100/70">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{resolvedCount}</p>
            </div>
            <div className="rounded-2xl border border-primary/35 bg-primary/12 p-4">
              <Ticket className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-primary/80">Total Tickets</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{tickets.length}</p>
            </div>
            <div className="rounded-2xl border border-cyan-500/35 bg-cyan-500/12 p-4">
              <MessageSquare className="h-4 w-4 text-cyan-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cyan-700/80 dark:text-cyan-100/70">Resolution Rate</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{resolutionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {submitSuccess ? (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-100">
          {submitSuccess}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[1.7rem] border border-slate-300/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.94),rgba(248,250,252,0.88))] p-5 sm:p-6 dark:border-primary/20 dark:bg-[linear-gradient(165deg,rgba(2,6,23,0.94),rgba(15,23,42,0.85))]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-foreground sm:text-lg">Support Mission Board</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                New dual-lane layout with open queue and closed archive tracking.
              </p>
            </div>
            {ticketsQuery.isFetching ? <Loader2 size={16} className="animate-spin text-primary" /> : null}
          </div>

          {ticketsQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300/70 dark:border-slate-700 py-14 text-center text-sm text-slate-600 dark:text-slate-400">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300/70 dark:border-slate-700 py-14 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">No tickets found.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { title: "Open Queue", count: openTickets.length, tickets: openTickets, laneTone: "border-amber-500/30 bg-amber-500/8" },
                { title: "Closed Archive", count: closedTickets.length, tickets: closedTickets, laneTone: "border-emerald-500/30 bg-emerald-500/8" },
              ].map((lane) => (
                <div key={lane.title} className={`rounded-2xl border p-3 sm:p-4 ${lane.laneTone}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">{lane.title}</h3>
                    <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {lane.count}
                    </span>
                  </div>

                  {lane.tickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-3 py-8 text-center text-xs text-muted-foreground">
                      No tickets in this lane.
                    </div>
                  ) : (
                    <div className="max-h-[56vh] space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
                      {lane.tickets.map((ticket) => {
                        const chip = getStatusNode(ticket.status);
                        const typeTone = getTicketTypeTone(ticket.ticketType);

                        return (
                          <article
                            key={ticket._id}
                            className="group rounded-xl border border-border/70 bg-card/92 p-3 text-card-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_34px_-26px_rgba(14,165,233,0.65)]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="line-clamp-1 text-sm font-semibold">{ticket.subject || "Ticket"}</h4>
                              <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chip.chipClassName}`}>
                                {chip.label}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex rounded-full border border-border/75 bg-background/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {ticket.ticketId}
                              </span>
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeTone}`}>
                                {ticket.ticketType || DEFAULT_TICKET_TYPE}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{ticket.description || "No description provided."}</p>

                            <div className="mt-2.5 grid gap-1.5">
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
                                <Mail className="h-3 w-3 text-primary" />
                                <span className="truncate">{ticket.contactEmail || "-"}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">
                                <Info className="h-3 w-3 text-primary" />
                                Assigned {formatAssignedDate(ticket.createdAt)}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-300/70 bg-white/80 p-5 dark:border-primary/20 dark:bg-slate-900/70">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              Support Channel
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="inline-flex w-full items-center gap-2 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-slate-100/75 dark:bg-slate-800/65 px-3 py-2 text-slate-700 dark:text-slate-300">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{SUPPORT_EMAIL}</span>
              </div>
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=Hello%20MSPK%20Support%2C%20I%20am%20contacting%20you%20from%20the%20Support%20page%20regarding%20an%20issue%20with%20my%20account%20or%20plan.%20Please%20assist%20me%20with%20the%20next%20steps.%20Thank%20you.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center gap-3 rounded-xl border border-emerald-400/70 bg-[linear-gradient(120deg,rgba(16,185,129,0.18),rgba(34,197,94,0.08))] px-3 py-2 text-emerald-800 shadow-[0_12px_24px_-18px_rgba(16,185,129,0.7)] transition hover:-translate-y-0.5 hover:border-emerald-500/80 hover:bg-[linear-gradient(120deg,rgba(16,185,129,0.24),rgba(34,197,94,0.12))] hover:text-emerald-900 dark:border-emerald-400/60 dark:bg-[linear-gradient(120deg,rgba(16,185,129,0.16),rgba(34,197,94,0.08))] dark:text-emerald-100"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-200" />
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-100/80">
                    WhatsApp Support
                  </span>
                  <span className="text-sm font-semibold">Connect on +{SUPPORT_WHATSAPP}</span>
                </span>
              </a>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-200/80">
                Clicking WhatsApp opens a prefilled professional message to help our team understand the reason for your request.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                For critical tickets, submit complete details from the Raise Ticket form.
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-300/70 bg-white/80 p-5 dark:border-primary/20 dark:bg-slate-900/70">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              Response Guide
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-200">
                Open queue tickets are prioritized by issue severity and clarity.
              </div>
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-700 dark:text-cyan-200">
                Include reproducible steps and expected output for faster resolution.
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-200">
                Closed archive stores resolved tickets for quick follow-up reference.
              </div>
            </div>
          </div>
        </aside>
      </section>

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="z-[70] w-[min(760px,calc(100%-1rem))] max-h-[92vh] max-w-[min(760px,calc(100%-1rem))] overflow-y-auto rounded-2xl border-border/80 bg-background p-0 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] custom-scrollbar md:max-h-none md:overflow-visible">
          <div className="relative">
            <div className="pointer-events-none absolute -top-24 -right-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-emerald-500/12 blur-3xl" />
            <div className="relative z-10 bg-background/96 p-5 sm:p-6">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Ticket className="h-4 w-4 text-primary" />
                  Create New Ticket
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Provide clear context and contact details so support can resolve faster.
                </DialogDescription>
              </DialogHeader>

              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-primary" />
                    Subject
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-xl border border-border/70 bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    value={form.subject}
                    onChange={(event) => updateField("subject", event.target.value)}
                    placeholder="Payment deducted but plan not active"
                    maxLength={120}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70">
                    <span className="inline-flex items-center gap-1.5">
                      <ListFilter className="h-3.5 w-3.5 text-primary" />
                      Ticket Type
                    </span>
                    <select
                      className="mt-2 h-11 w-full rounded-xl border border-border/70 bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      value={form.ticketType}
                      onChange={(event) => updateField("ticketType", event.target.value)}
                    >
                      {TICKET_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      Contact Number
                    </span>
                    <div className="relative mt-2">
                      <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        className="h-11 w-full rounded-xl border border-border/70 bg-background/55 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                        value={form.contactNumber || meQuery.data?.phone || ""}
                        onChange={(event) => updateField("contactNumber", event.target.value)}
                        placeholder="9876543210"
                        inputMode="tel"
                      />
                    </div>
                  </label>
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Contact Email
                  </span>
                  <div className="relative mt-2">
                    <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className="h-11 w-full rounded-xl border border-border/70 bg-background/55 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      value={form.contactEmail || meQuery.data?.email || ""}
                      onChange={(event) => updateField("contactEmail", event.target.value)}
                      placeholder="user@test.com"
                      type="email"
                    />
                  </div>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Description
                  </span>
                  <textarea
                    className="mt-2 min-h-32 w-full resize-y rounded-xl border border-border/70 bg-background/55 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Describe issue steps, expected output, and what happened instead."
                    maxLength={1000}
                  />
                </label>

                {formError ? (
                  <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-100">
                    {formError}
                  </div>
                ) : null}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createTicketMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Ticket
                  </button>

                  <button
                    type="button"
                    onClick={onSubmitDashboardTicket}
                    disabled={createDashboardTicketMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/55 px-4 text-sm font-semibold text-foreground transition hover:border-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createDashboardTicketMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Dashboard
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border/70 bg-background/45 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
