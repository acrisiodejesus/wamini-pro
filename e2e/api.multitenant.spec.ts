import { test, expect } from '@playwright/test';

test.describe.serial('Wamíni: Gestão de Grupos de Produtores & Multi-Tenant Isolation', () => {
  const BASE_URL = 'http://localhost:3000/api/v1';

  const SUPER_ADMIN = { Authorization: 'Bearer TEST_TOKEN_SUPER_ADMIN' };
  const ORG_1_ADMIN = { Authorization: 'Bearer TEST_TOKEN_ORG_1_ADMIN' };
  const ORG_2_ADMIN = { Authorization: 'Bearer TEST_TOKEN_ORG_2_ADMIN' };
  const ORG_1_OFFICER = { Authorization: 'Bearer TEST_TOKEN_ORG_1_OFFICER' };

  let createdOrgId: number;
  let createdGroupId: number;
  let createdFarmerId: number;
  let createdFarmId: number;
  let createdCycleId: number;
  let createdCropId: number;
  let createdProductionId: number;
  let createdInputId: number;
  let createdInventoryId: number;

  // 1. Criar Organização (Apenas Super Admin)
  test('1. Super Admin: Criar nova organização agrícola', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/organizations`, {
      headers: SUPER_ADMIN,
      data: {
        name: 'Associação dos Camponeses de Ribaué',
        type: 'association',
        province: 'Nampula',
        district: 'Ribaué',
        description: 'Foco na produção de milho e feijão',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.organization_id).toBeDefined();
    createdOrgId = body.organization_id;
  });

  test('RBAC: Field Officer NÃO pode criar organizações globais', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/organizations`, {
      headers: ORG_1_OFFICER,
      data: {
        name: 'Tentativa não autorizada',
        type: 'cooperative',
        province: 'Nampula',
        district: 'Rapale',
      },
    });

    expect(res.status()).toBe(403);
  });

  // 2. Criar Grupo de Produtores
  test('2. Org 1 Admin: Criar grupo de produtores na Org 1', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/groups`, {
      headers: ORG_1_ADMIN,
      data: {
        name: 'Pólo Anchilo - Vale Fértil',
        province: 'Nampula',
        district: 'Rapale',
        locality: 'Anchilo Sede',
        description: 'Grupo de agricultores dedicados a cereais e mandioca',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.group_id).toBeDefined();
    createdGroupId = body.group_id;
  });

  // 3. Adicionar Produtor
  test('3. Org 1 Officer: Adicionar produtor ao grupo', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/farmers`, {
      headers: ORG_1_OFFICER,
      data: {
        name: 'Alberto Chissano',
        group_id: createdGroupId,
        gender: 'M',
        phone: '849991122',
        province: 'Nampula',
        district: 'Rapale',
        locality: 'Anchilo Sede',
        main_crops: 'Milho, Feijão',
        agricultural_experience_years: 15,
        estimated_total_area: 3.0,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.farmer_id).toBeDefined();
    createdFarmerId = body.farmer_id;
  });

  // 4. Registar Machamba
  test('4. Registar machamba associada ao produtor', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/farms`, {
      headers: ORG_1_OFFICER,
      data: {
        farmer_id: createdFarmerId,
        name: 'Machamba da Encosta Verde',
        province: 'Nampula',
        district: 'Rapale',
        locality: 'Anchilo',
        total_area: 3.0,
        cultivated_area: 2.5,
        soil_type: 'Franco-argiloso',
        irrigation_type: 'Sequeiro',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.farm_id).toBeDefined();
    createdFarmId = body.farm_id;
  });

  // 5. Criar Ciclo Agrícola
  test('5. Criar ciclo de produção / campanha agrícola', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/production-cycles`, {
      headers: ORG_1_ADMIN,
      data: {
        name: 'Campanha de Sequeiro 2026',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        season: 'Época Chuvosa',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.cycle_id).toBeDefined();
    createdCycleId = body.cycle_id;
  });

  // 6. Registar Cultura
  test('6. Registar cultura no catálogo da organização', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/crops`, {
      headers: ORG_1_ADMIN,
      data: {
        name: 'Milho Doce Amarelo',
        category: 'cereais',
        default_unit: 'kg',
        description: 'Variedade precoce de alto teor nutritivo',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.crop_id).toBeDefined();
    createdCropId = body.crop_id;
  });

  // 7. Registar Produção
  test('7. Registar cultivo e colheita com cálculo de perdas', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/production`, {
      headers: ORG_1_OFFICER,
      data: {
        cycle_id: createdCycleId,
        farm_id: createdFarmId,
        farmer_id: createdFarmerId,
        crop_id: createdCropId,
        planted_area_ha: 2.0,
        planting_date: '2026-01-15',
        estimated_production: 3500,
        current_stage: 'harvested',
        harvested_quantity: 3200,
        loss_quantity: 300,
        loss_reason: 'Pragas no início do ciclo',
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.production_id).toBeDefined();
    createdProductionId = body.production_id;

    // Verificar cálculos automáticos no GET
    const getRes = await request.get(`${BASE_URL}/production/${createdProductionId}`, {
      headers: ORG_1_ADMIN,
    });
    expect(getRes.status()).toBe(200);
    const prodData = await getRes.json();
    expect(prodData.loss_rate_percentage).toBeGreaterThan(0);
    expect(prodData.productivity_kg_per_ha).toBe(1600); // 3200kg / 2.0ha = 1600 kg/ha
  });

  // 8. Insumos e Distribuição
  test('8. Catálogo, entrada de estoque e distribuição a produtor', async ({ request }) => {
    // 8a. Catálogo
    const catRes = await request.post(`${BASE_URL}/inputs/catalog`, {
      headers: ORG_1_ADMIN,
      data: {
        name: 'Sementes Certificadas PAN 53',
        category: 'sementes',
        unit: 'kg',
      },
    });
    expect(catRes.status()).toBe(201);
    createdInputId = (await catRes.json()).input_id;

    // 8b. Entrada de Estoque
    const invRes = await request.post(`${BASE_URL}/inputs/inventory`, {
      headers: ORG_1_ADMIN,
      data: {
        input_id: createdInputId,
        batch_number: 'LOTE-TEST-2026',
        quantity_received: 500,
        unit_cost: 100,
        supplier: 'Fornecedor Central',
      },
    });
    expect(invRes.status()).toBe(201);
    createdInventoryId = (await invRes.json()).inventory_id;

    // 8c. Distribuição ao Produtor
    const distRes = await request.post(`${BASE_URL}/inputs/distributions`, {
      headers: ORG_1_OFFICER,
      data: {
        input_id: createdInputId,
        inventory_id: createdInventoryId,
        farmer_id: createdFarmerId,
        quantity: 50,
        unit: 'kg',
        purpose: 'Plantio de safra',
      },
    });
    expect(distRes.status()).toBe(201);

    // Verificar que o estoque no lote foi decrementado de 500 para 450
    const checkInvRes = await request.get(`${BASE_URL}/inputs/inventory?input_id=${createdInputId}`, {
      headers: ORG_1_ADMIN,
    });
    const invList = await checkInvRes.json();
    const batch = invList.find((b: any) => b.id === createdInventoryId);
    expect(batch.quantity_available).toBe(450);
  });

  // 9. ISOLAMENTO MULTI-TENANT EXPLÍCITO
  test('9. Isolamento Multi-Tenant: Org 2 NÃO pode consultar nem modificar dados da Org 1', async ({ request }) => {
    // Org 2 tenta listar grupos -> não deve conter grupos da Org 1
    const groupsRes = await request.get(`${BASE_URL}/groups`, {
      headers: ORG_2_ADMIN,
    });
    expect(groupsRes.status()).toBe(200);
    const org2Groups = await groupsRes.json();
    const hasOrg1Group = org2Groups.some((g: any) => g.id === createdGroupId);
    expect(hasOrg1Group).toBe(false);

    // Org 2 tenta aceder diretamente ao produtor da Org 1 -> 404
    const farmerRes = await request.get(`${BASE_URL}/farmers/${createdFarmerId}`, {
      headers: ORG_2_ADMIN,
    });
    expect(farmerRes.status()).toBe(404);

    // Org 2 tenta modificar produtor da Org 1 -> 404
    const editFarmerRes = await request.put(`${BASE_URL}/farmers/${createdFarmerId}`, {
      headers: ORG_2_ADMIN,
      data: { name: 'Tentativa Hacker de Troca de Nome' },
    });
    expect(editFarmerRes.status()).toBe(404);

    // Org 2 tenta aceder à machamba da Org 1 -> 404
    const farmRes = await request.get(`${BASE_URL}/farms/${createdFarmId}`, {
      headers: ORG_2_ADMIN,
    });
    expect(farmRes.status()).toBe(404);
  });

  // 10. Sincronização Offline-First
  test('10. Offline Sync: Reconciliação em lote com client_uuid', async ({ request }) => {
    const offlineFarmerUuid = `offline_farmer_${Date.now()}`;
    const offlineFarmUuid = `offline_farm_${Date.now()}`;

    const syncRes = await request.post(`${BASE_URL}/sync`, {
      headers: ORG_1_OFFICER,
      data: {
        farmers: [
          {
            client_uuid: offlineFarmerUuid,
            group_id: createdGroupId,
            name: 'Produtor Offline Silva',
            gender: 'M',
            district: 'Rapale',
          },
        ],
        farms: [
          {
            client_uuid: offlineFarmUuid,
            farmer_client_uuid: offlineFarmerUuid, // Referência de chave criada no mesmo lote offline
            name: 'Machamba Offline Registada em Campo',
            district: 'Rapale',
            total_area: 2.0,
            cultivated_area: 1.5,
          },
        ],
      },
    });

    expect(syncRes.status()).toBe(200);
    const syncData = await syncRes.json();
    expect(syncData.results.farmers[0].status).toBe('synced');
    expect(syncData.results.farms[0].status).toBe('synced');
  });
});
