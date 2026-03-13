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


  return (
    <div className="flex-1 space-y-6 sm:space-y-8 py-2">
      <section className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.14),transparent_46%),linear-gradient(140deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-6 shadow-[0_26px_70px_-34px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/70 sm:p-8 dark:bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.2),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.16),transparent_46%),linear-gradient(140deg,rgba(2,6,23,0.92),rgba(15,23,42,0.82))] dark:ring-white/10">
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-5 text-sm font-semibold text-white shadow-[0_18px_38px_-20px_rgba(14,165,233,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(14,165,233,0.95)]"
              >
                <Send className="h-4 w-4" />
                Raise New Ticket
              </button>
              <div className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white/70 px-4 text-xs font-semibold uppercase tracking-wider text-slate-700 shadow-[0_16px_35px_-24px_rgba(15,23,42,0.25)] ring-1 ring-slate-200/70 dark:bg-slate-900/65 dark:text-slate-300 dark:ring-white/10">
                <LifeBuoy className="h-4 w-4 text-emerald-500" />
                Fast support with clear details
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-1">
              <div className="rounded-2xl bg-white/72 px-4 py-3 text-xs text-slate-700 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70 dark:bg-slate-900/65 dark:text-slate-300 dark:ring-white/10">
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
            <div className="rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(255,251,235,0.95),rgba(254,243,199,0.82))] p-4 shadow-[0_22px_42px_-28px_rgba(245,158,11,0.45)] ring-1 ring-amber-200/80 dark:bg-[linear-gradient(145deg,rgba(61,34,8,0.72),rgba(92,56,10,0.56))] dark:ring-amber-400/10">
              <Clock3 className="h-4 w-4 text-amber-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-amber-700/80 dark:text-amber-100/70">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{pendingCount}</p>
            </div>
            <div className="rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(236,253,245,0.96),rgba(209,250,229,0.82))] p-4 shadow-[0_22px_42px_-28px_rgba(16,185,129,0.42)] ring-1 ring-emerald-200/80 dark:bg-[linear-gradient(145deg,rgba(7,54,39,0.72),rgba(11,81,59,0.56))] dark:ring-emerald-400/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-emerald-700/80 dark:text-emerald-100/70">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{resolvedCount}</p>
            </div>
            <div className="rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(239,246,255,0.96),rgba(219,234,254,0.84))] p-4 shadow-[0_22px_42px_-28px_rgba(37,99,235,0.4)] ring-1 ring-sky-200/80 dark:bg-[linear-gradient(145deg,rgba(10,37,77,0.72),rgba(18,57,110,0.58))] dark:ring-sky-400/10">
              <Ticket className="h-4 w-4 text-primary" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-primary/80">Total Tickets</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{tickets.length}</p>
            </div>
            <div className="rounded-[1.6rem] bg-[linear-gradient(145deg,rgba(236,254,255,0.96),rgba(207,250,254,0.84))] p-4 shadow-[0_22px_42px_-28px_rgba(8,145,178,0.38)] ring-1 ring-cyan-200/80 dark:bg-[linear-gradient(145deg,rgba(7,47,58,0.72),rgba(9,73,92,0.58))] dark:ring-cyan-400/10">
              <MessageSquare className="h-4 w-4 text-cyan-500" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-cyan-700/80 dark:text-cyan-100/70">Resolution Rate</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{resolutionRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {submitSuccess ? (
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 shadow-[0_20px_40px_-28px_rgba(16,185,129,0.7)] ring-1 ring-emerald-400/35 dark:text-emerald-100">
          {submitSuccess}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[1.8rem] bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] p-5 shadow-[0_30px_70px_-38px_rgba(15,23,42,0.3)] ring-1 ring-slate-200/75 sm:p-6 dark:bg-[linear-gradient(165deg,rgba(2,6,23,0.94),rgba(15,23,42,0.85))] dark:ring-white/10">
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
            <div className="rounded-[1.5rem] bg-slate-100/80 py-14 text-center text-sm text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900/70 dark:text-slate-400 dark:ring-white/10">
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-[1.5rem] bg-slate-100/80 py-14 text-center ring-1 ring-slate-200/80 dark:bg-slate-900/70 dark:ring-white/10">
              <p className="text-sm text-slate-600 dark:text-slate-400">No tickets found.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {[
                { title: "Open Queue", count: openTickets.length, tickets: openTickets, laneTone: "bg-[linear-gradient(180deg,rgba(255,251,235,0.8),rgba(255,255,255,0.58))] ring-1 ring-amber-200/80 dark:bg-[linear-gradient(180deg,rgba(71,42,9,0.42),rgba(15,23,42,0.32))] dark:ring-amber-400/10" },
                { title: "Closed Archive", count: closedTickets.length, tickets: closedTickets, laneTone: "bg-[linear-gradient(180deg,rgba(236,253,245,0.78),rgba(255,255,255,0.58))] ring-1 ring-emerald-200/80 dark:bg-[linear-gradient(180deg,rgba(7,54,39,0.42),rgba(15,23,42,0.32))] dark:ring-emerald-400/10" },
              ].map((lane) => (
                <div key={lane.title} className={`rounded-[1.6rem] p-3 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.22)] sm:p-4 ${lane.laneTone}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-300">{lane.title}</h3>
                    <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:ring-white/10">
                      {lane.count}
                    </span>
                  </div>

                  {lane.tickets.length === 0 ? (
                    <div className="rounded-2xl bg-white/65 px-3 py-8 text-center text-xs text-muted-foreground ring-1 ring-slate-200/70 dark:bg-slate-950/55 dark:ring-white/10">
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
                            className="group rounded-[1.35rem] bg-white/85 p-3 text-card-foreground shadow-[0_20px_38px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/65 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-28px_rgba(14,165,233,0.28)] dark:bg-slate-950/75 dark:ring-white/10"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="line-clamp-1 text-sm font-semibold">{ticket.subject || "Ticket"}</h4>
                              <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chip.chipClassName}`}>
                                {chip.label}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex rounded-full bg-slate-100/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-slate-200/80 dark:bg-slate-900/80 dark:ring-white/10">
                                {ticket.ticketId}
                              </span>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ${typeTone.replace("border-", "ring-").replace("bg-", "bg-")}`}>
                                {ticket.ticketType || DEFAULT_TICKET_TYPE}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{ticket.description || "No description provided."}</p>

                            <div className="mt-2.5 grid gap-1.5">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1.5 text-[10px] text-muted-foreground ring-1 ring-slate-200/75 dark:bg-slate-900/75 dark:ring-white/10">
                                <Mail className="h-3 w-3 text-primary" />
                                <span className="truncate">{ticket.contactEmail || "-"}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1.5 text-[10px] text-muted-foreground ring-1 ring-slate-200/75 dark:bg-slate-900/75 dark:ring-white/10">
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
          <div className="rounded-[1.6rem] bg-white/88 p-5 shadow-[0_24px_56px_-34px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/75 dark:bg-slate-900/72 dark:ring-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              Support Channel
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="inline-flex w-full items-center gap-2 rounded-2xl bg-slate-100/85 px-3 py-3 text-slate-700 ring-1 ring-slate-200/75 dark:bg-slate-800/65 dark:text-slate-300 dark:ring-white/10">
                <LifeBuoy className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{SUPPORT_EMAIL}</span>
              </div>
              <a
                href={`https://wa.me/${SUPPORT_WHATSAPP}?text=Hello%20MSPK%20Support%2C%20I%20am%20contacting%20you%20from%20the%20Support%20page%20regarding%20an%20issue%20with%20my%20account%20or%20plan.%20Please%20assist%20me%20with%20the%20next%20steps.%20Thank%20you.`}
                target="_blank"
                rel="noopener noreferrer"
                data-no-leave-confirm="true"
                className="inline-flex w-full items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(120deg,rgba(16,185,129,0.18),rgba(34,197,94,0.08))] px-3 py-3 text-emerald-800 shadow-[0_18px_34px_-22px_rgba(16,185,129,0.6)] ring-1 ring-emerald-300/70 transition hover:-translate-y-0.5 hover:bg-[linear-gradient(120deg,rgba(16,185,129,0.24),rgba(34,197,94,0.12))] hover:text-emerald-900 dark:bg-[linear-gradient(120deg,rgba(16,185,129,0.16),rgba(34,197,94,0.08))] dark:text-emerald-100 dark:ring-emerald-400/25"
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

          <div className="rounded-[1.6rem] bg-white/88 p-5 shadow-[0_24px_56px_-34px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/75 dark:bg-slate-900/72 dark:ring-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              Response Guide
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="rounded-2xl bg-amber-500/12 px-3 py-3 text-amber-700 ring-1 ring-amber-300/35 dark:text-amber-200">
                Open queue tickets are prioritized by issue severity and clarity.
              </div>
              <div className="rounded-2xl bg-cyan-500/12 px-3 py-3 text-cyan-700 ring-1 ring-cyan-300/35 dark:text-cyan-200">
                Include reproducible steps and expected output for faster resolution.
              </div>
              <div className="rounded-2xl bg-emerald-500/12 px-3 py-3 text-emerald-700 ring-1 ring-emerald-300/35 dark:text-emerald-200">
                Closed archive stores resolved tickets for quick follow-up reference.
              </div>
            </div>
          </div>
        </aside>
      </section>

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="z-[70] w-[min(760px,calc(100%-1rem))] max-h-[92vh] max-w-[min(760px,calc(100%-1rem))] overflow-y-auto rounded-[1.8rem] border-0 bg-background p-0 shadow-[0_34px_90px_-34px_rgba(0,0,0,0.58)] ring-1 ring-slate-200/70 custom-scrollbar dark:ring-white/10 md:max-h-none md:overflow-visible">
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
                    className="mt-2 h-11 w-full rounded-2xl bg-background/60 px-4 text-sm text-foreground outline-none ring-1 ring-border/55 transition focus:ring-2 focus:ring-primary/20"
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
                      className="mt-2 h-11 w-full rounded-2xl bg-background/60 px-4 text-sm text-foreground outline-none ring-1 ring-border/55 transition focus:ring-2 focus:ring-primary/20"
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
                        className="h-11 w-full rounded-2xl bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-1 ring-border/55 transition focus:ring-2 focus:ring-primary/20 read-only:cursor-not-allowed read-only:text-muted-foreground"
                        value={meQuery.data?.phone || ""}
                        readOnly
                        placeholder="Phone not available"
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
                      className="h-11 w-full rounded-2xl bg-background/60 py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-1 ring-border/55 transition focus:ring-2 focus:ring-primary/20 read-only:cursor-not-allowed read-only:text-muted-foreground"
                      value={meQuery.data?.email || ""}
                      readOnly
                      placeholder="Email not available"
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
                    className="mt-2 min-h-32 w-full resize-y rounded-[1.35rem] bg-background/60 px-4 py-3 text-sm text-foreground outline-none ring-1 ring-border/55 transition focus:ring-2 focus:ring-primary/20"
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    placeholder="Describe issue steps, expected output, and what happened instead."
                    maxLength={1000}
                  />
                </label>

                {formError ? (
                  <div className="rounded-2xl bg-rose-500/10 px-3 py-3 text-xs text-rose-700 ring-1 ring-rose-400/35 dark:text-rose-100">
                    {formError}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createTicketMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Submit Ticket
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-background/50 text-sm font-semibold text-muted-foreground ring-1 ring-border/55 transition hover:text-foreground"
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
