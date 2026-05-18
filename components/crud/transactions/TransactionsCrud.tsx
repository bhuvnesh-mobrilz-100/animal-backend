"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Transaction } from "./schema"
import { columns } from "./columns"
import { DataTable } from "../DataTable"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TransactionsCrud() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [minAmount, setMinAmount] = useState<string>("")
  const [maxAmount, setMaxAmount] = useState<string>("")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("transactions")
        .select(`
          *,
          user:users(user_id, name, surname, email)
        `)
        .order("created_at", { ascending: false })

      // Apply filters
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString())
      }

      if (endDate) {
        // Set time to end of day
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        query = query.lte("created_at", endOfDay.toISOString())
      }

      if (minAmount && !isNaN(parseFloat(minAmount))) {
        query = query.gte("amount", parseFloat(minAmount))
      }

      if (maxAmount && !isNaN(parseFloat(maxAmount))) {
        query = query.lte("amount", parseFloat(maxAmount))
      }

      const { data, error } = await query

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    fetchTransactions()
  }

  const handleResetFilters = () => {
    setStatusFilter("all")
    setStartDate(null)
    setEndDate(null)
    setMinAmount("")
    setMaxAmount("")
    fetchTransactions()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transactions</h2>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm space-y-4">
        <h3 className="text-lg font-medium">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              placeholder="Select start date"
            />
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              placeholder="Select end date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-amount">Min Amount</Label>
            <Input
              id="min-amount"
              type="number"
              placeholder="Min amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-amount">Max Amount</Label>
            <Input
              id="max-amount"
              type="number"
              placeholder="Max amount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset Filters
          </Button>
          <Button onClick={handleFilterChange}>Apply Filters</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          filterKey="payment_reference"
          filterPlaceholder="Filter by reference..."
        />
      )}
    </div>
  )
}
