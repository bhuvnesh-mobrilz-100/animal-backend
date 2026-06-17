import { z } from "zod"

export const PRIORITY_LEVELS = ["low", "medium", "high", "urgent"] as const
export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const

export const supportTicketSchema = z.object({
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  initial_message: z.string().min(1, { message: "Message is required." }),
  priority: z.enum(PRIORITY_LEVELS).default("medium"),
  image_url: z.string().nullable().optional(),
})

export const supportReplySchema = z.object({
  reply: z.string().min(1, { message: "Reply is required." }),
  image_url: z.string().nullable().optional(),
})

export type SupportTicket = z.infer<typeof supportTicketSchema> & {
  support_ticket_id: number
  user_id: number | null
  status: string
  assigned_to: number | null
  last_reply_at: string | null
  created_at: string
  updated_at: string
  users?: {
    user_id: number
    name: string | null
    surname: string | null
    email: string
    profile_image_url: string | null
  } | null
  assigned_user?: {
    user_id: number
    name: string | null
    surname: string | null
    email: string
  } | null
  support_replies?: SupportReply[]
}

export type SupportReply = z.infer<typeof supportReplySchema> & {
  support_reply_id: number
  support_ticket_id: number
  responder_user_id: number | null
  created_at: string
  users?: {
    name: string | null
    surname: string | null
    email: string
  } | null
}
