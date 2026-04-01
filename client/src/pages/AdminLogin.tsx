import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AdminLogin() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    document.title = "Admin Login - CPE Bootcamp Invoice Management System";
    
    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Secure admin login for CPE Bootcamp Invoice & Payment Management System. Manage cryptocurrency invoices and track payment proofs.');

    // Set meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', 'invoice management, cryptocurrency payments, admin portal, CPE bootcamp');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img src="/cpe-logo.avif" alt="CPE Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold">CPE Bootcamp</h1>
          <h2 className="text-lg font-semibold text-muted-foreground">Invoice & Payment Management System</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Admin access only. Sign in to manage invoices and track cryptocurrency payments.
            </p>
          </div>

          <Button size="lg" asChild className="w-full">
            <a href={getLoginUrl()}>Sign In as Admin</a>
          </Button>

          <div className="pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Only authorized administrators can access this system.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
