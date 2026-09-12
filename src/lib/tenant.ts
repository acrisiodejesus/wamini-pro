import { NextRequest } from 'next/server';
import { getDb } from './db';
import { getAuthPayload, apiError } from './auth';

export type UserRole = 'super_admin' | 'org_admin' | 'group_manager' | 'field_officer' | 'farmer';

export interface TenantContext {
  userId: number;
  userName: string;
  email?: string;
  organizationId: number;
  role: UserRole;
  allowedGroupIds?: number[];
  isSuperAdmin: boolean;
}

/**
 * Extrai e valida o contexto do utilizador autenticado e da sua organização.
 * Garante isolamento estrito entre organizações (multi-tenancy).
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext | null> {
  const authHeader = req.headers.get('Authorization');

  // Backdoors de teste para testes automatizados E2E / Pentests (apenas em não-produção)
  if (process.env.NODE_ENV !== 'production' && authHeader) {
    if (authHeader === 'Bearer TEST_TOKEN_SUPER_ADMIN') {
      return {
        userId: 1,
        userName: 'Armando Maputo (Super Admin)',
        organizationId: 1,
        role: 'super_admin',
        isSuperAdmin: true,
      };
    }
    if (authHeader === 'Bearer TEST_TOKEN_ORG_1_ADMIN') {
      return {
        userId: 2,
        userName: 'Maria da Graça (Org 1 Admin)',
        organizationId: 1,
        role: 'org_admin',
        isSuperAdmin: false,
      };
    }
    if (authHeader === 'Bearer TEST_TOKEN_ORG_1_GROUP_MGR') {
      return {
        userId: 3,
        userName: 'João Transportes (Group Manager)',
        organizationId: 1,
        role: 'group_manager',
        allowedGroupIds: [1],
        isSuperAdmin: false,
      };
    }
    if (authHeader === 'Bearer TEST_TOKEN_ORG_1_OFFICER') {
      return {
        userId: 4,
        userName: 'Técnico Agostinho (Field Officer)',
        organizationId: 1,
        role: 'field_officer',
        isSuperAdmin: false,
      };
    }
    if (authHeader === 'Bearer TEST_TOKEN_ORG_2_ADMIN') {
      return {
        userId: 5,
        userName: 'Inspetor Silva (Org 2 Admin)',
        organizationId: 2,
        role: 'org_admin',
        isSuperAdmin: false,
      };
    }
    if (authHeader === 'Bearer TEST_TOKEN_USER_1') {
      return {
        userId: 1,
        userName: 'Armando Maputo',
        organizationId: 1,
        role: 'org_admin',
        isSuperAdmin: true,
      };
    }
  }

  const payload = await getAuthPayload(req);
  if (!payload) return null;

  const actorId = (payload as any)._testLocalId || (payload as any).userId;
  if (!actorId) return null;

  const db = await getDb();

  // 1. Procurar perfil global na tabela users
  const userResult = await db.execute({
    sql: `SELECT id, name, role, organization_id FROM users WHERE id = ? AND deleted_at IS NULL`,
    args: [actorId],
  });
  const userRow = userResult.rows[0] as any;
  if (!userRow) return null;

  const isSuper = userRow.role === 'super_admin' || userRow.role === 'admin';

  // 2. Procurar associação à organização
  const orgUserResult = await db.execute({
    sql: `SELECT organization_id, role FROM organization_users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1`,
    args: [actorId],
  });
  const orgUserRow = orgUserResult.rows[0] as any;

  // Organização ativa
  const headerOrgId = req.headers.get('x-organization-id');
  let activeOrgId = orgUserRow?.organization_id || userRow.organization_id || 1;
  if (isSuper && headerOrgId) {
    activeOrgId = parseInt(headerOrgId, 10) || activeOrgId;
  }

  const role: UserRole = isSuper
    ? 'super_admin'
    : (orgUserRow?.role as UserRole) || (userRow.role as UserRole) || 'field_officer';

  // 3. Se for group_manager, buscar grupos atribuídos
  let allowedGroupIds: number[] | undefined = undefined;
  if (role === 'group_manager') {
    const assignments = await db.execute({
      sql: `SELECT group_id FROM user_group_assignments WHERE user_id = ?`,
      args: [actorId],
    });
    allowedGroupIds = assignments.rows.map((r: any) => Number(r.group_id));
  }

  return {
    userId: Number(userRow.id),
    userName: userRow.name || payload.name || 'Utilizador',
    organizationId: Number(activeOrgId),
    role,
    allowedGroupIds,
    isSuperAdmin: isSuper,
  };
}

/**
 * Validação de permissões e autorização de acesso ao tenant.
 * Retorna erro Response se a validação falhar, ou null se for permitido.
 */
export function enforceTenantAccess(
  context: TenantContext | null,
  allowedRoles?: UserRole[]
): Response | null {
  if (!context) {
    return apiError('Não autenticado', 401);
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!context.isSuperAdmin && !allowedRoles.includes(context.role)) {
      return apiError('Acesso não autorizado para o seu papel na organização', 403);
    }
  }

  return null;
}
