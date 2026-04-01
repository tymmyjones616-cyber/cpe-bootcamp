import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Search, Copy, CheckCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import AdminInvoiceForm from "./AdminInvoiceForm";
import InvoiceDetails from "./InvoiceDetails";
import DashboardAnalytics from "./DashboardAnalytics";
import { EditInvoiceModal } from "./EditInvoiceModal";

export default function AdminDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("invoices");
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    serviceType: "virtual" as "virtual" | "onsite" | "custom",
    description: "",
    amountUsd: "",
    dueDate: "",
    exchange: "",
    walletAddresses: {} as Record<string, string>,
  });

  const invoicesQuery = trpc.invoices.list.useQuery();
  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted successfully!");
      invoicesQuery.refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete invoice: " + error.message);
    },
  });
  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully!");
      setIsCreateOpen(false);
      setFormData({
        clientName: "",
        clientEmail: "",
        serviceType: "virtual",
        description: "",
        amountUsd: "",
        dueDate: "",
        exchange: "",
        walletAddresses: {},
      });
      invoicesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const handleCreateInvoice = async () => {
    if (!formData.clientName || !formData.clientEmail || !formData.amountUsd || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createInvoice.mutateAsync({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      serviceType: formData.serviceType as "virtual" | "onsite" | "custom",
      description: formData.description,
      amountUsd: formData.amountUsd,
      dueDate: new Date(formData.dueDate),
      exchange: formData.exchange,
      walletAddresses: formData.walletAddresses,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pending", variant: "secondary" },
      under_review: { label: "Under Review", variant: "outline" },
      paid: { label: "Paid", variant: "default" },
      expired: { label: "Expired", variant: "destructive" },
      rejected: { label: "Rejected", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // DashboardLayout already handles auth and loading state

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Management</h1>
            <p className="text-muted-foreground mt-2">Create and manage cryptocurrency invoices</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <AdminInvoiceForm onSuccess={() => {
                setIsCreateOpen(false);
                invoicesQuery.refetch();
              }} />
            </DialogContent>
            {/* Old form - keeping for reference
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Fill in the details to create a new invoice</DialogDescription>
              </DialogHeader>
              <div className="space-y-4" style={{display: 'none'}}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      placeholder="Dr. Sarah Johnson"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="sarah@example.com"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value as "virtual" | "onsite" | "custom" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="virtual">Virtual Bootcamp - $700</SelectItem>
                        <SelectItem value="onsite">Onsite Bootcamp - $2,500</SelectItem>
                        <SelectItem value="custom">Custom Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amountUsd">Amount (USD) *</Label>
                    <Input
                      id="amountUsd"
                      type="number"
                      placeholder="700.00"
                      value={formData.amountUsd}
                      onChange={(e) => setFormData({ ...formData, amountUsd: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="CPE Virtual Bootcamp - 3 Month Online Access"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wallet Addresses</Label>
                  <p className="text-sm text-muted-foreground">Add wallet addresses for payment methods</p>
                  <div className="space-y-2">
                    {["btc", "usdt_trc20", "usdt_erc20", "eth_erc20", "usdc_trc20"].map((network) => (
                      <Input
                        key={network}
                        placeholder={`${network.toUpperCase()} wallet address`}
                        value={formData.walletAddresses[network] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            walletAddresses: { ...formData.walletAddresses, [network]: e.target.value },
                          })
                        }
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreateInvoice} className="w-full" disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </DialogContent>
            */}
          </Dialog>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <DashboardAnalytics />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Manage and track all invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesQuery.isLoading ? (
                  <div className="text-center py-8">Loading invoices...</div>
                ) : invoicesQuery.data?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No invoices yet. Create one to get started.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                          <th className="text-left py-3 px-4 font-semibold">Client</th>
                          <th className="text-left py-3 px-4 font-semibold">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesQuery.data?.map((invoice) => (
                          <tr key={invoice.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-mono text-sm">{invoice.invoiceNumber}</td>
                            <td className="py-3 px-4">{invoice.clientName}</td>
                            <td className="py-3 px-4 font-semibold">${invoice.amountUsd}</td>
                            <td className="py-3 px-4 text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                            <td className="py-3 px-4 flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = `${window.location.origin}/i/${invoice.uniqueSlug}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link copied to clipboard");
                                }}
                              >
                                Copy Link
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingInvoice(invoice)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/invoice/${invoice.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteConfirm(invoice.id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this invoice? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirm !== null) {
                    deleteInvoice.mutate(deleteConfirm);
                    setDeleteConfirm(null);
                  }
                }}
                disabled={deleteInvoice.isPending}
              >
                {deleteInvoice.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <EditInvoiceModal
          open={!!editingInvoice}
          onOpenChange={(open) => !open && setEditingInvoice(null)}
          invoice={editingInvoice}
          onSuccess={() => {
            invoicesQuery.refetch();
            setEditingInvoice(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
