import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateInvoicePDF } from "@/lib/pdfExport";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [, setLocation] = useLocation();

  const invoiceQuery = trpc.invoices.getById.useQuery(parseInt(id || "0"), {
    enabled: !!id,
  });

  const qrCodesQuery = trpc.invoices.getQrCodes.useQuery(invoiceQuery.data?.id || 0, {
    enabled: !!invoiceQuery.data?.id,
  });

  const proofsQuery = trpc.paymentProofs.getByInvoiceId.useQuery(invoiceQuery.data?.id || 0, {
    enabled: !!invoiceQuery.data?.id,
  });

  if (invoiceQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 italic text-zinc-500 animate-pulse">Scanning ledger for invoice {id}...</div>
      </DashboardLayout>
    );
  }

  if (!invoiceQuery.data) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center space-y-4">
          <div className="text-xl font-semibold text-zinc-400">Invoice not found</div>
          <Button onClick={() => setLocation("/admin")} variant="outline">Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const invoice = invoiceQuery.data;
  const qrCodes = qrCodesQuery.data || [];
  const proofs = proofsQuery.data || [];
  const primaryQrCode = qrCodes.length > 0 ? qrCodes[0] : null;

  const handleDownloadPDF = () => {
    generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName || "Unknown",
      clientEmail: invoice.clientEmail || "unknown@example.com",
      description: invoice.description || "Service",
      amountUsd: String(invoice.amountUsd),
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      qrCodeUrl: primaryQrCode?.qrCodeUrl || undefined,
      walletAddress: primaryQrCode?.walletAddress || undefined,
      network: primaryQrCode?.network || undefined,
      exchange: invoice.exchange || undefined,
      paymentInstructions: invoice.paymentInstructions || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "paid":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "under_review":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button 
              onClick={() => setLocation("/admin")}
              className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-primary transition-colors mb-4 group"
            >
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              Back to Invoices
            </button>
            <h1 className="text-4xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-zinc-500 font-medium text-lg">{invoice.clientName}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownloadPDF} size="lg" className="gap-2 shadow-premium">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Invoice Summary */}
            <Card className="glass border-none shadow-premium overflow-hidden">
              <div className="h-1 bg-primary w-full" />
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Amount Due</div>
                    <div className="text-3xl font-bold font-mono text-primary">${invoice.amountUsd}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</div>
                    <Badge className={`px-4 py-1 text-sm font-bold border ${getStatusColor(invoice.status || 'pending')}`} variant="outline">
                      {(invoice.status || 'PENDING').replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-100/5">
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Date Issued</div>
                    <div className="font-medium">{new Date(invoice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Maturity Date</div>
                    <div className="font-medium text-red-400">{new Date(invoice.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Proofs */}
            {proofs.length > 0 && (
              <Card className="glass border-none shadow-premium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Payment Verifications
                    <Badge variant="secondary" className="font-mono">{proofs.length}</Badge>
                  </CardTitle>
                  <CardDescription>Visual evidence submitted by the client</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {proofs.map((proof: any, idx: number) => (
                    <div key={proof.id} className="bg-zinc-950/50 rounded-2xl p-6 border border-zinc-800/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Submission #{idx + 1}</div>
                          <div className="text-sm font-medium">{new Date(proof.createdAt).toLocaleString()}</div>
                        </div>
                        <Badge className={`font-bold border ${getStatusColor(proof.status || 'under_review')}`} variant="outline">
                          {(proof.status || 'UNDER REVIEW').replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex gap-4 items-center">
                        {proof.imageUrl && (
                          <div className="relative group cursor-zoom-in" onClick={() => setSelectedProof(proof)}>
                            <img src={proof.imageUrl} alt="Proof" className="w-24 h-24 object-cover rounded-xl border border-zinc-800 group-hover:opacity-75 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          {proof.adminNotes ? (
                            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-sm italic text-blue-200">
                              "{proof.adminNotes}"
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500 italic">No administrative notes recorded for this submission.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="glass border-none shadow-premium">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Client Profiling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">Entity Name</div>
                  <div className="font-semibold">{invoice.clientName}</div>
                </div>
                <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                  <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">Contact Email</div>
                  <a href={`mailto:${invoice.clientEmail}`} className="font-medium text-primary hover:underline break-all">
                    {invoice.clientEmail}
                  </a>
                </div>
              </CardContent>
            </Card>

            {primaryQrCode && (
              <Card className="glass border-none shadow-premium">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Settlement Method</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {primaryQrCode.qrCodeUrl && (
                    <div className="p-2 bg-white rounded-2xl inline-block shadow-lg">
                      <img src={primaryQrCode.qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    </div>
                  )}
                  <div className="space-y-2 text-left pt-2">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Network Payload</div>
                      <Badge variant="secondary" className="font-mono text-[10px] w-full justify-center py-1">
                        {(primaryQrCode.network || 'UNKNOWN').toUpperCase()}
                      </Badge>
                    </div>
                    {invoice.exchange && (
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Custodian / Exchange</div>
                        <div className="text-sm font-bold text-zinc-300">{(invoice.exchange || '').toUpperCase()}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Destination Address</div>
                      <code className="text-[10px] bg-zinc-950 p-2 rounded-lg block break-all border border-zinc-800 text-primary font-mono">{primaryQrCode.walletAddress}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Image Viewer Modal */}
        <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
          <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <DialogTitle className="text-zinc-400 text-sm">Payment Verification Image</DialogTitle>
            </DialogHeader>
            <div className="p-2 flex items-center justify-center bg-[#050505]">
              <img src={selectedProof?.imageUrl} alt="Verification" className="max-w-full max-h-[70vh] rounded-lg shadow-2xl shadow-blue-500/10" />
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-center">
              <p className="text-xs text-zinc-500 font-mono">ENCRYPTED IMAGE PAYLOAD FROM {new Date(selectedProof?.createdAt || Date.now()).toLocaleDateString().toUpperCase()}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

