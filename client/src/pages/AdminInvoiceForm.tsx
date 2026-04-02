import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X, Upload, Sparkles } from "lucide-react";

import { CRYPTO_CONFIG, type CryptoCoin } from "../../../shared/const";

const EXCHANGES = ["binance", "coinbase", "bybit", "ndax", "bitget"];

interface QrCodeEntry {
  coin: string;
  network: string;
  walletAddress: string;
  qrCodeFile?: File;
  qrCodePreview?: string; // base64 data URL
}

interface VideoTutorialEntry {
  exchange: string;
  videoUrl: string;
  title?: string;
  description?: string;
}

export default function AdminInvoiceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    serviceType: "virtual" as "virtual" | "onsite" | "custom",
    description: "",
    amountUsd: "",
    dueDate: "",
    exchange: "",
    paymentInstructions: "",
  });

  const [qrCodes, setQrCodes] = useState<QrCodeEntry[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorialEntry[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedExchange, setSelectedExchange] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [newQr, setNewQr] = useState<QrCodeEntry>({ coin: "", network: "", walletAddress: "" });
  const [newVideo, setNewVideo] = useState<VideoTutorialEntry>({ exchange: "", videoUrl: "" });
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);

  const generateDescriptionMutation = trpc.ai.generateInvoiceDescription.useMutation();
  const generateInstructionsMutation = trpc.ai.generatePaymentInstructions.useMutation();

  const handleGenerateDescription = async () => {
    if (!formData.clientName || !formData.serviceType || !formData.amountUsd) {
      toast.error("Please fill in client name, service type, and amount first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const result = await generateDescriptionMutation.mutateAsync({
        clientName: formData.clientName,
        serviceType: formData.serviceType,
        amountUsd: formData.amountUsd,
      });
      const descriptionText = typeof result.description === 'string' ? result.description : '';
      setFormData({ ...formData, description: descriptionText });
      toast.success("Description generated successfully");
    } catch (error) {
      toast.error("Failed to generate description");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleGenerateInstructions = async () => {
    if (!formData.exchange || !formData.amountUsd) {
      toast.error("Please select an exchange and enter amount first");
      return;
    }

    const network = qrCodes.length > 0 ? qrCodes[0].network : "btc";

    setGeneratingInstructions(true);
    try {
      const result = await generateInstructionsMutation.mutateAsync({
        exchange: formData.exchange,
        network,
        amountUsd: formData.amountUsd,
      });
      const instructionsText = typeof result.instructions === 'string' ? result.instructions : '';
      setFormData({ ...formData, paymentInstructions: instructionsText });
      toast.success("Payment instructions generated successfully");
    } catch (error) {
      toast.error("Failed to generate payment instructions");
    } finally {
      setGeneratingInstructions(false);
    }
  };

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully!");
      setFormData({
        clientName: "",
        clientEmail: "",
        serviceType: "virtual",
        description: "",
        amountUsd: "",
        dueDate: "",
        exchange: "",
        paymentInstructions: "",
      });
      setQrCodes([]);
      setVideoTutorials([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const handleAddQrCode = async () => {
    if (!newQr.coin || !newQr.network || !newQr.walletAddress) {
      toast.error("Please fill in coin, network and wallet address");
      return;
    }

    if (newQr.qrCodeFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setQrCodes([...qrCodes, { ...newQr, qrCodePreview: base64 }]);
        setNewQr({ coin: "", network: "", walletAddress: "" });
        setShowQrDialog(false);
        toast.success("QR code added");
      };
      reader.readAsDataURL(newQr.qrCodeFile);
    } else {
      setQrCodes([...qrCodes, { ...newQr, qrCodePreview: undefined }]);
      setNewQr({ coin: "", network: "", walletAddress: "" });
      setShowQrDialog(false);
      toast.success("QR code entry added");
    }
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

  const handleCreateInvoice = async () => {
    if (!formData.clientName || !formData.clientEmail || !formData.amountUsd || !formData.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (qrCodes.length === 0) {
      toast.error("Please add at least one QR code");
      return;
    }

    // Build wallet addresses from QR codes
    const walletAddresses: Record<string, string> = {};
    qrCodes.forEach((qr) => {
      walletAddresses[qr.network] = qr.walletAddress;
    });

    const qrCodesData = qrCodes.map(qr => ({
      coin: qr.coin,
      network: qr.network,
      walletAddress: qr.walletAddress,
      qrCodeUrl: qr.qrCodePreview || undefined,
    }));

    const videosData = videoTutorials.map(v => ({
      exchange: v.exchange,
      videoUrl: v.videoUrl,
      title: v.title,
      description: v.description,
    }));

    await createInvoice.mutateAsync({
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      serviceType: formData.serviceType as "virtual" | "onsite" | "custom",
      description: formData.description,
      amountUsd: formData.amountUsd,
      dueDate: new Date(formData.dueDate),
      exchange: formData.exchange,
      walletAddresses,
      qrCodes: qrCodesData,
      videoTutorials: videosData,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Enter basic invoice information</CardDescription>
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
              <Label>Service Type *</Label>
              <Select value={formData.serviceType} onValueChange={(val) => setFormData({ ...formData, serviceType: val as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virtual">Virtual Bootcamp</SelectItem>
                  <SelectItem value="onsite">Onsite Bootcamp</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (USD) *</Label>
              <Input
                type="number"
                value={formData.amountUsd}
                onChange={(e) => setFormData({ ...formData, amountUsd: e.target.value })}
                placeholder="700.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Primary Exchange</Label>
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={generatingDescription}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingDescription ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Invoice description..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Payment Instructions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateInstructions}
                disabled={generatingInstructions}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingInstructions ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              value={formData.paymentInstructions}
              onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
              placeholder="Special payment instructions for the client..."
            />
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Networks & QR Codes</CardTitle>
              <CardDescription>Add cryptocurrency networks with wallet addresses and QR codes</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowQrDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Network
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No networks added yet</p>
          ) : (
            <div className="space-y-3">
              {qrCodes.map((qr, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex gap-2 mb-1">
                      <Badge variant="outline">{qr.coin}</Badge>
                      <Badge>{qr.network}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono break-all">{qr.walletAddress}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQrCodes(qrCodes.filter((_, i) => i !== idx))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Tutorials Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>Add tutorial links for different exchanges</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowVideoDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tutorial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {videoTutorials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tutorials added yet</p>
          ) : (
            <div className="space-y-3">
              {videoTutorials.map((video, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <Badge>{video.exchange.toUpperCase()}</Badge>
                    <p className="text-sm mt-1">{video.title || "No title"}</p>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      {video.videoUrl}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVideoTutorials(videoTutorials.filter((_, i) => i !== idx))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleCreateInvoice} disabled={createInvoice.isPending} className="w-full">
        {createInvoice.isPending ? "Creating..." : "Create Invoice"}
      </Button>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Network</DialogTitle>
            <DialogDescription>Add a cryptocurrency network with wallet address and QR code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Coin *</Label>
                <Select value={newQr.coin} onValueChange={(val) => setNewQr({ ...newQr, coin: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CRYPTO_CONFIG) as CryptoCoin[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CRYPTO_CONFIG[c].name} ({c})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Network *</Label>
                <Select value={newQr.network} onValueChange={(val) => setNewQr({ ...newQr, network: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {newQr.coin && (CRYPTO_CONFIG[newQr.coin as CryptoCoin].networks as readonly string[]).map((net) => (
                      <SelectItem key={net} value={net}>
                        {net}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Wallet Address *</Label>
              <Input
                value={newQr.walletAddress}
                onChange={(e) => setNewQr({ ...newQr, walletAddress: e.target.value })}
                placeholder="Enter wallet address"
              />
            </div>
            <div>
              <Label>QR Code Image (Optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setNewQr({ ...newQr, qrCodeFile: e.target.files[0] });
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQrDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddQrCode}>Add Network</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Tutorial Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video Tutorial</DialogTitle>
            <DialogDescription>Add a tutorial link for a specific exchange</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Exchange *</Label>
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
              <Label>Video URL *</Label>
              <Input
                value={newVideo.videoUrl}
                onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <div>
              <Label>Title (Optional)</Label>
              <Input
                value={newVideo.title || ""}
                onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                placeholder="Tutorial title"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={newVideo.description || ""}
                onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                placeholder="Tutorial description"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowVideoDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVideo}>Add Tutorial</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
