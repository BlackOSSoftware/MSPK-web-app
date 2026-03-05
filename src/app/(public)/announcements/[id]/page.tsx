"use client";

import { useAnnouncementQuery } from "@/services/announcements/announcement.hooks";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { use } from "react";

export default function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useAnnouncementQuery(id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-4xl mx-auto px-6 py-16 space-y-6">
        <Link href="/announcements" className="text-sm text-primary">← Back to announcements</Link>

        <Card className="border-border/60 bg-white/80 dark:bg-white/5 rounded-[1.5rem]">
          <CardContent className="p-6 space-y-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{data?.title || "Announcement"}</h1>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {data?.type || "General"} {data?.priority ? `• ${data.priority}` : ""}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {data?.description || data?.summary || "No description available."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
