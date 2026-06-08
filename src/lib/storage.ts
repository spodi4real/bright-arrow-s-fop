import 'server-only';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';

const ROOT = process.env.FILE_STORAGE_ROOT || 'D:\\BrightArrow';

export function storageRoot(): string {
  return ROOT;
}

export function resolveStoragePath(relative: string): string {
  const abs = path.resolve(ROOT, relative);
  const normalizedRoot = path.resolve(ROOT) + path.sep;
  const normalizedAbs = abs + (abs.endsWith(path.sep) ? '' : '');
  if (!(normalizedAbs === path.resolve(ROOT) || normalizedAbs.startsWith(normalizedRoot))) {
    throw new Error('Path escapes storage root');
  }
  return abs;
}

export async function ensureDir(absPath: string): Promise<void> {
  await fs.mkdir(absPath, { recursive: true });
}

export async function writeBufferToStorage(relPath: string, data: Buffer): Promise<string> {
  const abs = resolveStoragePath(relPath);
  await ensureDir(path.dirname(abs));
  await fs.writeFile(abs, data);
  return abs;
}

export async function statFile(absPath: string) {
  return fs.stat(absPath);
}

export function streamFile(absPath: string) {
  return createReadStream(absPath);
}

export async function fileExists(absPath: string): Promise<boolean> {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(absPath: string): Promise<void> {
  try {
    await fs.unlink(absPath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
}

export function relativeFromAbs(absPath: string): string {
  return path.relative(ROOT, absPath);
}

export function joinUnder(...parts: string[]): string {
  return path.join(ROOT, ...parts);
}

export function relUnder(...parts: string[]): string {
  return parts.join(path.sep);
}
