import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createInvoice, listInvoices, getInvoiceBySlug, updateInvoiceStatus, createPaymentProof, getPaymentProofsByInvoiceId, updatePaymentProofStatus, listWalletConfigs, upsertWalletConfig, listFaqItems, createAuditLog, getInvoiceById, listPendingPaymentProofs, getPaymentProofsWithInvoices, getPaymentProofById, getInvoiceQrCodes, getInvoiceVideoTutorials, deleteInvoice, getInvoiceByNumber, createInvoiceQrCode, createInvoiceVideoTutorial, updateInvoice, deleteInvoiceQrCode, deleteInvoiceVideoTutorial, getSiteSettings, updateSiteSettings, getUserByOpenId } from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { fetchCryptoRates } from "./services/exchange";
import { sendInvoiceEmail, sendPaymentProofNotification, sendPaymentStatusUpdate } from "./services/email";
import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[AUTH] Login attempt for: ${input.email}`);
        
        try {
          const user = await getUserByOpenId(input.email);
          
          if (!user || user.role !== "admin") {
            console.warn(`[AUTH] User not found or not admin: ${input.email}`);
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid credentials or unauthorized',
            });
          }

          if (!user.password) {
            console.warn(`[AUTH] User has no password set: ${input.email}`);
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Account not configured for password login',
            });
          }

          console.log(`[AUTH] User found, comparing password...`);
          const isValid = await bcrypt.compare(input.password, user.password);
          if (!isValid) {
            console.warn(`[AUTH] Password mismatch for: ${input.email}`);
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid credentials',
            });
          }

          console.log(`[AUTH] Login successful for: ${input.email}. Generating token...`);
          const token = await sdk.createSessionToken(user.openId, {
            name: user.name || user.email || ""
          });

          const cookieOptions = getSessionCookieOptions(ctx.req as any);
          ctx.res.cookie(COOKIE_NAME, token, { 
            ...cookieOptions,
            maxAge: ONE_YEAR_MS 
          });

          console.log(`[AUTH] Session cookie set for: ${input.email}`);
          return { success: true };
        } catch (err: any) {
          console.error(`[AUTH] Login error for ${input.email}:`, err);
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Authentication failed',
          });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req as any);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions });
      return {
        success: true,
      } as const;
    }),
  }),

  invoices: router({
    create: protectedProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientEmail: z.string().email(),
        serviceType: z.enum(["virtual", "onsite", "custom"]),
        description: z.string(),
        amountUsd: z.string(),
        dueDate: z.date(),
        walletAddresses: z.record(z.string(), z.string()),
        exchange: z.string().optional(),
        qrCodes: z.array(z.object({
          coin: z.string().optional().default("USDT"),
          network: z.string(),
          walletAddress: z.string(),
          qrCodeUrl: z.string().optional(),
        })).optional(),
        videoTutorials: z.array(z.object({
          exchange: z.string(),
          videoUrl: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const invoiceNumber = `CPE-INV-${String(Date.now()).slice(-5)}`;
        const slugBase = input.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const uniqueSlug = `${slugBase || 'invoice'}-${nanoid(6)}`;
        
        const invoiceResult = await createInvoice({
          invoiceNumber,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          serviceType: input.serviceType as any,
          description: input.description,
          amountUsd: input.amountUsd as any,
          dueDate: input.dueDate,
          walletAddresses: input.walletAddresses,
          exchange: input.exchange,
          selectedNetwork: input.qrCodes?.[0]?.network, // Default to first selected network
          selectedWalletAddress: input.qrCodes?.[0]?.walletAddress,
          selectedExchange: input.exchange,
          selectedVideoUrl: input.videoTutorials?.[0]?.videoUrl,
          uniqueSlug,
          status: "pending",
        });

        const invoice = await getInvoiceByNumber(invoiceNumber);
        if (invoice && input.qrCodes && input.qrCodes.length > 0) {
          for (const qr of input.qrCodes) {
            let finalQrCodeUrl = qr.qrCodeUrl;
            
            // If QR code is a base64 data URL, upload it to S3
            if (finalQrCodeUrl && finalQrCodeUrl.startsWith('data:')) {
              try {
                // Convert base64 data URL to buffer
                const base64Data = finalQrCodeUrl.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Upload to S3
                const uploadResult = await storagePut(
                  `qr-codes/${invoice.id}/${qr.network}-${Date.now()}.png`,
                  buffer,
                  'image/png'
                );
                finalQrCodeUrl = uploadResult.url;
              } catch (error) {
                console.error('Failed to upload QR code to S3:', error);
                // Fall back to storing the data URL if upload fails
              }
            }
            
            await createInvoiceQrCode({
              invoiceId: invoice.id,
              coin: qr.coin,
              network: qr.network,
              walletAddress: qr.walletAddress,
              qrCodeUrl: finalQrCodeUrl,
            });
          }
        }

        if (invoice && input.videoTutorials && input.videoTutorials.length > 0) {
          for (const video of input.videoTutorials) {
            await createInvoiceVideoTutorial({
              invoiceId: invoice.id,
              exchange: video.exchange,
              videoUrl: video.videoUrl,
              title: video.title,
              description: video.description,
            });
          }
        }

        // These are important but should not block invoice creation success if unconfigured
        try {
          await sendInvoiceEmail(
            input.clientEmail,
            input.clientName,
            invoiceNumber,
            input.amountUsd,
            `${process.env.APP_URL || ''}/invoice/${uniqueSlug}`
          );
        } catch (error) {
          console.warn("Failed to send invoice email:", error);
        }

        try {
          await notifyOwner({
            title: "New Invoice Created",
            content: `Invoice ${invoiceNumber} created for ${input.clientName} - $${input.amountUsd}`,
          });
        } catch (error) {
          console.warn("Failed to notify owner:", error);
        }

        return { invoiceNumber, uniqueSlug };
      }),

    list: protectedProcedure
      .query(async () => {
        return await listInvoices();
      }),

    getBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return await getInvoiceBySlug(input);
      }),

    getById: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getInvoiceById(input);
      }),

    getQrCodes: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getInvoiceQrCodes(input);
      }),

    getVideoTutorials: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getInvoiceVideoTutorials(input);
      }),

    edit: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional(),
        amountUsd: z.string().optional(),
        dueDate: z.date().optional(),
        description: z.string().optional(),
        exchange: z.string().optional(),
        walletAddresses: z.record(z.string(), z.string()).optional(),
        qrCodes: z.array(z.object({
          coin: z.string().optional().default("USDT"),
          network: z.string(),
          walletAddress: z.string(),
          qrCodeUrl: z.string().optional(),
        })).optional(),
        videoTutorials: z.array(z.object({
          exchange: z.string(),
          videoUrl: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const invoice = await getInvoiceById(input.id);
        if (!invoice) throw new Error("Invoice not found");

        const updateData: any = {};
        if (input.clientName) updateData.clientName = input.clientName;
        if (input.clientEmail) updateData.clientEmail = input.clientEmail;
        if (input.amountUsd) updateData.amountUsd = input.amountUsd;
        if (input.dueDate) updateData.dueDate = input.dueDate;
        if (input.description) updateData.description = input.description;
        if (input.exchange) updateData.exchange = input.exchange;
        if (input.walletAddresses) updateData.walletAddresses = input.walletAddresses;

        await updateInvoice(input.id, updateData);

        // Update QR codes if provided
        if (input.qrCodes) {
          const existingQrCodes = await getInvoiceQrCodes(input.id);
          for (const existing of existingQrCodes) {
            await deleteInvoiceQrCode(existing.id);
          }
          for (const qr of input.qrCodes) {
            await createInvoiceQrCode({
              invoiceId: input.id,
              coin: qr.coin,
              network: qr.network,
              walletAddress: qr.walletAddress,
              qrCodeUrl: qr.qrCodeUrl,
            });
          }
        }

        // Update video tutorials if provided
        if (input.videoTutorials) {
          const existingVideos = await getInvoiceVideoTutorials(input.id);
          for (const existing of existingVideos) {
            await deleteInvoiceVideoTutorial(existing.id);
          }
          for (const video of input.videoTutorials) {
            await createInvoiceVideoTutorial({
              invoiceId: input.id,
              exchange: video.exchange,
              videoUrl: video.videoUrl,
              title: video.title,
              description: video.description,
            });
          }
        }

        await createAuditLog({
          invoiceId: input.id,
          action: "invoice_edited",
          details: JSON.stringify({ updated: Object.keys(updateData) }),
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const invoice = await getInvoiceById(input);
        if (!invoice) throw new Error("Invoice not found");
        
        // Soft delete
        await updateInvoice(input, { isDeleted: true } as any);
        
        await createAuditLog({
          invoiceId: input,
          action: "deleted",
          performedBy: ctx.user?.id,
          details: "Invoice marked as deleted by admin",
        });
        
        return { success: true };
      }),
  }),

  paymentProofs: router({
    listPending: protectedProcedure
      .query(async () => {
        const proofs = await listPendingPaymentProofs();
        const result = [];
        for (const proof of proofs) {
          const invoice = await getInvoiceById(proof.invoiceId);
          result.push({ proof, invoice });
        }
        return result;
      }),

    getWithInvoices: protectedProcedure
      .query(async () => {
        return await getPaymentProofsWithInvoices();
      }),

    getByInvoiceId: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getPaymentProofsByInvoiceId(input);
      }),

    approve: protectedProcedure
      .input(z.object({
        proofId: z.number(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const proof = await getPaymentProofById(input.proofId);
        if (!proof) throw new Error("Payment proof not found");
        
        const invoice = await getInvoiceById(proof.invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        await updatePaymentProofStatus(input.proofId, "approved", ctx.user?.id, undefined, input.adminNotes);
        await updateInvoiceStatus(invoice.id, "paid");
        await createAuditLog({
          invoiceId: invoice.id,
          action: "approved",
          performedBy: ctx.user?.id,
          details: `Payment proof approved. ${input.adminNotes || ""}`,
        });

        const appUrl = process.env.APP_URL || '';
        try {
          await sendPaymentStatusUpdate(
            invoice.clientEmail,
            invoice.clientName,
            invoice.invoiceNumber,
            'approved'
          );
        } catch (error) {
          console.warn("Failed to send payment status update email:", error);
        }

        try {
          await notifyOwner({
            title: "Payment Approved",
            content: `Invoice ${invoice.invoiceNumber} payment has been approved. Client: ${invoice.clientName}`,
          });
        } catch (error) {
          console.warn("Failed to notify owner:", error);
        }

        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({
        proofId: z.number(),
        reason: z.string(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const proof = await getPaymentProofById(input.proofId);
        if (!proof) throw new Error("Payment proof not found");
        
        const invoice = await getInvoiceById(proof.invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        await updatePaymentProofStatus(input.proofId, "rejected", ctx.user?.id, input.reason, input.adminNotes);
        await createAuditLog({
          invoiceId: invoice.id,
          action: "rejected",
          performedBy: ctx.user?.id,
          details: `Payment proof rejected. Reason: ${input.reason}. ${input.adminNotes || ""}`,
        });

        try {
          await sendPaymentStatusUpdate(
            invoice.clientEmail,
            invoice.clientName,
            invoice.invoiceNumber,
            'rejected',
            input.reason
          );
        } catch (error) {
          console.warn("Failed to send payment status update email (rejected):", error);
        }

        try {
          await notifyOwner({
            title: "Payment Rejected",
            content: `Invoice ${invoice.invoiceNumber} payment has been rejected. Reason: ${input.reason}`,
          });
        } catch (error) {
          console.warn("Failed to notify owner:", error);
        }

        return { success: true };
      }),

    submit: publicProcedure
      .input(z.object({
        invoiceSlug: z.string(),
        imageBase64: z.string(),
        transactionId: z.string(),
        exchangeUsed: z.string(),
        cryptoNetwork: z.string(),
        clientNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const invoice = await getInvoiceBySlug(input.invoiceSlug);
        if (!invoice) throw new Error("Invoice not found");

        const buffer = Buffer.from(input.imageBase64, "base64");
        const fileKey = `payment-proofs/${invoice.id}-${nanoid()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");

        await createPaymentProof({
          invoiceId: invoice.id,
          imageUrl: url,
          imageKey: fileKey,
          transactionId: input.transactionId,
          exchangeUsed: input.exchangeUsed,
          cryptoNetwork: input.cryptoNetwork,
          clientNotes: input.clientNotes,
          status: "pending",
        });

        await updateInvoiceStatus(invoice.id, "under_review");
        await createAuditLog({
          invoiceId: invoice.id,
          action: "payment_submitted",
          details: `Payment proof submitted via ${input.exchangeUsed}`,
        });

        try {
          await sendPaymentProofNotification(
            process.env.ADMIN_EMAIL || 'admin@cpe-bootcamp.online',
            invoice.clientName,
            invoice.invoiceNumber
          );
        } catch (error) {
          console.warn("Failed to send payment proof notification email:", error);
        }

        try {
          await notifyOwner({
            title: "Payment Proof Received",
            content: `Payment proof received for invoice ${invoice.invoiceNumber}. Awaiting verification.`,
          });
        } catch (error) {
          console.warn("Failed to notify owner:", error);
        }

        return { success: true };
      }),
  }),

  ai: router({
    generateInvoiceDescription: protectedProcedure
      .input(z.object({
        clientName: z.string(),
        serviceType: z.enum(["virtual", "onsite", "custom"]),
        amountUsd: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("AI services are currently unavailable (Missing API Key). Please enter the description manually.");
        }
        
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a professional invoice description writer for CPE Bootcamp. Generate concise, professional invoice descriptions.",
              },
              {
                role: "user",
                content: `Generate a professional invoice description for a CPE Bootcamp ${input.serviceType} bootcamp for client ${input.clientName}. Amount: $${input.amountUsd}. Keep it to 2-3 sentences.`,
              },
            ],
          });

          const description = response.choices[0]?.message.content || "";
          return { description };
        } catch (error) {
          console.error("AI service error:", error);
          throw new Error("Failed to generate description with AI. Please try again or enter manually.");
        }
      }),

    generatePaymentInstructions: protectedProcedure
      .input(z.object({
        exchange: z.string(),
        network: z.string(),
        amountUsd: z.string(),
      }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for cryptocurrency payment instructions. Generate clear, step-by-step payment instructions.",
            },
            {
              role: "user",
              content: `Generate payment instructions for sending $${input.amountUsd} USD worth of crypto via ${input.exchange} on the ${input.network} network. Keep it concise (3-4 sentences) and beginner-friendly.`,
            },
          ],
        });

        const instructions = response.choices[0]?.message.content || "";
        return { instructions };
      }),
  }),

  exchange: router({
    getRates: publicProcedure.query(async () => {
      return await fetchCryptoRates();
    }),
  }),

  analytics: router({
    getMetrics: protectedProcedure.query(async () => {
      const invoicesList = await listInvoices();
      const proofs = await getPaymentProofsWithInvoices();

      const totalRevenue = invoicesList
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.amountUsd), 0);

      const pendingCount = proofs.filter((p: any) => p.proof.status === 'pending').length;
      const successRate = invoicesList.length > 0 
        ? (invoicesList.filter((inv: any) => inv.status === 'paid').length / invoicesList.length) * 100 
        : 0;

      return {
        totalRevenue,
        pendingCount,
        successRate: Math.round(successRate),
        totalInvoices: invoicesList.length,
      };
    }),
  }),

  cms: router({
    getSettings: publicProcedure.query(async () => {
      return await getSiteSettings();
    }),
    updateSettings: protectedProcedure
      .input(z.object({
        logoUrl: z.string().optional(),
        siteName: z.string().optional(),
        supportEmail: z.string().optional(),
        supportWhatsapp: z.string().optional(),
        supportPhone: z.string().optional(),
        facebookUrl: z.string().optional(),
        physicalAddress: z.string().optional(),
        termsText: z.string().optional(),
        privacyText: z.string().optional(),
        globalTutorialUrl: z.string().optional(),
        themeConfig: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        await updateSiteSettings(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
