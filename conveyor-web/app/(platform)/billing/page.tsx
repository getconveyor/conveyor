"use client"

import { useState } from "react"
import {
  IconCreditCard,
  IconReceipt,
  IconDownload,
  IconCheck,
  IconX,
  IconDots,
  IconPlus,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Invoice {
  id: string
  date: string
  amount: string
  status: "paid" | "pending" | "failed"
  description: string
}

const mockInvoices: Invoice[] = [
  {
    id: "INV-2024-001",
    date: "Jan 15, 2024",
    amount: "$299.00",
    status: "paid",
    description: "Professional Plan - Monthly",
  },
  {
    id: "INV-2023-012",
    date: "Dec 15, 2023",
    amount: "$299.00",
    status: "paid",
    description: "Professional Plan - Monthly",
  },
  {
    id: "INV-2023-011",
    date: "Nov 15, 2023",
    amount: "$299.00",
    status: "paid",
    description: "Professional Plan - Monthly",
  },
  {
    id: "INV-2023-010",
    date: "Oct 15, 2023",
    amount: "$299.00",
    status: "paid",
    description: "Professional Plan - Monthly",
  },
]

export default function BillingPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="outline" className="text-green-600">
            <IconCheck className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return (
          <Badge variant="destructive">
            <IconX className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are currently on the Professional plan
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-blue-600">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$299</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <IconCheck className="h-4 w-4 text-green-500" />
                <span>Unlimited workflows</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconCheck className="h-4 w-4 text-green-500" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconCheck className="h-4 w-4 text-green-500" />
                <span>Real-time monitoring</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconCheck className="h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconCheck className="h-4 w-4 text-green-500" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Next billing date</p>
              <p className="text-sm text-muted-foreground">February 15, 2024</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">Cancel Subscription</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <IconCreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/2025</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Default
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <IconDots className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Button variant="outline">
            <IconPlus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>

      {/* Usage & Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            Your usage for the current billing period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Workflows Run</p>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-xs text-muted-foreground mt-1">of unlimited</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Data Processed</p>
              <p className="text-2xl font-bold">45.2 GB</p>
              <p className="text-xs text-muted-foreground mt-1">of unlimited</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">API Calls</p>
              <p className="text-2xl font-bold">328K</p>
              <p className="text-xs text-muted-foreground mt-1">of unlimited</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.amount}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDots className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconDownload className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconReceipt className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Update your billing address and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <p className="text-sm font-medium">Company Name</p>
              <p className="text-sm text-muted-foreground">Acme Corporation</p>
            </div>
            <div>
              <p className="text-sm font-medium">Billing Address</p>
              <p className="text-sm text-muted-foreground">
                123 Business St, Suite 100
                <br />
                San Francisco, CA 94105
                <br />
                United States
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Tax ID</p>
              <p className="text-sm text-muted-foreground">12-3456789</p>
            </div>
          </div>

          <Button variant="outline">Update Billing Information</Button>
        </CardContent>
      </Card>
    </>
  )
}
