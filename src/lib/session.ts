import "server-only";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: number) {
  const sessionId = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return {
    sessionId,
    expiresAt,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    return null;
  }

  const result = await db
    .select({
      userId: users.id,
      userCode: users.userCode,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  const session = result[0];

  if (!session) {
    return null;
  }

  if (!session.isActive || session.expiresAt.getTime() <= Date.now()) {
    await deleteSession(sessionId);
    return null;
  }

  return {
    id: session.userId,
    userCode: session.userCode,
    name: session.name,
    role: session.role,
  };
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }

  cookieStore.delete("session_id");
}