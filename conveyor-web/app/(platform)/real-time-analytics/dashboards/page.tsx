"use client"

import { useState } from "react"
import {
  IconPlus,
  IconLayoutDashboard,
  IconRefresh,
  IconSettings,
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconShoppingCart,
  IconCurrencyDollar,
  IconActivity,
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Mock real-time data
const realtimeData = [
  { time: "12:00", value: 45 },
  { time: "12:15", value: 52 },
  { time: "12:30", value: 48 },
  { time: "12:45", value: 61 },
  { time: "13:00", value: 55 },
  { time: "13:15", value: 67 },
]

const trafficData = [
  { time: "12:00", users: 1200 },
  { time: "12:15", users: 1450 },
  { time: "12:30", users: 1380 },
  { time: "12:45", users: 1620 },
  { time: "13:00", users: 1890 },
  { time: "13:15", users: 2100 },
]

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
  users: {
    label: "Users",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function RealTimeDashboardsPage() {
  const [isLive, setIsLive] = useState(true)

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real-time Dashboards</h1>
          <p className="text-sm text-muted-foreground">
            Live metrics and instant data visualization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            <IconActivity className={`h-4 w-4 mr-2 ${isLive ? "animate-pulse" : ""}`} />
            {isLive ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <IconSettings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">2,100</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>+18.2%</span>
                </div>
              </div>
              <IconUsers className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders/min</p>
                <p className="text-2xl font-bold">67</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>+12.5%</span>
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
                <p className="text-sm text-muted-foreground">Revenue/min</p>
                <p className="text-2xl font-bold">$4.2K</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <IconTrendingDown className="h-3 w-3" />
                  <span>-3.1%</span>
                </div>
              </div>
              <IconCurrencyDollar className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">3.8%</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-500">
                  <IconTrendingUp className="h-3 w-3" />
                  <span>+0.4%</span>
                </div>
              </div>
              <IconActivity className="h-8 w-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Real-time Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Activity</CardTitle>
                <CardDescription>Events per minute</CardDescription>
              </div>
              {isLive && (
                <Badge variant="outline" className="text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={realtimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Traffic Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Last 90 minutes</CardDescription>
              </div>
              {isLive && (
                <Badge variant="outline" className="text-xs">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
          <CardDescription>Recent events as they happen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "Just now", event: "New order #12457 placed", amount: "$149.99" },
              { time: "2 sec ago", event: "User registered: sarah.j@email.com", amount: null },
              { time: "5 sec ago", event: "Payment processed #12456", amount: "$89.50" },
              { time: "8 sec ago", event: "Cart abandoned - value $234.00", amount: null },
              { time: "12 sec ago", event: "New order #12455 placed", amount: "$299.99" },
              { time: "18 sec ago", event: "Product viewed: iPhone 15 Pro", amount: null },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                {item.amount && (
                  <Badge variant="outline" className="text-xs">
                    {item.amount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
