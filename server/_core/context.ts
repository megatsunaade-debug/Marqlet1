import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookie } from "cookie";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getUserByOpenId, upsertUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user && !ENV.isProduction) {
    const cookies = parseCookie(opts.req.headers.cookie ?? "");
    if (cookies["dev-auth"] === "1") {
      const devOpenId = "dev-user";
      let devUser = await getUserByOpenId(devOpenId);
      if (!devUser) {
        await upsertUser({
          openId: devOpenId,
          name: "Dev User",
          email: "dev@example.com",
          loginMethod: "local",
          role: "admin",
        });
        devUser = await getUserByOpenId(devOpenId);
      }
      user = devUser ?? null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
