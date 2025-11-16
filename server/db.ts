import { eq, desc, and, gte, lte, lt, isNull, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, Client, InsertClient, cases, Case, InsertCase, caseUpdates, CaseUpdate, InsertCaseUpdate, messages, Message, InsertMessage, faqItems, FaqItem, InsertFaqItem, documents, Document, InsertDocument, fees, Fee, InsertFee, installments, Installment, InsertInstallment, publications, Publication, InsertPublication, caseTasks, CaseTask, InsertCaseTask, whatsappSettings, InsertWhatsAppSettings, WhatsAppSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
export async function updateUser(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ===== WhatsApp settings =====
export async function upsertWhatsappSettings(data: InsertWhatsAppSettings): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(whatsappSettings).values(data).onDuplicateKeyUpdate({
    set: {
      token: data.token,
      phoneId: data.phoneId,
      apiUrl: data.apiUrl,
      fromNumber: data.fromNumber,
    },
  });
}

export async function getWhatsappSettingsByUserId(userId: number): Promise<WhatsAppSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(whatsappSettings).where(eq(whatsappSettings.userId, userId)).limit(1);
  return result[0];
}

// ===== CLIENTS =====
export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(clientId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return result[0];
}

export async function getClientByToken(token: string): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.accessToken, token)).limit(1);
  return result[0];
}

export async function createClient(data: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Gerar token de acesso único para o cliente
  const accessToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  const result = await db.insert(clients).values({ ...data, accessToken });
  const insertedId = Number(result[0].insertId);
  const client = await getClientById(insertedId);
  if (!client) throw new Error("Failed to create client");
  return client;
}

// ===== CASES =====
export async function getCasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const userCases = await db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.createdAt));
  
  // Buscar clientes para cada processo
  const casesWithClients = await Promise.all(
    userCases.map(async (caseItem) => {
      const client = await getClientById(caseItem.clientId);
      return { ...caseItem, client };
    })
  );
  
  return casesWithClients;
}

export async function getCasesByClientId(clientId: number): Promise<Case[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).where(eq(cases.clientId, clientId)).orderBy(desc(cases.createdAt));
}

export async function getCaseById(caseId: number): Promise<Case | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  return result[0];
}

export async function createCase(data: InsertCase): Promise<Case> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cases).values(data);
  const insertedId = Number(result[0].insertId);
  const caseData = await getCaseById(insertedId);
  if (!caseData) throw new Error("Failed to create case");
  return caseData;
}

export async function updateCaseStatus(id: number, status: 'active' | 'won' | 'lost' | 'archived'): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cases).set({ status }).where(eq(cases.id, id));
}

// ===== CASE UPDATES =====
export async function getCaseUpdatesByCaseId(caseId: number): Promise<CaseUpdate[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(caseUpdates).where(eq(caseUpdates.caseId, caseId)).orderBy(desc(caseUpdates.updateDate));
}

export async function createCaseUpdate(data: InsertCaseUpdate): Promise<CaseUpdate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(caseUpdates).values(data);
  const insertedId = Number(result[0].insertId);
  const update = await db.select().from(caseUpdates).where(eq(caseUpdates.id, insertedId)).limit(1);
  if (!update[0]) throw new Error("Failed to create case update");
  return update[0];
}

// ===== MESSAGES =====
export async function getMessagesByCaseId(caseId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.caseId, caseId)).orderBy(messages.createdAt);
}

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(data);
  const insertedId = Number(result[0].insertId);
  const message = await db.select().from(messages).where(eq(messages.id, insertedId)).limit(1);
  if (!message[0]) throw new Error("Failed to create message");
  return message[0];
}

export async function getUnreadMessagesCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  // Buscar processos do advogado
  const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
  const caseIds = userCases.map(c => c.id);
  
  if (caseIds.length === 0) return 0;
  
  // Contar mensagens não lidas de clientes
  const { and, inArray } = await import("drizzle-orm");
  const unreadMessages = await db.select().from(messages)
    .where(
      and(
        inArray(messages.caseId, caseIds),
        eq(messages.senderType, "client"),
        eq(messages.isRead, 0)
      )
    );
  
  return unreadMessages.length;
}

export async function markMessagesAsRead(caseId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const { and } = await import("drizzle-orm");
  
  // Marcar todas as mensagens de clientes como lidas
  await db.update(messages)
    .set({ isRead: 1 })
    .where(
      and(
        eq(messages.caseId, caseId),
        eq(messages.senderType, "client"),
        eq(messages.isRead, 0)
      )
    );
}

// ===== FAQ =====
export async function getFaqItemsByUserId(userId: number): Promise<FaqItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqItems).where(eq(faqItems.userId, userId)).orderBy(desc(faqItems.createdAt));
}

