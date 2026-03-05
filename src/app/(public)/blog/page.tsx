"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Tag, ArrowUpRight } from "lucide-react";
import { useBlogsQuery } from "@/services/blogs/blog.hooks";

const resolveMedia = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, "");
  return apiBase ? `${apiBase}/${path.replace(/^\/+/, "")}` : path;
};

const formatDate = (value?: string) => {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BlogPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isFetching } = useBlogsQuery({ status: "published", page, limit });

  const blogs = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;

  const featured = useMemo(() => blogs[0], [blogs]);
  const gridItems = useMemo(() => blogs.slice(1), [blogs]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pt-24 pb-10">
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Insights</p>
            <h1 className="text-4xl sm:text-5xl font-bold">Market Perspectives & Strategy Notes</h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
              Curated updates from the MSPK research desk. Fresh releases, trading insights, and market context in one stream.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        {featured ? (
          <Link href={`/blog/${featured.slug}`} className="group block rounded-[28px] border border-border/60 bg-card/70 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.15)] mb-10">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative min-h-[240px] lg:min-h-[360px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent z-10" />
                {resolveMedia(featured.heroImage) ? (
                  <img
                    src={resolveMedia(featured.heroImage)}
                    alt={featured.title}
                    className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500" />
                )}
              </div>
              <div className="p-6 lg:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary">
                    Featured
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.publishedAt || featured.createdAt)}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">{featured.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {featured.meta?.description || featured.content?.slice(0, 220)}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {featured.categories?.slice(0, 3).map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-3 py-1">
                      <Tag className="h-3 w-3" />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-border/40 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_55%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.08),transparent_45%)]" />
          <div className="pointer-events-none absolute -inset-x-6 top-8 h-24 bg-[linear-gradient(to_right,transparent,rgba(14,165,233,0.12),transparent)] blur-2xl" />

          <div className="relative grid grid-cols-1 min-[360px]:grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-6 lg:grid-flow-dense">
          {gridItems.length === 0 && !featured ? (
            <div className="rounded-3xl border border-border/60 bg-card/70 p-8 text-sm text-muted-foreground">
              No blogs available yet.
            </div>
          ) : (
            gridItems.map((blog, index) => {
              const pattern = index % 5;
              const colSpanClass =
                pattern <= 2 ? "lg:col-span-2" : "lg:col-span-3";
              const heightClass =
                pattern <= 2 ? "h-32 sm:h-36 md:h-48 lg:h-52" : "h-36 sm:h-40 md:h-60 lg:h-64";
              return (
                <div key={blog._id} className={colSpanClass}>
                  <div className="group rounded-[28px] bg-gradient-to-br from-border/70 via-border/30 to-transparent p-[1px] shadow-[0_22px_50px_rgba(15,23,42,0.14)] transition hover:-translate-y-1">
                    <div className="rounded-[28px] border border-border/60 bg-card/75 overflow-hidden">
                    <div className={`relative ${heightClass} overflow-hidden`}>
                      {resolveMedia(blog.heroImage) ? (
                        <img
                          src={resolveMedia(blog.heroImage)}
                          alt={blog.title}
                          className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute left-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
                        Insight
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                        <span className="uppercase tracking-[0.2em] text-[10px]">{blog.status || "published"}</span>
                      </div>
                      <h3 className="text-lg font-semibold leading-tight line-clamp-2">{blog.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {blog.meta?.description || blog.content?.slice(0, 140)}
                      </p>
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                      >
                        View details
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || isFetching}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-xs uppercase tracking-[0.3em]">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages || isFetching}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/40 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
