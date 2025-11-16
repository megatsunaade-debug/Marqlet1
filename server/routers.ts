import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { ONE_YEAR_MS } from "@shared/const";

async function getClientByTokenOrThrow(token: string) {
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Client token is required" });
  }
  const { getClientByToken } = await import("./db");
  const client = await getClientByToken(token);
  if (!client) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid client token" });
  }
  return client;
}

async function ensureCaseBelongsToUser(caseId: number, userId: number) {
  const { getCaseById } = await import("./db");
  const caseData = await getCaseById(caseId);
  if (!caseData || caseData.userId !== userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Case not found" });
  }
  return caseData;
}

async function ensureCaseBelongsToToken(caseId: number, token: string) {
  const client = await getClientByTokenOrThrow(token);
  const { getCaseById } = await import("./db");
  const caseData = await getCaseById(caseId);
  if (!caseData || caseData.clientId !== client.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid case for client" });
  }
  return { caseData, client };
}

async function ensureTaskBelongsToUser(taskId: number, userId: number) {
  const { getCaseTaskById } = await import("./db");
  const task = await getCaseTaskById(taskId);
  if (!task || task.userId !== userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Task not found" });
  }
  return task;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("dev-auth", { path: "/", sameSite: "lax" });
      return {
        success: true,
      } as const;
    }),
    devLogin: publicProcedure.mutation(({ ctx }) => {
      if (ENV.isProduction) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Dev login is not available in production",
        });
      }
      ctx.res.cookie("dev-auth", "1", { path: "/", sameSite: "lax" });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        const { getUserByOpenId, upsertUser } = await import("./db");
        const { sdk } = await import("./_core/sdk");

        const existing = await getUserByOpenId(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }

        const passwordHash = await sdk.hashPassword(input.password);
        await upsertUser({
          openId: input.email,
          name: input.name,
          email: input.email,
          loginMethod: "local",
          passwordHash,
          lastSignedIn: new Date(),
        });
        return { success: true };
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getUserByOpenId } = await import("./db");
        const { sdk } = await import("./_core/sdk");
        const user = await getUserByOpenId(input.email);
        if (!user || !(await sdk.verifyPassword(input.password, user.passwordHash ?? null))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        const token = await sdk.signSession({
          openId: user.openId,
          appId: ENV.appId,
          name: user.name ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS / 1000,
        });
        return { success: true };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        phone: z.string().min(8).max(32).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateUser } = await import("./db");
        await updateUser(ctx.user.id, { phone: input.phone });
        return { success: true };
      }),
    saveWhatsappSettings: protectedProcedure
      .input(z.object({
        token: z.string().min(10),
        phoneId: z.string().min(5),
        apiUrl: z.string().url().optional(),
        fromNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { upsertWhatsappSettings } = await import("./db");
        await upsertWhatsappSettings({
          userId: ctx.user.id,
          token: input.token,
          phoneId: input.phoneId,
          apiUrl: input.apiUrl ?? "https://graph.facebook.com/v18.0",
          fromNumber: input.fromNumber,
        });
        return { success: true };
      }),
    getWhatsappSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getWhatsappSettingsByUserId } = await import("./db");
      return getWhatsappSettingsByUserId(ctx.user.id);
    }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getClientsByUserId } = await import("./db");
      return getClientsByUserId(ctx.user.id);
    }),
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getClientByToken } = await import("./db");
        return getClientByToken(input.token);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createClient } = await import("./db");
        return createClient({ ...input, userId: ctx.user.id });
      }),
  }),

  cases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getCasesByUserId } = await import("./db");
      return getCasesByUserId(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getCaseById } = await import("./db");
        return getCaseById(input.id);
      }),
    getByClient: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const client = await getClientByTokenOrThrow(input.token);
        const { getCasesByClientId } = await import("./db");
        return getCasesByClientId(client.id);
      }),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        processNumber: z.string().optional(),
        court: z.string().optional(),
        filingDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createCase } = await import("./db");
        return createCase({ ...input, userId: ctx.user.id });
      }),
    updateStatus: protectedProcedure
      .input(z.object({ 
        id: z.number(),
        status: z.enum(['active', 'won', 'lost', 'archived'])
      }))
      .mutation(async ({ input }) => {
        const { updateCaseStatus } = await import("./db");
        return updateCaseStatus(input.id, input.status);
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { getMessagesByCaseId } = await import("./db");
        return getMessagesByCaseId(input.caseId);
      }),
    listForPortal: publicProcedure
      .input(z.object({ caseId: z.number(), token: z.string() }))
      .query(async ({ input }) => {
        await ensureCaseBelongsToToken(input.caseId, input.token);
        const { getMessagesByCaseId } = await import("./db");
        return getMessagesByCaseId(input.caseId);
      }),
    countUnread: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUnreadMessagesCount } = await import("./db");
        return getUnreadMessagesCount(ctx.user.id);
      }),
    markAsRead: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { markMessagesAsRead } = await import("./db");
        return markMessagesAsRead(input.caseId);
      }),
    send: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { createMessage } = await import("./db");
        return createMessage({
          caseId: input.caseId,
          senderId: ctx.user.id,
          senderType: "lawyer",
          content: input.content,
        });
      }),
    sendFromPortal: publicProcedure
      .input(z.object({
        caseId: z.number(),
        token: z.string(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { createMessage } = await import("./db");
        const { client, caseData } = await ensureCaseBelongsToToken(input.caseId, input.token);
        return createMessage({
          caseId: caseData.id,
          senderId: client.id,
          senderType: "client",
          content: input.content,
        });
      }),
  }),

  documents: router({
    list: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { getDocumentsByCaseId } = await import("./db");
        return getDocumentsByCaseId(input.caseId);
      }),
    listForPortal: publicProcedure
      .input(z.object({ caseId: z.number(), token: z.string() }))
      .query(async ({ input }) => {
        await ensureCaseBelongsToToken(input.caseId, input.token);
        const { getDocumentsByCaseId } = await import("./db");
        return getDocumentsByCaseId(input.caseId);
      }),
    upload: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { uploadDocument } = await import("./db");
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        return uploadDocument({
          caseId: input.caseId,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileData: input.fileData,
          mimeType: input.mimeType,
          description: input.description,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteDocument } = await import("./db");
        return deleteDocument(input.id);
      }),
  }),

  fees: router({
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        totalAmount: z.number(),
        paymentType: z.enum(["cash", "installments"]),
        installmentsCount: z.number().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createFee, getCaseById } = await import("./db");
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        
        // Criar honorário
        const fee = await createFee({
          ...input,
          userId: ctx.user.id,
        });
        
        // Se for parcelado, criar as parcelas
        if (input.paymentType === "installments" && input.installmentsCount > 1) {
          const { createInstallment } = await import("./db");
          const caseData = await getCaseById(input.caseId);
          if (!caseData) throw new Error("Case not found");
          
          const installmentAmount = Math.floor(input.totalAmount / input.installmentsCount);
          const remainder = input.totalAmount - (installmentAmount * input.installmentsCount);
          
          for (let i = 1; i <= input.installmentsCount; i++) {
            const amount = i === 1 ? installmentAmount + remainder : installmentAmount;
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i - 1);
            
            await createInstallment({
              feeId: fee.id,
              caseId: input.caseId,
              clientId: caseData.clientId,
              installmentNumber: i,
              amount,
              dueDate,
              status: "pending",
            });
          }
        } else {
          // Criar uma única parcela para pagamento à vista
          const { createInstallment, getCaseById } = await import("./db");
          const caseData = await getCaseById(input.caseId);
          if (!caseData) throw new Error("Case not found");
          
          await createInstallment({
            feeId: fee.id,
            caseId: input.caseId,
            clientId: caseData.clientId,
            installmentNumber: 1,
            amount: input.totalAmount,
            dueDate: new Date(),
            status: "pending",
          });
        }
        
        return fee;
      }),
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { getFeesByCaseId } = await import("./db");
        return getFeesByCaseId(input.caseId);
      }),
    listByUser: protectedProcedure
      .query(async ({ ctx }) => {
        const { getFeesByUserId } = await import("./db");
        return getFeesByUserId(ctx.user.id);
      }),
  }),

  installments: router({
    listByFee: protectedProcedure
      .input(z.object({ feeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getInstallmentsByFeeId } = await import("./db");
        const installments = await getInstallmentsByFeeId(input.feeId);
        const caseId = installments[0]?.caseId;
        if (caseId) {
          await ensureCaseBelongsToUser(caseId, ctx.user.id);
        }
        return installments;
      }),
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getClientById, getInstallmentsByClientId } = await import("./db");
        const client = await getClientById(input.clientId);
        if (!client || client.userId !== ctx.user.id) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Client not found" });
        }
        return getInstallmentsByClientId(input.clientId);
      }),
    listForPortal: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const client = await getClientByTokenOrThrow(input.token);
        const { getInstallmentsByClientId } = await import("./db");
        return getInstallmentsByClientId(client.id);
      }),
    listByUser: protectedProcedure
      .query(async ({ ctx }) => {
        const { getInstallmentsByUserId } = await import("./db");
        return getInstallmentsByUserId(ctx.user.id);
      }),
    markAsPaid: protectedProcedure
      .input(z.object({
        id: z.number(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateInstallmentStatus } = await import("./db");
        return updateInstallmentStatus(input.id, "paid", new Date(), input.paymentMethod);
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const { updateInstallmentStatus } = await import("./db");
        return updateInstallmentStatus(input.id, input.status);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number().optional(),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const { updateInstallment } = await import("./db");
        return updateInstallment(id, data);
      }),
  }),

  publications: router({
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        movementType: z.string(),
        publishedAt: z.date(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { createPublication } = await import("./db");
        return createPublication({
          caseId: input.caseId,
          source: "MANUAL",
          movementCode: 0,
          movementName: input.movementType,
          content: input.content,
          publishedAt: input.publishedAt,
          externalId: `MANUAL_${input.caseId}_${Date.now()}`,
          isRead: 0,
        });
      }),
    list: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        const { getPublicationsByCaseId } = await import("./db");
        return getPublicationsByCaseId(input.caseId);
      }),
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAllPublicationsForUser } = await import("./db");
        return getAllPublicationsForUser(ctx.user.id);
      }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { markPublicationAsRead } = await import("./db");
        return markPublicationAsRead(input.id);
      }),
    checkForNew: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        processNumber: z.string(),
        tribunal: z.enum(["TJSP", "TRT2", "TRT15"]),
      }))
      .mutation(async ({ input }) => {
        const { getExternalIdsByCaseId, createPublication } = await import("./db");
        const { checkForNewMovements } = await import("./datajud");
        
        // Busca IDs de publicações já conhecidas
        const knownIds = await getExternalIdsByCaseId(input.caseId);
        
        // Consulta API DataJud
        const newMovements = await checkForNewMovements(
          input.processNumber,
          input.tribunal,
          knownIds
        );
        
        // Salva novas publicações no banco
        const savedPublications = [];
        for (const mov of newMovements) {
          const pub = await createPublication({
            caseId: input.caseId,
            source: input.tribunal,
            movementCode: mov.code,
            movementName: mov.name,
            content: mov.content,
            publishedAt: mov.publishedAt,
            externalId: mov.externalId,
            isRead: 0,
          });
          savedPublications.push(pub);
        }
        
        return {
          newCount: savedPublications.length,
          publications: savedPublications,
        };
      }),
  }),

  caseUpdates: router({
    list: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { getCaseUpdatesByCaseId } = await import("./db");
        return getCaseUpdatesByCaseId(input.caseId);
      }),
    listForPortal: publicProcedure
      .input(z.object({ caseId: z.number(), token: z.string() }))
      .query(async ({ input }) => {
        await ensureCaseBelongsToToken(input.caseId, input.token);
        const { getCaseUpdatesByCaseId } = await import("./db");
        return getCaseUpdatesByCaseId(input.caseId);
      }),
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        updateDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { createCaseUpdate } = await import("./db");
        return createCaseUpdate(input);
      }),
  }),

  tasks: router({
    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { getCaseTasksByCaseId } = await import("./db");
        return getCaseTasksByCaseId(input.caseId);
      }),
    create: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        reminderMinutesBefore: z.number().min(5).max(10080).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureCaseBelongsToUser(input.caseId, ctx.user.id);
        const { createCaseTask } = await import("./db");
        return createCaseTask({
          caseId: input.caseId,
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority ?? "medium",
          reminderMinutesBefore: input.reminderMinutesBefore ?? 60,
          status: "pending",
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "overdue"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureTaskBelongsToUser(input.id, ctx.user.id);
        const { updateCaseTaskStatus } = await import("./db");
        return updateCaseTaskStatus(input.id, input.status);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        reminderMinutesBefore: z.number().min(5).max(10080).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await ensureTaskBelongsToUser(input.id, ctx.user.id);
        const { updateCaseTask } = await import("./db");
        const { id, ...data } = input;
        return updateCaseTask(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await ensureTaskBelongsToUser(input.id, ctx.user.id);
        const { deleteCaseTask } = await import("./db");
        return deleteCaseTask(input.id);
      }),
    upcoming: protectedProcedure.query(async ({ ctx }) => {
      const { getUpcomingTasks } = await import("./db");
      return getUpcomingTasks(ctx.user.id);
    }),
    reminders: protectedProcedure.query(async ({ ctx }) => {
      const { getDueSoonTasks, markTasksReminded, getWhatsappSettingsByUserId } = await import("./db");
      const { sendWhatsAppText } = await import("./_core/whatsapp");
      const tasks = await getDueSoonTasks(ctx.user.id);

      let creds = undefined;
      try {
        creds = await getWhatsappSettingsByUserId(ctx.user.id);
      } catch {
        creds = undefined;
      }

      if (ctx.user.phone && tasks.length > 0) {
        const phone = ctx.user.phone;
        for (const task of tasks) {
          const due = new Date(task.dueDate).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const msg = `Lembrete Marqlet\n${task.title}\nVence: ${due}\nPrioridade: ${task.priority}`;
          try {
            await sendWhatsAppText({ to: phone, body: msg, credentials: creds });
          } catch (err) {
            console.warn("[WhatsApp] Falha ao enviar lembrete:", err);
          }
        }
      }

      await markTasksReminded(tasks.map(t => t.id));
      return tasks;
    }),
  }),
});

export type AppRouter = typeof appRouter;

