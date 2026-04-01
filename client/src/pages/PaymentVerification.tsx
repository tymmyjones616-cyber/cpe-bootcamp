import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, AlertCircle } from "lucide-react";

export default function PaymentVerification() {
  const { user } = useAuth();
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const proofsQuery = trpc.paymentProofs.listPending.useQuery();
  const approveMutation = trpc.paymentProofs.approve.useMutation();
  const rejectMutation = trpc.paymentProofs.reject.useMutation();

  const handleApprove = async () => {
    if (!selectedProof) return;
    try {
      await approveMutation.mutateAsync({
        proofId: selectedProof.proof.id,
        adminNotes,
      });
      toast.success("Payment approved successfully");
      setShowApproveDialog(false);
      setAdminNotes("");
      setSelectedProof(null);
      proofsQuery.refetch();
    } catch (error) {
      toast.error("Failed to approve payment");
    }
  };

  const handleReject = async () => {
    if (!selectedProof || !rejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        proofId: selectedProof.proof.id,
        reason: rejectionReason,
        adminNotes,
      });
      toast.success("Payment rejected");
      setShowRejectDialog(false);
      setRejectionReason("");
      setAdminNotes("");
      setSelectedProof(null);
      proofsQuery.refetch();
    } catch (error) {
      toast.error("Failed to reject payment");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground mt-2">Review and verify pending payment proofs</p>
      </div>

      {proofsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">Loading payment proofs...</div>
      ) : proofsQuery.data?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending payment proofs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proofsQuery.data?.map((item: any) => (
            <Card key={item.proof.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.invoice?.invoiceNumber}</CardTitle>
                    <CardDescription>{item.invoice?.clientName}</CardDescription>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">${item.invoice?.amountUsd}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Exchange</p>
                    <p className="font-semibold">{item.proof.exchangeUsed}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-xs break-all">{item.proof.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p className="font-semibold">{item.proof.cryptoNetwork}</p>
                  </div>
                </div>

                {item.proof.clientNotes && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Client Notes</p>
                    <p className="text-sm">{item.proof.clientNotes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProof(item)}
                    className="mb-4 w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Payment Proof Image
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedProof(item);
                        setShowApproveDialog(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setSelectedProof(item);
                        setShowRejectDialog(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={selectedProof && !showApproveDialog && !showRejectDialog} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof Image</DialogTitle>
          </DialogHeader>
          {selectedProof?.proof.imageUrl && (
            <img src={selectedProof.proof.imageUrl} alt="Payment proof" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Approve payment for {selectedProof?.invoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about this payment verification..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? "Approving..." : "Approve Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Reject payment for {selectedProof?.invoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Input
                placeholder="e.g., Transaction ID not found, Amount mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any additional notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
