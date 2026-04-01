import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const NETWORKS = ["btc", "usdt_trc20", "usdt_erc20", "usdt_bep20", "eth", "usdc", "eth_base", "eth_arbitrum"];
const EXCHANGES = ["binance", "coinbase", "bybit", "ndax", "bitget"];

interface EditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess?: () => void;
}

interface QrCodeEntry {
  network: string;
  walletAddress: string;
  qrCodePreview?: string;
}

interface VideoTutorialEntry {
  exchange: string;
  videoUrl: string;
  title?: string;
  description?: string;
}

export function EditInvoiceModal({ open, onOpenChange, invoice, onSuccess }: EditInvoiceModalProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    amountUsd: "",
    dueDate: "",
    description: "",
    exchange: "",
  });

  const [qrCodes, setQrCodes] = useState<QrCodeEntry[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorialEntry[]>([]);
  const [newQr, setNewQr] = useState<QrCodeEntry>({ network: "", walletAddress: "" });
  const [newVideo, setNewVideo] = useState<VideoTutorialEntry>({ exchange: "", videoUrl: "" });
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const qrCodesQuery = trpc.invoices.getQrCodes.useQuery(invoice?.id || 0, {
    enabled: !!invoice?.id,
  });

  const videosQuery = trpc.invoices.getVideoTutorials.useQuery(invoice?.id || 0, {
    enabled: !!invoice?.id,
  });

  const editInvoice = trpc.invoices.edit.useMutation({
    onSuccess: () => {
      toast.success("Invoice updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice");
    },
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        clientName: invoice.clientName || "",
        clientEmail: invoice.clientEmail || "",
        amountUsd: String(invoice.amountUsd) || "",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
        description: invoice.description || "",
        exchange: invoice.exchange || "",
      });
    }
  }, [invoice, open]);

  useEffect(() => {
    if (qrCodesQuery.data) {
      setQrCodes(qrCodesQuery.data.map(qr => ({
        network: qr.network,
        walletAddress: qr.walletAddress,
        qrCodePreview: qr.qrCodeUrl || undefined,
      })));
    }
  }, [qrCodesQuery.data]);

  useEffect(() => {
    if (videosQuery.data) {
      setVideoTutorials(videosQuery.data.map(v => ({
        exchange: v.exchange,
        videoUrl: v.videoUrl,
        title: v.title || undefined,
        description: v.description || undefined,
      })));
    }
  }, [videosQuery.data]);

  const handleAddQrCode = () => {
    if (!newQr.network || !newQr.walletAddress) {
      toast.error("Please fill in network and wallet address");
      return;
    }
    setQrCodes([...qrCodes, newQr]);
    setNewQr({ network: "", walletAddress: "" });
    setShowQrDialog(false);
    toast.success("QR code added");
  };

  const handleRemoveQrCode = (index: number) => {
    setQrCodes(qrCodes.filter((_, i) => i !== index));
  };

  const handleAddVideo = () => {
    if (!newVideo.exchange || !newVideo.videoUrl) {
      toast.error("Please fill in exchange and video URL");
      return;
    }
    setVideoTutorials([...videoTutorials, newVideo]);
    setNewVideo({ exchange: "", videoUrl: "" });
    setShowVideoDialog(false);
    toast.success("Video tutorial added");
  };

  const handleRemoveVideo = (index: number) => {
    setVideoTutorials(videoTutorials.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientEmail || !formData.amountUsd || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const walletAddresses: Record<string, string> = {};
    qrCodes.forEach((qr) => {
      walletAddresses[qr.network] = qr.walletAddress;
    });

    const qrCodesData = qrCodes.map(qr => ({
      network: qr.network,
      walletAddress: qr.walletAddress,
      qrCodeUrl: qr.qrCodePreview,
    }));

    const videosData = videoTutorials.map(v => ({
      exchange: v.exchange,
      videoUrl: v.videoUrl,
      title: v.title,
      description: v.description,
    }));

    await editInvoice.mutateAsync({
      id: invoice.id,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      amountUsd: formData.amountUsd,
      dueDate: new Date(formData.dueDate),
      description: formData.description,
      exchange: formData.exchange,
      walletAddresses,
      qrCodes: qrCodesData,
      videoTutorials: videosData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>Update invoice details and payment configuration</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client Name *</Label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Client Email *</Label>
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (USD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amountUsd}
                    onChange={(e) => setFormData({ ...formData, amountUsd: e.target.value })}
                    placeholder="700.00"
                  />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Invoice description"
                  rows={2}
                />
              </div>

              <div>
                <Label>Exchange</Label>
                <Select value={formData.exchange} onValueChange={(val) => setFormData({ ...formData, exchange: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGES.map((ex) => (
                      <SelectItem key={ex} value={ex}>
                        {ex.charAt(0).toUpperCase() + ex.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* QR Codes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                  <CardDescription>Configure cryptocurrency networks and wallet addresses</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowQrDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Network
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {qrCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment methods configured</p>
              ) : (
                qrCodes.map((qr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{qr.network.toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground truncate">{qr.walletAddress}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveQrCode(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}

              {showQrDialog && (
                <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                  <div>
                    <Label>Network</Label>
                    <Select value={newQr.network} onValueChange={(val) => setNewQr({ ...newQr, network: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {NETWORKS.map((net) => (
                          <SelectItem key={net} value={net}>
                            {net.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Wallet Address</Label>
                    <Input
                      value={newQr.walletAddress}
                      onChange={(e) => setNewQr({ ...newQr, walletAddress: e.target.value })}
                      placeholder="Enter wallet address"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddQrCode}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowQrDialog(false);
                        setNewQr({ network: "", walletAddress: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Tutorials */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Video Tutorials</CardTitle>
                  <CardDescription>Add tutorial links for different exchanges</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowVideoDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tutorial
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {videoTutorials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tutorials configured</p>
              ) : (
                videoTutorials.map((video, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{video.exchange.charAt(0).toUpperCase() + video.exchange.slice(1)}</p>
                      <p className="text-sm text-muted-foreground truncate">{video.videoUrl}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveVideo(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}

              {showVideoDialog && (
                <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                  <div>
                    <Label>Exchange</Label>
                    <Select value={newVideo.exchange} onValueChange={(val) => setNewVideo({ ...newVideo, exchange: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exchange" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXCHANGES.map((ex) => (
                          <SelectItem key={ex} value={ex}>
                            {ex.charAt(0).toUpperCase() + ex.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      value={newVideo.videoUrl}
                      onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddVideo}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowVideoDialog(false);
                        setNewVideo({ exchange: "", videoUrl: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={editInvoice.isPending}>
              {editInvoice.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
