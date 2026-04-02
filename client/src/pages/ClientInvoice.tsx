import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { Copy, Download, AlertCircle, Play, ExternalLink, ShieldCheck, Lock, Clock, Send, ChevronRight, MapPin, Facebook, FileText, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaymentProofModal } from "./PaymentProofModal";
import { motion, AnimatePresence } from "framer-motion";
import html2pdf from 'html2pdf.js';

export default function ClientInvoice() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(16 * 60); // 16 minutes in seconds

  const invoiceQuery = trpc.invoices.getBySlug.useQuery(slug || "");
  const settingsQuery = trpc.cms.getSettings.useQuery();
  const ratesQuery = trpc.exchange.getRates.useQuery(undefined, {
    refetchInterval: 60 * 1000, // Refresh rates every minute
  });

  const qrCodesQuery = trpc.invoices.getQrCodes.useQuery(invoiceQuery.data?.id || 0, {
    enabled: !!invoiceQuery.data?.id,
  });
  const videosQuery = trpc.invoices.getVideoTutorials.useQuery(invoiceQuery.data?.id || 0, {
    enabled: !!invoiceQuery.data?.id,
  });

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 16 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const invoice = invoiceQuery.data;
  const settings = settingsQuery.data;
  const qrCodes = qrCodesQuery.data || [];
  const videoTutorials = videosQuery.data || [];
  const rates = ratesQuery.data;

  // Get the primary QR code configured by admin
  const primaryQrCode = qrCodes.length > 0 ? qrCodes[0] : null;

  const cryptoAmount = useMemo(() => {
    if (!invoice || !primaryQrCode) return "0.00";
    const coin = (primaryQrCode.coin || "usdt").toLowerCase();
    let rate = rates ? (rates[coin] || 1) : 1;
    
    // Explicitly handle USDT/USDC as 1:1 if rate is missing or likely 1.0
    if ((coin.includes("usdt") || coin.includes("usdc")) && (!rate || rate === 0)) {
      rate = 1;
    }
    
    const amount = Number(invoice.amountUsd) / rate;
    const decimals = (coin.includes("usdt") || coin.includes("usdc")) ? 2 : 6;
    
    return isNaN(amount) ? "0.00" : amount.toFixed(decimals);
  }, [invoice, rates, primaryQrCode]);

  if (invoiceQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <img src="/cpe-logo.avif" alt="CPE Logo" className="w-20 h-20 object-contain relative animate-bounce" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium tracking-widest uppercase opacity-70">Securing Session...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return <div className="flex items-center justify-center min-h-screen">Invoice not found</div>;
  if (!primaryQrCode) return <div className="flex items-center justify-center min-h-screen">Payment method not configured</div>;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `Invoice_${invoice.id}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      toast.info("Generating your PDF invoice...");
      const worker = html2pdf().set(opt).from(element);
      await worker.save();
      toast.success("PDF invoice downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const seoSchema = {
    "@context": "https://schema.org",
    "@type": "Invoice",
    "identifier": invoice.id,
    "customer": {
      "@type": "Person",
      "name": invoice.clientName,
      "email": invoice.clientEmail
    },
    "seller": {
      "@type": "Organization",
      "name": settings?.siteName || "CPE BOOTCAMP",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings?.physicalAddress || "5909 State Highway 142 W, Doniphan, MO, 63935"
      }
    },
    "totalPaymentDue": {
      "@type": "PriceSpecification",
      "price": invoice.amountUsd,
      "priceCurrency": "USD"
    },
    "paymentDueDate": invoice.dueDate,
    "paymentStatus": invoice.status
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 font-sans selection:bg-primary/30 pb-20">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-black/40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/5 rounded-lg border border-white/10">
              <img src="/cpe-logo.avif" alt="CPE Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase">{settings?.siteName || "CPE BOOTCAMP"}</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
               SECURE SESSION
             </div>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={handleDownloadPDF} 
               className="text-slate-400 hover:text-white transition-colors"
               title="Download PDF Invoice"
             >
               <Download className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

     <script type="application/ld+json">
        {JSON.stringify(seoSchema)}
      </script>

      <main id="invoice-content" className="max-w-3xl mx-auto px-6 py-12 space-y-10 relative">
        {/* Status & Timer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 glass rounded-2xl border border-white/10 shadow-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Current Market Rate Refresh</p>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-3xl font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="h-px w-full sm:w-px sm:h-12 bg-white/10 mx-2" />
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Payment Status</p>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-1 text-sm font-semibold uppercase tracking-widest animate-pulse">
              {invoice.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Amount & Currency Conversion */}
        <div className="text-center space-y-4">
          <h2 className="text-sm font-semibold text-primary tracking-[0.2em] uppercase">Total Amount Due</h2>
          <div className="relative inline-block">
             <div className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
               <span className="text-3xl font-light opacity-50 mr-1">$</span>
               {invoice.amountUsd}
             </div>
             {cryptoAmount && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-2 text-xl font-medium text-slate-400 flex items-center justify-center gap-2"
               >
                 ≈ {cryptoAmount} {primaryQrCode.coin} ({primaryQrCode.network})
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
               </motion.div>
             )}
          </div>
        </div>

        {/* Dr. Thompson Endorsement Video */}
        <section className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-primary/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500" />
           <Card className="relative bg-black/60 border-white/10 overflow-hidden rounded-[2rem] shadow-2xl backdrop-blur-xl">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
               <div className="md:col-span-3 p-8 space-y-6">
                 <div className="flex items-center gap-3">
                   <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                     <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                     EXECUTIVE ENDORSEMENT
                   </Badge>
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-2xl font-bold text-white leading-tight">
                     Official Message from <span className="text-primary">Dr. Thompson</span>
                   </h3>
                   <p className="text-slate-400 text-sm leading-relaxed">
                     Dr. Thompson highly recommends all candidates to utilize **USDT (Tether)** for secure, instantaneous, and low-fee transaction processing. Watch the briefing below to understand why this is our preferred settlement method.
                   </p>
                 </div>
                 <div className="flex items-center gap-4 py-2">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Instant Verification Enabled</span>
                   </div>
                   {primaryQrCode && primaryQrCode.coin && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-tight">{primaryQrCode.coin}</span>
                    </div>
                  )}
                 </div>
               </div>
               <div className="md:col-span-2 relative h-[300px] md:h-auto bg-slate-900 overflow-hidden">
                 <video 
                   src="/assets/videos/CPE.mp4" 
                   className="absolute inset-0 w-full h-full object-cover opacity-80"
                   controls
                   controlsList="nodownload"
                   onContextMenu={(e) => e.preventDefault()}
                   poster="/assets/images/video-poster.jpg"
                 >
                   Your browser does not support the video tag.
                 </video>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                 <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none">
                    <Play className="w-4 h-4 text-white fill-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">DR. THOMPSON briefing</span>
                 </div>
               </div>
             </div>
           </Card>
        </section>

        {/* Master Payment Card */}
        <Card className="bg-white/5 border-white/10 overflow-hidden shadow-2xl rounded-3xl">
          <div className="bg-gradient-to-r from-primary/20 to-blue-600/20 px-8 py-6 border-b border-white/10 flex items-center justify-between">
             <div className="space-y-1">
               <CardTitle className="text-xl font-bold text-white">Payment Method Details</CardTitle>
               <CardDescription className="text-slate-400">Locked network: <span className="text-primary font-bold">{primaryQrCode.network.toUpperCase()}</span></CardDescription>
             </div>
             <Lock className="w-6 h-6 text-white/30" />
          </div>
          <CardContent className="p-8 space-y-10">
            {/* QR Section */}
            <div className="flex flex-col md:flex-row gap-10 items-center">
              {primaryQrCode.qrCodeUrl && (
                <div className="relative group p-4 bg-white rounded-2xl shadow-inner-xl flex-shrink-0">
                  <img src={primaryQrCode.qrCodeUrl} alt="Payment QR" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                  <div className="absolute inset-x-0 -bottom-3 flex justify-center">
                    <Badge variant="secondary" className="bg-slate-900 border-white/20 text-[10px] sm:text-xs">SCAN TO PAY</Badge>
                  </div>
                </div>
              )}
              
              <div className="flex-1 space-y-6 w-full">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    Official Receiving Address
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </label>
                  <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                    <div className="relative flex items-center gap-3 bg-black/60 p-4 rounded-xl border border-white/10">
                      <code className="flex-1 text-sm sm:text-base font-mono break-all text-white selection:bg-primary/50">
                        {primaryQrCode.walletAddress}
                      </code>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="bg-white/10 hover:bg-white/20 border-white/10"
                        onClick={() => handleCopy(primaryQrCode.walletAddress, "Address")}
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">Verify every character twice before sending. We are not responsible for funds sent to wrong addresses.</p>
                </div>

                <div className="flex overflow-hidden rounded-xl border border-white/5 bg-white/5">
                  <div className="flex-1 p-4 border-r border-white/5 flex flex-col gap-1 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Network</span>
                    <span className="text-sm font-bold text-primary">{primaryQrCode.network.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 p-4 border-r border-white/5 flex flex-col gap-1 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Exchange</span>
                    <span className="text-sm font-bold text-slate-200">{invoice.exchange || "ANY"}</span>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-1 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Fee Policy</span>
                    <span className="text-sm font-bold text-emerald-400">Zero Tax</span>
                  </div>
                </div>
              </div>
            </div>

            <Alert className="bg-red-500/10 border-red-500/20 text-red-200 py-4">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-xs leading-relaxed">
                IMPORTANT: Transfer precisely <strong>{cryptoAmount || invoice.amountUsd} {primaryQrCode.coin}</strong>. Transmitting on any network other than <strong>{primaryQrCode.network}</strong> (using {primaryQrCode.coin}) will cause permanent loss of funds.
              </AlertDescription>
            </Alert>

            <Button 
              size="lg" 
              className="w-full h-16 text-lg font-bold shadow-premium-lg group relative overflow-hidden"
              onClick={() => setShowPaymentModal(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 group-hover:scale-105 transition-transform" />
              <div className="relative flex items-center justify-center gap-3">
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                CONFIRM TRANSACTION SUBMISSION
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Video Tutorials */}
        {videoTutorials.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Institutional Guidance</h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {videoTutorials.map((video: any) => (
                 <a key={video.id} href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="block group">
                   <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                     <CardContent className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                           <Play className="w-5 h-5 text-primary fill-primary group-hover:scale-110 transition-transform" />
                         </div>
                         <div>
                           <div className="text-sm font-bold text-white uppercase">{video.exchange} Guide</div>
                           <p className="text-xs text-slate-500">Step-by-step tutorial</p>
                         </div>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
                     </CardContent>
                   </Card>
                 </a>
               ))}
            </div>
          </section>
        )}

        {/* Trust & Ethics (Physical Address) */}
        <footer className="pt-20 border-t border-white/5 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Global Support</h4>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                Our management team is available 24/7 to assist with payment verification and crypto technical support.
              </p>
              <div className="space-y-3 pt-2">
                <a href={`mailto:${settings?.supportEmail || "support@cpe-bootcamp.online"}`} className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center"><Send className="w-3.5 h-3.5" /></div>
                  {settings?.supportEmail}
                </a>
                {settings?.supportWhatsapp && (
                  <a href={`https://wa.me/${settings.supportWhatsapp.replace(/[^0-9]/g, "")}`} className="flex items-center gap-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-emerald-500/20 flex items-center justify-center"><span>💬</span></div>
                    Direct WhatsApp Concierge
                  </a>
                )}
                {settings?.facebookUrl && (
                  <a href={settings.facebookUrl} className="flex items-center gap-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-blue-500/20 flex items-center justify-center"><Facebook className="w-3.5 h-3.5" /></div>
                    Official Facebook Page
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Office Headquarters</h4>
              <div className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <MapPin className="w-6 h-6 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-200">
                    {settings?.physicalAddress || "5909 State Highway 142 W,\nDoniphan, MO, 63935"}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Verified Physical Location • United States</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold">VISA</div>
                   <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold">MC</div>
                   <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold">BTC</div>
                </div>
                <span className="text-[10px] text-slate-600 font-bold uppercase">Multicurrency Compliance</span>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-4 pt-10">
            <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-relaxed">
              {settings?.termsText || "Payments are processed through secure military-grade encryption. By proceeding, you agree to our digital service terms. All crypto transactions are final once confirmed on-chain."}
            </p>
            <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
              <button className="hover:text-primary">Privacy Policy</button>
              <button className="hover:text-primary">Terms of Service</button>
              <button className="hover:text-primary">AML Policy</button>
            </div>
          </div>
        </footer>
      </main>

      {/* Payment Proof Modal */}
      <PaymentProofModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        invoiceSlug={slug || ""}
        exchangeUsed={invoice.exchange || "Default"}
        cryptoNetwork={primaryQrCode.network}
        onSuccess={() => {
          setShowPaymentModal(false);
          invoiceQuery.refetch();
        }}
      />
    </div>
  );
}
