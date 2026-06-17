"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { PRIORITY_LEVELS } from "@/components/crud/support/schema";
import type { SupportTicket, SupportReply } from "@/components/crud/support/schema";
import { Paperclip, X, ImageIcon, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    open: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
};

function MessageImage({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  return (
    <div className="mt-2 relative rounded-lg overflow-hidden border max-w-sm">
      <Image
        src={url}
        alt="Attached image"
        width={400}
        height={300}
        className="object-cover w-full h-auto"
        style={{ maxHeight: 200 }}
      />
    </div>
  );
}

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  async function fetchMyTickets() {
    setLoadingTickets(true);
    try {
      const res = await fetch("/api/v1/support");
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }

  async function openTicket(ticketId: number) {
    setLoadingDetail(true);
    setReplyText("");
    setReplyFile(null);
    try {
      const res = await fetch(`/api/v1/support/${ticketId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data.ticket);
      }
    } catch (err) {
      console.error("Failed to fetch ticket detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      let res: Response;
      if (replyFile) {
        const formData = new FormData();
        formData.append("reply", replyText.trim());
        formData.append("file", replyFile);
        res = await fetch(`/api/v1/support/${selectedTicket.support_ticket_id}`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/v1/support/${selectedTicket.support_ticket_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reply: replyText.trim() }),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Failed to send reply", description: result.error || "Please try again.", variant: "destructive" });
        return;
      }

      toast({ title: "Reply sent", description: "Your response has been added to the ticket.", variant: "default" });
      setReplyText("");
      setReplyFile(null);
      openTicket(selectedTicket.support_ticket_id);
      fetchMyTickets();
    } catch {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } finally {
      setIsSendingReply(false);
    }
  }

  async function submitTicket() {
    if (!subject || !message) {
      toast({ title: "Missing fields", description: "Please provide both a subject and message.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("message", message);
        formData.append("priority", priority);
        formData.append("file", file);
        res = await fetch("/api/v1/support", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/v1/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, message, priority }),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        toast({ title: "Unable to submit ticket", description: result.error || "Please sign in and try again.", variant: "destructive" });
        return;
      }

      toast({ title: "Ticket submitted", description: "Your support request has been created.", variant: "default" });
      setSubject("");
      setMessage("");
      setPriority("medium");
      setFile(null);
      fetchMyTickets();
    } catch {
      toast({ title: "Error", description: "Failed to submit ticket", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-900">
      <Toaster />

      {/* My Tickets Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">My Tickets</h1>
        <p className="text-sm text-muted-foreground mb-6">View your submitted support requests and their responses.</p>

        {loadingTickets ? (
          <p className="text-gray-500">Loading your tickets...</p>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>You haven&apos;t submitted any tickets yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket.support_ticket_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openTicket(ticket.support_ticket_id)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                      {ticket.last_reply_at && ` · Last reply ${format(new Date(ticket.last_reply_at), "MMM d, yyyy HH:mm")}`}
                    </p>
                  </div>
                  <Badge className={statusBadge(ticket.status)}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {format(new Date(selectedTicket.created_at), "MMM d, yyyy HH:mm")}
                    {" | "}
                    <Badge className={statusBadge(selectedTicket.status)}>
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingDetail ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : (
                <>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.initial_message}</p>
                    <MessageImage url={selectedTicket.image_url} />
                  </div>

                  {selectedTicket.support_replies?.map((reply: SupportReply) => (
                    <div key={reply.support_reply_id} className="bg-gray-50 rounded-lg p-4 ml-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">
                          {format(new Date(reply.created_at), "MMM d, yyyy HH:mm")}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          {reply.users ? `${reply.users.name || ""} ${reply.users.surname || ""}`.trim() || reply.users.email : "Staff"}
                        </span>
                      </div>
                      {reply.reply && <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.reply}</p>}
                      <MessageImage url={reply.image_url} />
                    </div>
                  ))}

                  {(!selectedTicket.support_replies || selectedTicket.support_replies.length === 0) && (
                    <p className="text-gray-400 text-center text-sm py-4">No replies yet. Our team will respond soon.</p>
                  )}
                </>
              )}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
              <div className="border-t p-4 space-y-3 flex-shrink-0">
                <Label htmlFor="reply">Add a reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Type your response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                    />
                    {replyFile ? (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md w-fit">
                        <ImageIcon className="h-4 w-4" />
                        <span className="truncate max-w-[150px]">{replyFile.name}</span>
                        <button onClick={() => { setReplyFile(null); if (replyFileInputRef.current) replyFileInputRef.current.value = ""; }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => replyFileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4 mr-1" />
                        Attach Image
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
                    <Button
                      onClick={sendReply}
                      disabled={!replyText.trim() || isSendingReply}
                    >
                      {isSendingReply ? "Sending..." : (
                        <><Send className="h-4 w-4 mr-1" /> Send</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {selectedTicket.status === "closed" && (
              <div className="border-t p-4 flex-shrink-0 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Create New Ticket</h2>
        <p className="text-sm text-muted-foreground mb-6">Submit a new support request and our team will get back to you.</p>

        <div className="grid gap-6">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              placeholder="What can we help you with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <Label>Attachment (optional)</Label>
            <div className="mt-1">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md w-fit">
                  <ImageIcon className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attach Image
                </Button>
              )}
            </div>
          </div>

          <Button disabled={isSubmitting} onClick={submitTicket} className="w-full md:w-auto">
            {isSubmitting ? "Sending..." : "Submit Ticket"}
          </Button>
        </div>
      </div>
    </div>
  );
}
