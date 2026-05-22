"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function submitTicket() {
    if (!subject || !message) {
      toast({ title: "Missing fields", description: "Please provide both a subject and message.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/v1/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      toast({ title: "Unable to submit ticket", description: result.error || "Please sign in and try again.", variant: "destructive" });
      return;
    }

    toast({ title: "Ticket submitted", description: "Your support request has been created.", variant: "default" });
    setSubject("");
    setMessage("");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-900">
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Get Help</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit a ticket and our team will respond through the dashboard.
          </p>
        </div>

        <div className="grid gap-6">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              placeholder="What can we help you with?"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <Button disabled={isSubmitting} onClick={submitTicket} className="w-full md:w-auto">
            {isSubmitting ? "Sending..." : "Submit Ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