export async function createFaqItem(data: InsertFaqItem): Promise<FaqItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(faqItems).values(data);
  const insertedId = Number(result[0].insertId);
  const faq = await db.select().from(faqItems).where(eq(faqItems.id, insertedId)).limit(1);
  if (!faq[0]) throw new Error("Failed to create FAQ item");
  return faq[0];
}

// ===== DOCUMENTS =====
export async function getDocumentsByCaseId(caseId: number): Promise<Document[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.caseId, caseId)).orderBy(desc(documents.createdAt));
}

export async function uploadDocument(data: {
  caseId: number;
  userId: number;
  fileName: string;
  fileData: string; // base64
  mimeType: string;
  description?: string;
}): Promise<Document> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Upload para S3
  const { storagePut } = await import("./storage");
  const buffer = Buffer.from(data.fileData, 'base64');
  const fileSize = buffer.length;
  
  // Gerar chave única para o arquivo
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileExtension = data.fileName.split('.').pop() || '';
  const fileKey = `documents/${data.caseId}/${timestamp}-${randomSuffix}.${fileExtension}`;
  
  const { url } = await storagePut(fileKey, buffer, data.mimeType);
  
  // Salvar no banco
  const insertData: InsertDocument = {
    caseId: data.caseId,
    userId: data.userId,
    fileName: data.fileName,
    fileUrl: url,
    fileKey: fileKey,
    fileSize: fileSize,
    mimeType: data.mimeType,
    description: data.description,
  };
  
  const result = await db.insert(documents).values(insertData);
  const insertedId = Number(result[0].insertId);
  const document = await db.select().from(documents).where(eq(documents.id, insertedId)).limit(1);
  if (!document[0]) throw new Error("Failed to create document");
  return document[0];
}

export async function deleteDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.id, id));
}

// ===== CASE TASKS / AGENDA =====
export async function createCaseTask(data: InsertCaseTask): Promise<CaseTask> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(caseTasks).values(data);
  const insertedId = Number(result[0].insertId);
  const task = await db.select().from(caseTasks).where(eq(caseTasks.id, insertedId)).limit(1);
  if (!task[0]) throw new Error("Failed to create case task");
  return task[0];
}

export async function getCaseTasksByCaseId(caseId: number): Promise<CaseTask[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(caseTasks).where(eq(caseTasks.caseId, caseId)).orderBy(caseTasks.dueDate);
}

export async function getCaseTaskById(id: number): Promise<CaseTask | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(caseTasks).where(eq(caseTasks.id, id)).limit(1);
  return result[0];
}

export async function getUpcomingTasks(userId: number): Promise<CaseTask[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 14);
  return db
    .select()
    .from(caseTasks)
    .where(
      and(
        eq(caseTasks.userId, userId),
        gte(caseTasks.dueDate, now),
        lte(caseTasks.dueDate, horizon),
      )
    )
    .orderBy(caseTasks.dueDate);
}

export async function getDueSoonTasks(userId: number, windowMinutes = 30): Promise<CaseTask[]> {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const window = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const raw = await db
    .select()
    .from(caseTasks)
    .where(
      and(
        eq(caseTasks.userId, userId),
        or(eq(caseTasks.status, "pending"), eq(caseTasks.status, "in_progress")),
        lte(caseTasks.dueDate, window),
        or(isNull(caseTasks.reminderSentAt), lt(caseTasks.reminderSentAt, now)),
      )
    )
    .orderBy(caseTasks.dueDate);

  return raw.filter(task => {
    const due = new Date(task.dueDate).getTime();
    const reminderBefore = (task.reminderMinutesBefore ?? 60) * 60 * 1000;
    return due - reminderBefore <= now.getTime();
  });
}

export async function markTasksReminded(taskIds: number[]): Promise<void> {
  if (taskIds.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(caseTasks)
    .set({ reminderSentAt: new Date() })
    .where(inArray(caseTasks.id, taskIds));
}

export async function updateCaseTaskStatus(
  id: number,
  status: CaseTask["status"],
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(caseTasks).set({ status }).where(eq(caseTasks.id, id));
}

export async function updateCaseTask(
  id: number,
  data: Partial<InsertCaseTask>,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(caseTasks).set(data).where(eq(caseTasks.id, id));
}

export async function deleteCaseTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(caseTasks).where(eq(caseTasks.id, id));
}

// ===== FEES (HONORÁRIOS) =====
export async function createFee(data: InsertFee): Promise<Fee> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(fees).values(data);
  const insertedId = Number(result[0].insertId);
  const fee = await db.select().from(fees).where(eq(fees.id, insertedId)).limit(1);
  if (!fee[0]) throw new Error("Failed to create fee");
  return fee[0];
}

