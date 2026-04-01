import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, CheckCircle, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminAnalytics() {
  const { data: metrics, isLoading } = trpc.analytics.getMetrics.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 italic text-zinc-500 animate-pulse">Gathering intelligence...</div>
      </DashboardLayout>
    );
  }

  const cards = [
    {
      title: "Total Revenue",
      value: `$${metrics?.totalRevenue.toLocaleString() || "0"}`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      description: "Total paid volume (USD)",
    },
    {
      title: "Total Invoices",
      value: metrics?.totalInvoices || 0,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      description: "Total invoices created",
    },
    {
      title: "Success Rate",
      value: `${metrics?.successRate || 0}%`,
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      description: "Invoices marked as paid",
    },
    {
      title: "Pending Proofs",
      value: metrics?.pendingCount || 0,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      description: "Awaiting verification",
    },
  ];

  const chartData = [
    { name: "Paid", value: metrics?.totalRevenue || 0 },
    { name: "Unpaid", value: (metrics?.totalInvoices || 0) * 1000 - (metrics?.totalRevenue || 0) }, // Mockup unpaid
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Monitor your bootcamp's financial health.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.title} className="glass border-none shadow-premium">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass border-none shadow-premium p-6">
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

