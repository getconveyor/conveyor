"use client"

import { useState } from "react"
import Link from "next/link"
import {
  IconEdit,
  IconRefresh,
  IconShare,
  IconDownload,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconShoppingCart,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Mock data for charts
const salesTrendData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
]

const categoryData = [
  { category: "Electronics", sales: 28500 },
  { category: "Clothing", sales: 22000 },
  { category: "Home & Garden", sales: 18500 },
  { category: "Sports", sales: 15000 },
  { category: "Books", sales: 12000 },
]

const customerGrowthData = [
  { week: "Week 1", customers: 1200 },
  { week: "Week 2", customers: 1450 },
  { week: "Week 3", customers: 1380 },
  { week: "Week 4", customers: 1620 },
  { week: "Week 5", customers: 1890 },
  { week: "Week 6", customers: 2100 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-2))",
  },
  customers: {
    label: "Customers",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function DashboardViewPage({ params }: { params: { id: string } }) {
  const [timeRange, setTimeRange] = useState("30d")
  const [lastUpdated, setLastUpdated] = useState("2 minutes ago")

  // Mock dashboard data
  const dashboard = {
    id: params.id,
    name: "Sales Performance",
    description: "Key metrics and trends for sales team performance",
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dashboard.name}</h1>
          <p className="text-sm text-muted-foreground">{dashboard.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <IconClock className="h-3 w-3" />
            Updated {lastUpdated}
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <IconDownload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <IconShare className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/data-analytics/dashboards/${params.id}/builder`}>
              <IconEdit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Metric Cards */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$328,000</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>12.5%</span>
                </div>
              </div>
              <IconCurrencyDollar className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">1,248</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>8.2%</span>
                </div>
              </div>
              <IconShoppingCart className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold">2,100</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>15.3%</span>
                </div>
              </div>
              <IconUsers className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">$263</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <IconTrendingDown className="h-3 w-3" />
                  <span>3.1%</span>
                </div>
              </div>
              <IconCurrencyDollar className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Top 5 product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Weekly active customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="var(--color-customers)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