export async function getFeesByCaseId(caseId: number): Promise<Fee[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fees).where(eq(fees.caseId, caseId)).orderBy(desc(fees.createdAt));
}

export async function getFeesByUserId(userId: number): Promise<Fee[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fees).where(eq(fees.userId, userId)).orderBy(desc(fees.createdAt));
}

// ===== INSTALLMENTS (PARCELAS) =====
export async function createInstallment(data: InsertInstallment): Promise<Installment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(installments).values(data);
  const insertedId = Number(result[0].insertId);
  const installment = await db.select().from(installments).where(eq(installments.id, insertedId)).limit(1);
  if (!installment[0]) throw new Error("Failed to create installment");
  return installment[0];
}

export async function getInstallmentsByFeeId(feeId: number): Promise<Installment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(installments).where(eq(installments.feeId, feeId)).orderBy(installments.installmentNumber);
}

export async function getInstallmentsByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: installments.id,
      feeId: installments.feeId,
      caseId: installments.caseId,
      clientId: installments.clientId,
      installmentNumber: installments.installmentNumber,
      amount: installments.amount,
      dueDate: installments.dueDate,
      status: installments.status,
      paidAt: installments.paidAt,
      paymentMethod: installments.paymentMethod,
      notes: installments.notes,
      createdAt: installments.createdAt,
      updatedAt: installments.updatedAt,
      caseTitle: cases.title,
      caseProcessNumber: cases.processNumber,
    })
    .from(installments)
    .leftJoin(cases, eq(installments.caseId, cases.id))
    .where(eq(installments.clientId, clientId))
    .orderBy(installments.dueDate);
  
  return result;
}

export async function getInstallmentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar processos do advogado
  const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
  const caseIds = userCases.map(c => c.id);
  
  if (caseIds.length === 0) return [];
  
  const { inArray } = await import("drizzle-orm");
  const result = await db
    .select({
      id: installments.id,
      feeId: installments.feeId,
      caseId: installments.caseId,
      clientId: installments.clientId,
      installmentNumber: installments.installmentNumber,
      amount: installments.amount,
      dueDate: installments.dueDate,
      status: installments.status,
      paidAt: installments.paidAt,
      paymentMethod: installments.paymentMethod,
      notes: installments.notes,
      createdAt: installments.createdAt,
      updatedAt: installments.updatedAt,
      caseTitle: cases.title,
      caseProcessNumber: cases.processNumber,
    })
    .from(installments)
    .leftJoin(cases, eq(installments.caseId, cases.id))
    .where(inArray(installments.caseId, caseIds))
    .orderBy(installments.dueDate);
  
  return result;
}

export async function updateInstallmentStatus(id: number, status: "pending" | "paid" | "overdue" | "cancelled", paidAt?: Date, paymentMethod?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (paidAt) updateData.paidAt = paidAt;
  if (paymentMethod) updateData.paymentMethod = paymentMethod;
  
  await db.update(installments)
    .set(updateData)
    .where(eq(installments.id, id));
}

export async function updateInstallment(id: number, data: Partial<InsertInstallment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(installments).set(data).where(eq(installments.id, id));
}


// ==================== PUBLICATIONS ====================

export async function createPublication(publication: InsertPublication): Promise<Publication> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(publications).values(publication);
  const inserted = await db.select().from(publications).where(eq(publications.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function getPublicationsByCaseId(caseId: number): Promise<Publication[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(publications).where(eq(publications.caseId, caseId)).orderBy(desc(publications.publishedAt));
}

export async function getUnreadPublicationsCount(caseId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(publications).where(eq(publications.caseId, caseId));
  return result.filter(p => p.isRead === 0).length;
}

export async function markPublicationAsRead(publicationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(publications).set({ isRead: 1 }).where(eq(publications.id, publicationId));
}

export async function getExternalIdsByCaseId(caseId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const pubs = await db.select().from(publications).where(eq(publications.caseId, caseId));
  return pubs.map(p => p.externalId).filter((id): id is string => id !== null);
}

export async function getAllPublicationsForUser(userId: number): Promise<Array<Publication & { case: Case }>> {
  const db = await getDb();
  if (!db) return [];

  const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
  const caseIds = userCases.map(c => c.id);

  if (caseIds.length === 0) return [];

  const allPublications = await db.select().from(publications).orderBy(desc(publications.publishedAt));
  
  return allPublications
    .filter(p => caseIds.includes(p.caseId))
    .map(p => ({
      ...p,
      case: userCases.find(c => c.id === p.caseId)!,
    }));
}
