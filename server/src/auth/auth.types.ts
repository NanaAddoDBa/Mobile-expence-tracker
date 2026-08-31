import { User, UserStatus } from "@prisma/client";
import { Request } from "express";
import { RequestUser } from "../common/request/request-user";

export interface SafeUserResponse {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthSessionResult {
  user: SafeUserResponse;
  sessionToken: string;
  expiresAt: Date;
}

export interface GoogleAuthSessionResult extends AuthSessionResult {
  isNewUser: boolean;
}

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  name: string | null;
}

export interface ValidatedSession {
  sessionId: string;
  user: RequestUser;
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
  authSessionId?: string;
}

export function toSafeUser(user: User): SafeUserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toRequestUser(user: User): RequestUser {
  return {
    id: user.id,
    email: user.email,
    ...(user.name === null ? {} : { name: user.name }),
    emailVerified: user.emailVerifiedAt !== null,
  };
}
