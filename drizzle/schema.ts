import { int, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phone: varchar("phone", { length: 32 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes do escritório
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(), // Advogado responsável
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  accessToken: varchar("accessToken", { length: 64 }).unique(), // Token único para acesso do cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Processos trabalhistas
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").references(() => clients.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(), // Advogado responsável
  processNumber: varchar("processNumber", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived", "won", "lost"]).default("active").notNull(),
  court: varchar("court", { length: 255 }),
  filingDate: timestamp("filingDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * Atualizações/andamentos dos processos
 */
export const caseUpdates = mysqlTable("caseUpdates", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  updateDate: timestamp("updateDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaseUpdate = typeof caseUpdates.$inferSelect;
export type InsertCaseUpdate = typeof caseUpdates.$inferInsert;

/**
 * Mensagens do chat entre advogado e cliente
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  senderId: int("senderId").notNull(), // ID do user (advogado) ou client
  senderType: mysqlEnum("senderType", ["lawyer", "client"]).notNull(),
  content: text("content").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 = não lida, 1 = lida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * FAQ - Perguntas frequentes sobre direito trabalhista
 */
export const faqItems = mysqlTable("faqItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id).notNull(), // Advogado que criou
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 100 }),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = typeof faqItems.$inferInsert;

/**
 * Documentos anexados aos processos
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(), // Advogado que fez upload
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: longtext("fileUrl").notNull(), // URL ou data URL do arquivo
  fileKey: text("fileKey").notNull(), // Chave do arquivo
  fileSize: int("fileSize").notNull(), // Tamanho em bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Tarefas e lembretes dos processos
 */
export const caseTasks = mysqlTable("caseTasks", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "overdue"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  reminderMinutesBefore: int("reminderMinutesBefore").default(60).notNull(),
  reminderSentAt: timestamp("reminderSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CaseTask = typeof caseTasks.$inferSelect;
export type InsertCaseTask = typeof caseTasks.$inferInsert;

/**
 * Credenciais de WhatsApp por usuário/escritório
 */
export const whatsappSettings = mysqlTable(
  "whatsappSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id).notNull(),
    token: text("token").notNull(),
    phoneId: varchar("phoneId", { length: 64 }).notNull(),
    apiUrl: varchar("apiUrl", { length: 255 }).default("https://graph.facebook.com/v18.0").notNull(),
    fromNumber: varchar("fromNumber", { length: 32 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userUnique: uniqueIndex("whatsapp_user_unique").on(table.userId),
  })
);

export type WhatsAppSettings = typeof whatsappSettings.$inferSelect;
export type InsertWhatsAppSettings = typeof whatsappSettings.$inferInsert;
/**
 * Honorários dos processos
 */
export const fees = mysqlTable("fees", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(), // Advogado
  totalAmount: int("totalAmount").notNull(), // Valor total em centavos
  paymentType: mysqlEnum("paymentType", ["cash", "installments"]).default("cash").notNull(),
  installmentsCount: int("installmentsCount").default(1).notNull(), // Número de parcelas
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fee = typeof fees.$inferSelect;
export type InsertFee = typeof fees.$inferInsert;

/**
 * Parcelas dos honorários
 */
export const installments = mysqlTable("installments", {
  id: int("id").autoincrement().primaryKey(),
  feeId: int("feeId").references(() => fees.id).notNull(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  clientId: int("clientId").references(() => clients.id).notNull(),
  installmentNumber: int("installmentNumber").notNull(), // Número da parcela (1, 2, 3...)
  amount: int("amount").notNull(), // Valor da parcela em centavos
  dueDate: timestamp("dueDate").notNull(), // Data de vencimento
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"), // Data do pagamento
  paymentMethod: varchar("paymentMethod", { length: 50 }), // PIX, Transferência, Dinheiro, etc
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = typeof installments.$inferInsert;

/**
 * Publicações e movimentações processuais do DJE
 */
export const publications = mysqlTable("publications", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").references(() => cases.id).notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'TJSP', 'TRT2', 'TRT15'
  movementCode: int("movementCode"), // Código da movimentação no tribunal
  movementName: varchar("movementName", { length: 500 }).notNull(), // Nome da movimentação
  content: text("content"), // Conteúdo completo da publicação/movimentação
  publishedAt: timestamp("publishedAt").notNull(), // Data/hora da publicação no DJE
  externalId: varchar("externalId", { length: 255 }).unique(), // ID único da movimentação no sistema do tribunal
  isRead: int("isRead").default(0).notNull(), // 0 = não lida, 1 = lida
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Publication = typeof publications.$inferSelect;
export type InsertPublication = typeof publications.$inferInsert;
