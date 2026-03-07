import { redirect } from "next/navigation";

export default function WatchlistPage() {
  redirect("/dashboard/signals?tab=scripts");
}
