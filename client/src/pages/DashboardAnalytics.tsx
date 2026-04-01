import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

export default function DashboardAnalytics() {
  const invoicesQuery = trpc.invoices.list.useQuery();
  const proofsQuery = trpc.paymentProofs.listPending.useQuery();

  const invoices = invoicesQuery.data || [];
  const proofs = proofsQuery.data || [];

  // Calculate metrics
  const metrics = useMemo(() => {
    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(String(inv.amountUsd || 0)), 0),
      paidAmount: invoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(String(inv.amountUsd || 0)), 0),
      pendingAmount: invoices
        .filter((inv) => inv.status === "pending")
        .reduce((sum, inv) => sum + parseFloat(String(inv.amountUsd || 0)), 0),
      paidCount: invoices.filter((inv) => inv.status === "paid").length,
      pendingCount: invoices.filter((inv) => inv.status === "pending").length,
      underReviewCount: invoices.filter((inv) => inv.status === "under_review").length,
      rejectedCount: invoices.filter((inv) => inv.status === "rejected").length,
      pendingProofs: proofs.length,
    };

    return stats;
  }, [invoices, proofs]);

  // Status distribution data
  const statusData = useMemo(() => {
    return [
      { name: "Paid", value: metrics.paidCount, color: "#34C759" },
      { name: "Pending", value: metrics.pendingCount, color: "#FF9500" },
      { name: "Under Review", value: metrics.underReviewCount, color: "#0A84FF" },
      { name: "Rejected", value: metrics.rejectedCount, color: "#FF3B30" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Revenue by service type
  const revenueByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      const type = inv.description?.includes("Virtual") ? "Virtual" : inv.description?.includes("Onsite") ? "Onsite" : "Custom";
      typeMap[type] = (typeMap[type] || 0) + parseFloat(String(inv.amountUsd || 0));
    });

    return Object.entries(typeMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [invoices]);

  // Recent activities
  const recentActivities = useMemo(() => {
    const activities: any[] = [];

    // Add recent invoices
    invoices.slice(0, 5).forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: "invoice",
        title: `Invoice created for ${inv.clientName}`,
        amount: `$${inv.amountUsd}`,
        timestamp: inv.createdAt,
        status: inv.status,
      });
    });

    // Add recent payment proofs
    proofs.slice(0, 3).forEach((proof: any) => {
      activities.push({
        id: `proof-${proof.proof.id}`,
        type: "proof",
        title: `Payment proof submitted`,
        amount: proof.invoice?.amountUsd ? `$${proof.invoice.amountUsd}` : "N/A",
        timestamp: proof.proof.createdAt,
        status: proof.proof.status,
      });
    });

    // Sort by timestamp
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [invoices, proofs]);

  // Payment collection trend (last 7 days)
  const paymentTrend = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return days.map((day) => {
      const dayInvoices = invoices.filter((inv) => inv.createdAt.toISOString().split("T")[0] === day);
      const paidInvoices = dayInvoices.filter((inv) => inv.status === "paid");
      return {
        date: new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        invoices: dayInvoices.length,
        paid: paidInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.amountUsd || 0)), 0),
      };
    });
  }, [invoices]);

  const successRate = metrics.totalInvoices > 0 ? Math.round((metrics.paidCount / metrics.totalInvoices) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All time invoices created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total invoice amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${metrics.paidAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{metrics.paidCount} invoices paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.pendingProofs}</div>
            <p className="text-xs text-muted-foreground">Payment proofs awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>Breakdown of all invoices by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Type</CardTitle>
            <CardDescription>Total revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
                  <Bar dataKey="value" fill="#0A84FF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Collection Trend</CardTitle>
            <CardDescription>Last 7 days activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={paymentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="invoices" stroke="#0A84FF" name="Invoices Created" />
                <Line yAxisId="right" type="monotone" dataKey="paid" stroke="#34C759" name="Amount Paid ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Success Rate</CardTitle>
            <CardDescription>Invoices paid vs total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{successRate}%</div>
                <p className="text-sm text-muted-foreground mt-2">Success Rate</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Paid</span>
                <span className="font-medium">{metrics.paidCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pending</span>
                <span className="font-medium">{metrics.pendingCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Under Review</span>
                <span className="font-medium">{metrics.underReviewCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rejected</span>
                <span className="font-medium">{metrics.rejectedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest invoices and payment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{activity.amount}</span>
                    <Badge
                      variant={
                        activity.status === "paid"
                          ? "default"
                          : activity.status === "pending"
                            ? "secondary"
                            : activity.status === "under_review"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activities</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
