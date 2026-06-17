"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/providers/AuthProvider"
import { SupportTicket, SupportReply, TICKET_STATUSES } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, Send, Paperclip, ImageIcon, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollableDialogContent } from "@/components/ui/scrollable-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import Image from "next/image"

const statusStyles: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
}

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

export function SupportCrud() {
  const { session } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyFile, setReplyFile] = useState<File | null>(null)
  const replyFileInputRef = useRef<HTMLInputElement>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const authHeaders = (): HeadersInit => {
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
    return {}
  }

  useEffect(() => {
    fetchTickets()
  }, [session?.access_token])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/v1/support?all=true", { headers: authHeaders() })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to load tickets")
      setTickets(result.tickets || [])
    } catch (error) {
      console.error("Error fetching support tickets:", error)
      toast.error("Failed to load support tickets")
    } finally {
      setLoading(false)
    }
  }

  const openTicketDetail = async (ticket: SupportTicket) => {
    setSelectedTicket(null)
    setReplyFile(null)
    setIsDetailOpen(true)
    try {
      const response = await fetch(`/api/v1/support/${ticket.support_ticket_id}`, { headers: authHeaders() })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to load ticket")
      setSelectedTicket(result.ticket)
    } catch (error) {
      console.error("Error fetching ticket detail:", error)
      toast.error("Failed to load ticket details")
      setIsDetailOpen(false)
    }
  }

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/v1/support/${ticketId}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to update status")
      toast.success(`Ticket status updated to ${newStatus.replace("_", " ")}`)
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: newStatus })
      }
      fetchTickets()
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast.error("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSubmitReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    try {
      let response: Response
      if (replyFile) {
        const formData = new FormData()
        formData.append("reply", replyText.trim())
        formData.append("file", replyFile)
        response = await fetch(`/api/v1/support/${selectedTicket.support_ticket_id}`, {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        })
      } else {
        response = await fetch(`/api/v1/support/${selectedTicket.support_ticket_id}`, {
          method: "POST",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ reply: replyText.trim() }),
        })
      }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to send reply")
      toast.success("Reply sent successfully")
      setReplyText("")
      setReplyFile(null)
      openTicketDetail(selectedTicket)
    } catch (error) {
      console.error("Error sending reply:", error)
      toast.error("Failed to send reply")
    }
  }

  const enhancedColumns = [
    ...columns,
    {
      id: "view",
      cell: ({ row }: { row: any }) => {
        const ticket = row.original as SupportTicket
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openTicketDetail(ticket)}
          >
            View
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={enhancedColumns}
          data={tickets}
          filterKey="subject"
          filterPlaceholder="Filter tickets..."
        />
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <ScrollableDialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket ? selectedTicket.subject : "Ticket Details"}
            </DialogTitle>
            <DialogDescription>
              View and respond to this support ticket.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className={statusStyles[selectedTicket.status] || ""}>
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className={priorityStyles[selectedTicket.priority] || ""}>
                  {selectedTicket.priority}
                </Badge>
                <div className="text-sm text-muted-foreground ml-auto">
                  {format(new Date(selectedTicket.created_at), "MMM d, yyyy HH:mm")}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">From:</span>
                {selectedTicket.users
                  ? `${selectedTicket.users.name || ""} ${selectedTicket.users.surname || ""}`.trim() || selectedTicket.users.email
                  : "Unknown"}
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.initial_message}</p>
                {selectedTicket.image_url && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border max-w-sm">
                    <Image
                      src={selectedTicket.image_url}
                      alt="Attached image"
                      width={400}
                      height={300}
                      className="object-cover w-full h-auto"
                      style={{ maxHeight: 200 }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status:</label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket.support_ticket_id, value)}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Replies</h4>
                {selectedTicket.support_replies && selectedTicket.support_replies.length > 0 ? (
                  selectedTicket.support_replies.map((reply: SupportReply) => (
                    <div key={reply.support_reply_id} className="bg-accent rounded-lg p-4 ml-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reply.created_at), "MMM d, yyyy HH:mm")}
                        </span>
                        <span className="text-xs font-medium">
                          {reply.users
                            ? `${reply.users.name || ""} ${reply.users.surname || ""}`.trim() || reply.users.email
                            : "Staff"}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.reply}</p>
                      {reply.image_url && (
                        <div className="mt-2 relative rounded-lg overflow-hidden border max-w-sm">
                          <Image
                            src={reply.image_url}
                            alt="Reply image"
                            width={400}
                            height={300}
                            className="object-cover w-full h-auto"
                            style={{ maxHeight: 200 }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                )}
              </div>

              {selectedTicket.status !== "closed" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
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
                    <Button onClick={handleSubmitReply} disabled={!replyText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </ScrollableDialogContent>
      </Dialog>
    </div>
  )
}
