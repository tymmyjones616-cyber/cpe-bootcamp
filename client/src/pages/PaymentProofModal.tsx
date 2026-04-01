import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PaymentProofModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceSlug: string;
  onSuccess?: () => void;
}

export function PaymentProofModal({ open, onOpenChange, invoiceSlug, onSuccess }: PaymentProofModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [clientNotes, setClientNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitProof = trpc.paymentProofs.submit.useMutation({
    onSuccess: () => {
      toast.success("Payment proof submitted successfully!");
      setSubmitted(true);
      setTimeout(() => {
        setPreview(null);
        setClientNotes("");
        setSubmitted(false);
        onOpenChange(false);
        onSuccess?.();
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit payment proof");
    },
  });

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!preview) {
      toast.error("Please upload a screenshot");
      return;
    }

    await submitProof.mutateAsync({
      invoiceSlug,
      imageBase64: preview.split(",")[1] || preview,
      transactionId: "", // Not required from client
      exchangeUsed: "", // Admin configured
      cryptoNetwork: "", // Admin configured
      clientNotes,
    });
  };

  // Success screen
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md text-center">
          <div className="space-y-4 py-8">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Payment Proof Submitted</h2>
              <p className="text-muted-foreground mt-2">
                Thank you! We've received your payment proof. Our team will review it within 24 hours and update your invoice status.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Payment Proof</DialogTitle>
          <DialogDescription>Upload a screenshot showing your payment transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label className="mb-3 block">Payment Screenshot *</Label>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full rounded-lg border max-h-64 object-cover" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  onClick={() => setPreview(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium mb-1">Drag and drop your screenshot here</p>
                <p className="text-sm text-muted-foreground">or click to select a file</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about this payment..."
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submission */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitProof.isPending || !preview}>
              {submitProof.isPending ? "Submitting..." : "Submit Payment Proof"}
            </Button>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200 p-4">
            <p className="text-sm">
              <strong>What to include in your screenshot:</strong> Make sure your screenshot clearly shows the transaction details, amount sent, and timestamp. This helps us verify your payment quickly.
            </p>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
