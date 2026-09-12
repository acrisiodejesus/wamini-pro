import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getTenantContext, enforceTenantAccess } from '@/lib/tenant';
import { apiError, apiOk } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

interface SyncItemResult {
  client_uuid: string;
  server_id: number;
  status: 'synced' | 'failed';
  error?: string;
}

// POST /api/v1/sync - Sincronização em lote de dados criados offline pelo técnico de campo
export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext(req);
    const authErr = enforceTenantAccess(context, ['super_admin', 'org_admin', 'group_manager', 'field_officer']);
    if (authErr) return authErr;

    const payload = await req.json();
    const { farmers = [], farms = [], production_records = [], input_distributions = [] } = payload;

    const db = await getDb();
    const orgId = context!.organizationId;

    const results: {
      farmers: SyncItemResult[];
      farms: SyncItemResult[];
      production_records: SyncItemResult[];
      input_distributions: SyncItemResult[];
    } = {
      farmers: [],
      farms: [],
      production_records: [],
      input_distributions: [],
    };

    // Mapeamento em memória de client_uuid -> server_id para resolver dependências no mesmo lote
    const uuidToServerIdMap: Record<string, number> = {};

    // 1. Processar Produtores (Farmers)
    for (const farmer of farmers) {
      try {
        const clientUuid = farmer.client_uuid || `offline_${Date.now()}_${Math.random()}`;
        
        // Verificar se já existe por client_uuid
        const existing = await db.execute({
          sql: `SELECT id FROM farmers WHERE client_uuid = ? AND organization_id = ?`,
          args: [clientUuid, orgId],
        });

        let serverId: number;
        if (existing.rows.length > 0) {
          serverId = Number(existing.rows[0].id);
          await db.execute({
            sql: `UPDATE farmers SET
                  name = COALESCE(?, name),
                  phone = COALESCE(?, phone),
                  district = COALESCE(?, district),
                  locality = COALESCE(?, locality),
                  main_crops = COALESCE(?, main_crops),
                  updated_at = datetime('now')
                  WHERE id = ?`,
            args: [farmer.name, farmer.phone, farmer.district, farmer.locality, farmer.main_crops, serverId],
          });
        } else {
          const insert = await db.execute({
            sql: `INSERT INTO farmers (
              client_uuid, organization_id, group_id, name, gender, birth_date,
              phone, id_document, photo, province, district, administrative_post,
              locality, address, latitude, longitude, agricultural_experience_years,
              main_crops, estimated_total_area, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            args: [
              clientUuid,
              orgId,
              Number(farmer.group_id || 1),
              farmer.name,
              farmer.gender || null,
              farmer.birth_date || null,
              farmer.phone || null,
              farmer.id_document || null,
              farmer.photo || null,
              farmer.province || 'Nampula',
              farmer.district || 'Rapale',
              farmer.administrative_post || null,
              farmer.locality || null,
              farmer.address || null,
              farmer.latitude ? Number(farmer.latitude) : null,
              farmer.longitude ? Number(farmer.longitude) : null,
              farmer.agricultural_experience_years ? Number(farmer.agricultural_experience_years) : 0,
              farmer.main_crops || null,
              farmer.estimated_total_area ? Number(farmer.estimated_total_area) : 0,
            ],
          });
          serverId = Number(insert.lastInsertRowid);
        }

        uuidToServerIdMap[clientUuid] = serverId;
        results.farmers.push({ client_uuid: clientUuid, server_id: serverId, status: 'synced' });
      } catch (err: any) {
        results.farmers.push({ client_uuid: farmer.client_uuid, server_id: 0, status: 'failed', error: err.message });
      }
    }

    // 2. Processar Machambas (Farms)
    for (const farm of farms) {
      try {
        const clientUuid = farm.client_uuid || `offline_farm_${Date.now()}_${Math.random()}`;
        // Resolver farmer_id (pode ter vindo como ID numérico ou via client_uuid)
        let resolvedFarmerId = farm.farmer_id ? Number(farm.farmer_id) : 0;
        if (!resolvedFarmerId && farm.farmer_client_uuid && uuidToServerIdMap[farm.farmer_client_uuid]) {
          resolvedFarmerId = uuidToServerIdMap[farm.farmer_client_uuid];
        }

        if (!resolvedFarmerId) {
          throw new Error('Não foi possível associar a machamba ao produtor');
        }

        const existing = await db.execute({
          sql: `SELECT id FROM farms WHERE client_uuid = ? AND organization_id = ?`,
          args: [clientUuid, orgId],
        });

        let serverId: number;
        if (existing.rows.length > 0) {
          serverId = Number(existing.rows[0].id);
        } else {
          const insert = await db.execute({
            sql: `INSERT INTO farms (
              client_uuid, organization_id, farmer_id, name, location, province,
              district, locality, latitude, longitude, total_area, cultivated_area,
              soil_type, irrigation_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            args: [
              clientUuid,
              orgId,
              resolvedFarmerId,
              farm.name,
              farm.location || null,
              farm.province || 'Nampula',
              farm.district || 'Rapale',
              farm.locality || null,
              farm.latitude ? Number(farm.latitude) : null,
              farm.longitude ? Number(farm.longitude) : null,
              farm.total_area ? Number(farm.total_area) : 0,
              farm.cultivated_area ? Number(farm.cultivated_area) : 0,
              farm.soil_type || null,
              farm.irrigation_type || null,
            ],
          });
          serverId = Number(insert.lastInsertRowid);
        }

        uuidToServerIdMap[clientUuid] = serverId;
        results.farms.push({ client_uuid: clientUuid, server_id: serverId, status: 'synced' });
      } catch (err: any) {
        results.farms.push({ client_uuid: farm.client_uuid, server_id: 0, status: 'failed', error: err.message });
      }
    }

    // 3. Processar Registos de Produção (Production Records)
    for (const prod of production_records) {
      try {
        const clientUuid = prod.client_uuid || `offline_prod_${Date.now()}_${Math.random()}`;
        let resolvedFarmerId = prod.farmer_id ? Number(prod.farmer_id) : 0;
        if (!resolvedFarmerId && prod.farmer_client_uuid && uuidToServerIdMap[prod.farmer_client_uuid]) {
          resolvedFarmerId = uuidToServerIdMap[prod.farmer_client_uuid];
        }

        let resolvedFarmId = prod.farm_id ? Number(prod.farm_id) : 0;
        if (!resolvedFarmId && prod.farm_client_uuid && uuidToServerIdMap[prod.farm_client_uuid]) {
          resolvedFarmId = uuidToServerIdMap[prod.farm_client_uuid];
        }

        const existing = await db.execute({
          sql: `SELECT id FROM production_records WHERE client_uuid = ? AND organization_id = ?`,
          args: [clientUuid, orgId],
        });

        let serverId: number;
        if (existing.rows.length > 0) {
          serverId = Number(existing.rows[0].id);
          await db.execute({
            sql: `UPDATE production_records SET
                  harvested_quantity = COALESCE(?, harvested_quantity),
                  loss_quantity = COALESCE(?, loss_quantity),
                  loss_reason = COALESCE(?, loss_reason),
                  current_stage = COALESCE(?, current_stage),
                  updated_at = datetime('now')
                  WHERE id = ?`,
            args: [prod.harvested_quantity, prod.loss_quantity, prod.loss_reason, prod.current_stage, serverId],
          });
        } else {
          const insert = await db.execute({
            sql: `INSERT INTO production_records (
              client_uuid, organization_id, cycle_id, farm_id, farmer_id, crop_id,
              planted_area_ha, planting_date, estimated_production, current_stage,
              harvested_quantity, loss_quantity, loss_reason, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              clientUuid,
              orgId,
              Number(prod.cycle_id || 1),
              resolvedFarmId || 1,
              resolvedFarmerId || 1,
              Number(prod.crop_id || 1),
              prod.planted_area_ha ? Number(prod.planted_area_ha) : 0,
              prod.planting_date || null,
              prod.estimated_production ? Number(prod.estimated_production) : 0,
              prod.current_stage || 'planted',
              prod.harvested_quantity ? Number(prod.harvested_quantity) : 0,
              prod.loss_quantity ? Number(prod.loss_quantity) : 0,
              prod.loss_reason || null,
              prod.notes || null,
            ],
          });
          serverId = Number(insert.lastInsertRowid);
        }

        results.production_records.push({ client_uuid: clientUuid, server_id: serverId, status: 'synced' });
      } catch (err: any) {
        results.production_records.push({ client_uuid: prod.client_uuid, server_id: 0, status: 'failed', error: err.message });
      }
    }

    // 4. Processar Distribuições de Insumos (Input Distributions)
    for (const dist of input_distributions) {
      try {
        const clientUuid = dist.client_uuid || `offline_dist_${Date.now()}_${Math.random()}`;
        let resolvedFarmerId = dist.farmer_id ? Number(dist.farmer_id) : 0;
        if (!resolvedFarmerId && dist.farmer_client_uuid && uuidToServerIdMap[dist.farmer_client_uuid]) {
          resolvedFarmerId = uuidToServerIdMap[dist.farmer_client_uuid];
        }

        const insert = await db.execute({
          sql: `INSERT INTO input_distributions (
            client_uuid, organization_id, input_id, inventory_id, farmer_id,
            cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id,
            purpose, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, date('now')), ?, ?, ?)`,
          args: [
            clientUuid,
            orgId,
            Number(dist.input_id),
            dist.inventory_id ? Number(dist.inventory_id) : null,
            resolvedFarmerId || 1,
            dist.cycle_id ? Number(dist.cycle_id) : null,
            dist.crop_id ? Number(dist.crop_id) : null,
            Number(dist.quantity),
            dist.unit || 'kg',
            dist.distribution_date || null,
            context!.userId,
            dist.purpose || null,
            dist.notes || null,
          ],
        });

        const serverId = Number(insert.lastInsertRowid);
        results.input_distributions.push({ client_uuid: clientUuid, server_id: serverId, status: 'synced' });
      } catch (err: any) {
        results.input_distributions.push({ client_uuid: dist.client_uuid, server_id: 0, status: 'failed', error: err.message });
      }
    }

    await recordAuditLog(db, req, {
      actor_id: context!.userId,
      action: 'CREATE',
      entity_type: 'offline_sync_batch',
      entity_id: null,
      new_data: {
        synced_farmers: results.farmers.filter(f => f.status === 'synced').length,
        synced_farms: results.farms.filter(f => f.status === 'synced').length,
        synced_production: results.production_records.filter(f => f.status === 'synced').length,
        synced_distributions: results.input_distributions.filter(f => f.status === 'synced').length,
      },
    });

    return apiOk({
      message: 'Lote offline sincronizado com sucesso',
      results,
    });
  } catch (err: any) {
    console.error('Offline sync POST error:', err);
    return apiError(`Erro no processamento da sincronização offline: ${err.message}`, 500);
  }
}
