import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateInvoicePDF } from "@/lib/pdfExport";

export default function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedProof, setSelectedProof] = useState<any>(null);

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!invoiceQuery.data) {
    return <div className="flex items-center justify-center min-h-screen">Invoice not found</div>;
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
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-1">{invoice.clientName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold">${invoice.amountUsd}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className={`mt-1 ${getStatusColor(invoice.status)}`}>{invoice.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">{invoice.clientName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <a href={`mailto:${invoice.clientEmail}`} className="text-primary hover:underline">
              {invoice.clientEmail}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      {primaryQrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {primaryQrCode.qrCodeUrl && (
                <img src={primaryQrCode.qrCodeUrl} alt="QR Code" className="w-32 h-32 border rounded" />
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <div className="text-sm text-muted-foreground">Network</div>
                  <Badge variant="outline">{primaryQrCode.network.toUpperCase()}</Badge>
                </div>
                {invoice.exchange && (
                  <div>
                    <div className="text-sm text-muted-foreground">Exchange</div>
                    <div className="font-medium">{invoice.exchange.charAt(0).toUpperCase() + invoice.exchange.slice(1)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Wallet Address</div>
                  <code className="text-xs bg-muted p-2 rounded block break-all">{primaryQrCode.walletAddress}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Proofs */}
      {proofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Proofs</CardTitle>
            <CardDescription>{proofs.length} proof(s) submitted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {proofs.map((proof: any, idx: number) => (
              <div key={proof.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Submission #{idx + 1}</div>
                    <div className="text-sm">{new Date(proof.createdAt).toLocaleString()}</div>
                  </div>
                  <Badge className={getStatusColor(proof.status)}>{proof.status}</Badge>
                </div>

                {proof.imageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSelectedProof(proof)}
                  >
                    <Eye className="w-4 h-4" />
                    View Image
                  </Button>
                )}

                {proof.adminNotes && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <div className="font-medium mb-1">Admin Notes:</div>
                    <p>{proof.adminNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Image Viewer Modal */}
      {selectedProof && (
        <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
            </DialogHeader>
            <img src={selectedProof.imageUrl} alt="Payment Proof" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
