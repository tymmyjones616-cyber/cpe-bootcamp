import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Globe, Phone, MapPin, Facebook, Video, Image as ImageIcon } from "lucide-react";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { Palette, RotateCcw } from "lucide-react";

const THEME_FIELDS = [
  { id: "primary", label: "Primary Color", description: "Main brand color for buttons and highlights" },
  { id: "background", label: "Background", description: "Main page background color" },
  { id: "foreground", label: "Text Color", description: "Primary text color" },
  { id: "card", label: "Card Color", description: "Background for surfaces and containers" },
  { id: "accent", label: "Accent Color", description: "Secondary brand color for subtle highlights" },
  { id: "border", label: "Border Color", description: "Color for dividers and inputs" },
  { id: "cpe-success-green", label: "Success Green", description: "Color for positive statuses" },
  { id: "cpe-warning-orange", label: "Warning Orange", description: "Color for alerts and warnings" },
  { id: "cpe-error-red", label: "Error Red", description: "Color for errors and destructive actions" },
  { id: "sidebar", label: "Sidebar Background", description: "Background color of the navigation sidebar" },
  { id: "sidebar-foreground", label: "Sidebar Text", description: "Text color inside the sidebar" },
];

const settingsSchema = z.object({
  siteName: z.string().min(1),
  logoUrl: z.string().url().optional().or(z.literal("")),
  supportEmail: z.string().email(),
  supportWhatsapp: z.string().optional(),
  supportPhone: z.string().optional(),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  physicalAddress: z.string().optional(),
  globalTutorialUrl: z.string().url().optional().or(z.literal("")),
  termsText: z.string().optional(),
  privacyText: z.string().optional(),
  themeConfig: z.record(z.string(), z.string()).optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { themeConfig, updateThemeLocally } = useTheme();
  const { data: settings, isLoading } = trpc.cms.getSettings.useQuery();
  const updateSettings = trpc.cms.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      utils.cms.getSettings.invalidate();
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: "CPE Bootcamp",
      supportEmail: "support@cpe-bootcamp.online",
      logoUrl: "",
      supportWhatsapp: "",
      supportPhone: "",
      facebookUrl: "",
      physicalAddress: "5909 State Highway 142 W, Doniphan, MO, United States, 63935",
      globalTutorialUrl: "",
      termsText: "",
      privacyText: "",
      themeConfig: {},
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteName: settings.siteName || "CPE Bootcamp",
        logoUrl: settings.logoUrl || "",
        supportEmail: settings.supportEmail || "",
        supportWhatsapp: settings.supportWhatsapp || "",
        supportPhone: settings.supportPhone || "",
        facebookUrl: settings.facebookUrl || "",
        physicalAddress: settings.physicalAddress || "",
        globalTutorialUrl: settings.globalTutorialUrl || "",
        termsText: settings.termsText || "",
        privacyText: settings.privacyText || "",
        themeConfig: (settings.themeConfig as Record<string, string>) || {},
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsValues) => {
    updateSettings.mutate(values);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 italic text-zinc-500 animate-pulse">Retrieving vault configuration...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Portal Settings</h1>
            <p className="text-muted-foreground text-lg">Control your bootcamp's digital footprint and institutional trust.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Theme Configuration */}
              <Card className="glass border-none shadow-premium col-span-1 md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle>Theme Configuration</CardTitle>
                        <CardDescription>Customize the visual identity of your portal in real-time.</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        form.setValue("themeConfig", {});
                        updateThemeLocally({});
                      }}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Default
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {THEME_FIELDS.map((field) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`themeConfig.${field.id}`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input 
                                  {...formField} 
                                  type="color" 
                                  className="w-12 h-10 p-1 cursor-pointer bg-transparent border-input"
                                  onChange={(e) => {
                                    formField.onChange(e.target.value);
                                    const currentTheme = form.getValues("themeConfig") || {};
                                    updateThemeLocally({ ...currentTheme, [field.id]: e.target.value });
                                  }}
                                />
                                <Input 
                                  {...formField} 
                                  placeholder="#000000"
                                  className="font-mono uppercase"
                                  onChange={(e) => {
                                    formField.onChange(e.target.value);
                                    const currentTheme = form.getValues("themeConfig") || {};
                                    updateThemeLocally({ ...currentTheme, [field.id]: e.target.value });
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">{field.description}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Branding Section */}
              <Card className="glass border-none shadow-premium">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Branding & Identity</CardTitle>
                  </div>
                  <CardDescription>How your platform appears to clients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl><Input {...field} placeholder="CPE Bootcamp" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} placeholder="https://..." />
                            <div className="h-10 w-10 shrink-0 border rounded overflow-hidden p-1 bg-white">
                              {field.value && <img src={field.value} alt="Logo" className="object-contain w-full h-full" />}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>High-resolution logo for invoices.</FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Support Section */}
              <Card className="glass border-none shadow-premium">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <CardTitle>Support & Social</CardTitle>
                  </div>
                  <CardDescription>Contact methods for payment assistance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Page</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Facebook className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input {...field} className="pl-9" placeholder="https://facebook.com/..." />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supportWhatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Phone</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Section */}
            <Card className="glass border-none shadow-premium">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Physical Legitimacy</CardTitle>
                </div>
                <CardDescription>Display your office address to build institutional trust.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Address</FormLabel>
                      <FormControl><Textarea {...field} rows={3} /></FormControl>
                      <FormDescription>Appears in invoice footers and trust sections.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Legal/Content Section */}
            <Card className="glass border-none shadow-premium">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <CardTitle>Global Video Guide</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <FormField
                  control={form.control}
                  name="globalTutorialUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Payment Tutorial (Video Link)</FormLabel>
                      <FormControl><Input {...field} placeholder="https://youtube.com/..." /></FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                     control={form.control}
                     name="termsText"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Terms of Payment (Footer Text)</FormLabel>
                         <FormControl><Textarea {...field} rows={5} /></FormControl>
                       </FormItem>
                     )}
                  />
                  <FormField
                     control={form.control}
                     name="privacyText"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Transaction Privacy Notice</FormLabel>
                         <FormControl><Textarea {...field} rows={5} /></FormControl>
                       </FormItem>
                     )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="px-8 shadow-premium" disabled={updateSettings.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateSettings.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}

