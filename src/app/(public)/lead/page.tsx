"use client";

import { useState } from "react";
import { useCreateLeadMutation } from "@/services/leads/lead.hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LeadPage() {
  const createLeadMutation = useCreateLeadMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    segment: "",
    plan: "",
    verificationToken: "",
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    try {
      await createLeadMutation.mutateAsync({
        ...form,
        paymentScreenshot,
      });
      setMessage("Lead submitted successfully.");
    } catch (error: unknown) {
      const msg =
        typeof (error as { response?: { data?: { message?: string } } })?.response?.data?.message === "string"
          ? String((error as { response?: { data?: { message?: string } } })?.response?.data?.message)
          : error instanceof Error
            ? error.message
            : "Unable to submit lead.";
      setMessage(msg);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-3xl mx-auto px-6 py-16">
        <Card className="border-border/60 bg-white/80 dark:bg-white/5 rounded-[1.5rem]">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Lead Submission</h1>
            <form onSubmit={onSubmit} className="space-y-3">
              {["name", "email", "phone", "password", "city", "segment", "plan", "verificationToken"].map((field) => (
                <input
                  key={field}
                  value={(form as Record<string, string>)[field]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm"
                  required={["name", "email", "phone", "password", "verificationToken"].includes(field)}
                />
              ))}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPaymentScreenshot(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-muted file:px-4 file:py-2 file:text-xs file:font-semibold file:text-foreground"
              />
              <Button className="h-11 rounded-xl w-full" disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? "Submitting..." : "Submit Lead"}
              </Button>
            </form>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
