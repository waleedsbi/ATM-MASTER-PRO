import { getPrisma } from './prisma';
import { NextRequest } from 'next/server';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'QUERY' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'BACKUP'
  | 'VIEW';

export interface AuditLogData {
  userId?: number;
  userName?: string;
  action: AuditAction;
  tableName?: string;
  details?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(
  data: AuditLogData,
  request?: NextRequest
): Promise<void> {
  try {
    const prisma = getPrisma();

    // Extract IP and User Agent from request if provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
      userAgent = request.headers.get('user-agent') || undefined;
    }

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        tableName: data.tableName,
        details: data.details,
        ipAddress,
        userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
      },
    });
  } catch (error) {
    // Don't throw error to prevent breaking the main operation
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(filters?: {
  userId?: number;
  action?: AuditAction;
  tableName?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const prisma = getPrisma();

  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.action) where.action = filters.action;
  if (filters?.tableName) where.tableName = filters.tableName;
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  });

  return logs;
}

