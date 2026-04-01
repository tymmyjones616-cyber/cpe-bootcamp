import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, LogIn, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLogin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/admin";
    },
    onError: (err: any) => {
      setError(err.message || "Authentication failed. Please check your credentials.");
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    loginMutation.mutate({ email, password });
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    document.title = "Secure Access | CPE Billing Portal";
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_200_200%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noiseFilter%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.65%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 px-6"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 flex items-center justify-center mb-6 relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <img src="/cpe-logo.avif" alt="CPE Logo" className="w-16 h-16 object-contain relative z-10" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white tracking-tight mb-2 tracking-[-0.03em]"
          >
            CPE Billing Portal
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-500 text-sm font-medium"
          >
            Administrative Control Center
          </motion.p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[28px] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider ml-1">
                  Email Identity
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@cpe-bootcamp.online" 
                    className="h-12 bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl pl-11 text-white placeholder:text-zinc-700 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider ml-1">
                  Secure Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="h-12 bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-xl pl-11 text-white placeholder:text-zinc-700 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                >
                  <p className="text-xs text-red-400 font-medium text-center">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all flex items-center justify-center group active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
            <span className="w-8 h-[1px] bg-zinc-800" />
            Verified Security
            <span className="w-8 h-[1px] bg-zinc-800" />
          </div>
          <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
            Unauthorized access is strictly prohibited and subject to legal action.<br />
            © {new Date().getFullYear()} CPE Bootcamp. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
