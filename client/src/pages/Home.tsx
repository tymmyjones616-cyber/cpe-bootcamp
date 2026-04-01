import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/cpe-logo.avif" alt="CPE Logo" className="h-10" />
            <div>
              <h1 className="font-bold text-lg">CPE Bootcamp</h1>
              <p className="text-xs text-muted-foreground">Invoice & Payment System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Button onClick={() => navigate("/admin")}>Admin Dashboard</Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Login as Admin</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Professional Invoice & Payment Management</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Streamline your cryptocurrency payments with our secure, professional invoice system. Support for BTC, USDT, ETH, USDC and more.
              </p>
            </div>

            <div className="space-y-3">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => navigate("/admin")} className="w-full">
                    Go to Admin Dashboard
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">Manage invoices, verify payments, and configure wallets</p>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="w-full">
                    <a href={getLoginUrl()}>Login to Admin Portal</a>
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">Sign in with your credentials to manage invoices</p>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Multi-Network Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Accept payments in BTC, USDT (TRC-20, ERC-20), ETH, and USDC across multiple blockchain networks.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">QR Code Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Generate QR codes for each payment method. Clients can scan and pay directly from their wallets.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manual Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Review payment proofs, verify transactions, and approve or reject payments with detailed audit logs.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Professional Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Medical-grade aesthetic with clean typography, professional invoices, and seamless user experience.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Example Invoice Section */}
        <div className="mt-16 pt-16 border-t">
          <h3 className="text-2xl font-bold mb-8">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h4 className="font-semibold mb-2">Create Invoice</h4>
              <p className="text-sm text-muted-foreground">Admin creates invoice with client details and amount</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h4 className="font-semibold mb-2">Share Link</h4>
              <p className="text-sm text-muted-foreground">Send unique payment link to client</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h4 className="font-semibold mb-2">Client Pays</h4>
              <p className="text-sm text-muted-foreground">Client selects network and submits payment proof</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold">4</div>
              <h4 className="font-semibold mb-2">Verify & Confirm</h4>
              <p className="text-sm text-muted-foreground">Admin verifies and marks invoice as paid</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CPE Bootcamp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
