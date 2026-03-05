"use client";

import Link from "next/link";
import Head from "next/head";
import { useParams } from "next/navigation";
import { Calendar, Tag } from "lucide-react";
import { useBlogQuery } from "@/services/blogs/blog.hooks";

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

export default function BlogDetailsPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data, isLoading } = useBlogQuery(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading blog...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Blog not found.</div>
      </div>
    );
  }

  const seoTitle = data.meta?.title || data.title;
  const seoDescription = data.meta?.description || data.content?.slice(0, 160) || "MSPK blog update";
  const seoImage = resolveMedia(data.meta?.image || data.heroImage);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        {seoImage ? <meta property="og:image" content={seoImage} /> : null}
        <meta name="twitter:card" content={seoImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {seoImage ? <meta name="twitter:image" content={seoImage} /> : null}
      </Head>
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
        <div className="relative mx-auto w-full max-w-5xl px-6 pt-24 pb-10 space-y-6">
          <Link href="/blog" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            ← Back to blogs
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(data.publishedAt || data.createdAt)}
            </span>
            <span className="uppercase tracking-[0.2em] text-[10px]">{data.status || "published"}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 pb-16 space-y-8">
        <div className="rounded-[28px] overflow-hidden border border-border/60 bg-card/70 shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
          {resolveMedia(data.heroImage) ? (
            <img
              src={resolveMedia(data.heroImage)}
              alt={data.title}
              className="h-[320px] w-full object-cover object-center"
            />
          ) : (
            <div className="h-[320px] w-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500" />
          )}
        </div>

        {data.meta?.description ? (
          <p className="text-base text-muted-foreground">{data.meta.description}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {data.categories?.map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-3 py-1">
              <Tag className="h-3 w-3" />
              {cat}
            </span>
          ))}
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-8 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {data.content}
        </div>
      </div>
    </div>
  );
}
