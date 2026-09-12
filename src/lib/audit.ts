import { type Client } from '@libsql/client';
import { NextRequest } from 'next/server';

export interface AuditData {
  actor_id: number | null;
  action: 'CREATE' | 'UPDATE' | 'SOFT_DELETE' | 'ACCESS';
  entity_type: string;
  entity_id: number | null;
  old_data?: any;
  new_data?: any;
}

/**
 * Records an entry in the audit_logs table for compliance and fraud-proof reporting.
 */
export async function recordAuditLog(
  db: Client,
  req: NextRequest,
  data: AuditData
) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const method = req.method;
    const endpoint = req.nextUrl.pathname;

    await db.execute({
      sql: `INSERT INTO audit_logs (
        actor_id, action, entity_type, entity_id, 
        method, endpoint, old_data, new_data, 
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.actor_id,
        data.action,
        data.entity_type,
        data.entity_id,
        method,
        endpoint,
        data.old_data ? JSON.stringify(data.old_data) : null,
        data.new_data ? JSON.stringify(data.new_data) : null,
        ip,
        userAgent,
      ],
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
    // We don't throw here to avoid blocking the main request if logging fails,
    // though in a strict compliance environment we might want to.
  }
}
