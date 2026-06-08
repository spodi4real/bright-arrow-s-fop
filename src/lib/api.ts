import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { can, type Action } from './permissions';
import type { User } from '@prisma/client';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export function serverError(message = 'Internal error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function requireApi(): Promise<User | NextResponse> {
  const u = await getCurrentUser();
  if (!u) return unauthorized();
  return u;
}

export async function requirePermissionApi(action: Action): Promise<User | NextResponse> {
  const u = await getCurrentUser();
  if (!u) return unauthorized();
  if (!can(u, action)) return forbidden();
  return u;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
