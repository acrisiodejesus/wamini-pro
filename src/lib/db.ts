// ─── Turso/libSQL Database — Vercel-compatible ────────────────────────────────
// Em produção usa Turso via HTTP (variáveis TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
// Em dev local usa um ficheiro SQLite local via file: protocol.

import { createClient, type Client, type InStatement } from '@libsql/client';

// ─── Client Singleton ─────────────────────────────────────────────────────────
let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (_client) return _client;

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Turso cloud (ou libSQL server auto-hospedado)
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // Dev local — ficheiro SQLite
    _client = createClient({
      url: 'file:local.db',
    });
  }

  return _client;
}

/**
 * Retorna o cliente libSQL já inicializado.
 * Na primeira chamada, cria as tabelas e faz seed.
 */
export async function getDb(): Promise<Client> {
  const client = getClient();

  if (!_initialized) {
    _initialized = true;
    console.log('--- DB Init: Schema ---');
    await initSchema(client);
    console.log('--- DB Init: Seed ---');
    await seedData(client);
  }

  return client;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
async function initSchema(db: Client) {
  const statements: string[] = [
    `CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL CHECK(length(name) <= 255),
      mobile_number TEXT  NOT NULL UNIQUE,
      auth0_sub   TEXT    UNIQUE,
      localization TEXT,
      photo       TEXT,
      role        TEXT    DEFAULT 'buyer',
      subscription_plan   TEXT    DEFAULT 'free',
      subscription_status TEXT    DEFAULT 'inactive',
      subscription_expiry TEXT,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now')),
      deleted_at  TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL CHECK(length(name) <= 255),
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      category     TEXT    DEFAULT 'PRODUTOS',
      location     TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS inputs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL CHECK(length(name) <= 255),
      quantity     REAL    NOT NULL DEFAULT 0,
      price        REAL    NOT NULL,
      photo        TEXT,
      publish_date TEXT    DEFAULT (date('now')),
      user_id      INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS transports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      transport_type TEXT    NOT NULL CHECK(length(transport_type) <= 50),
      name           TEXT    NOT NULL CHECK(length(name) <= 255),
      price_per_km   REAL    NOT NULL,
      photo          TEXT,
      location       TEXT,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      created_at     TEXT    DEFAULT (datetime('now')),
      updated_at     TEXT    DEFAULT (datetime('now')),
      deleted_at     TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS negotiations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id     INTEGER NOT NULL REFERENCES users(id),
      seller_id    INTEGER REFERENCES users(id),
      product_id   INTEGER REFERENCES products(id),
      input_id     INTEGER REFERENCES inputs(id),
      transport_id INTEGER REFERENCES transports(id),
      status       TEXT    DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now')),
      deleted_at   TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
      sender_id      INTEGER NOT NULL REFERENCES users(id),
      body           TEXT    CHECK(length(body) <= 1000),
      attachment_url TEXT,
      attachment_type TEXT,
      is_read        INTEGER DEFAULT 0,
      timestamp      TEXT    DEFAULT (datetime('now')),
      deleted_at     TEXT    DEFAULT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS prices (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      product  TEXT    NOT NULL CHECK(length(product) <= 255),
      price    TEXT    NOT NULL,
      unit     TEXT    NOT NULL DEFAULT 'MT/kg',
      location TEXT    NOT NULL,
      date     TEXT    NOT NULL,
      trend    TEXT    DEFAULT 'stable',
      created_at TEXT  DEFAULT (datetime('now'))
    )`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      target_id INTEGER NOT NULL REFERENCES users(id),
      negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT CHECK(length(comment) <= 300),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT DEFAULT NULL,
      CHECK (reviewer_id != target_id)
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id     INTEGER REFERENCES users(id),
      action       TEXT    NOT NULL,
      entity_type  TEXT    NOT NULL,
      entity_id    INTEGER,
      method       TEXT    NOT NULL,
      endpoint     TEXT    NOT NULL,
      old_data     TEXT,
      new_data     TEXT,
      ip_address   TEXT,
      user_agent   TEXT,
      created_at   TEXT    DEFAULT (datetime('now'))
    )`,

    // ─── NOVO DOMÍNIO: GESTÃO DE GRUPOS DE PRODUTORES AGRÍCOLAS ───────────

    // 1. Organizações (Cooperativas, Associações, ONGs, Projetos de Desenvolvimento)
    `CREATE TABLE IF NOT EXISTS organizations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid TEXT UNIQUE,
      name        TEXT NOT NULL CHECK(length(name) <= 255),
      description TEXT,
      type        TEXT NOT NULL CHECK(type IN ('cooperative', 'association', 'ngo', 'agricultural_company', 'development_project', 'government_program')),
      country     TEXT DEFAULT 'Moçambique',
      province    TEXT NOT NULL,
      district    TEXT NOT NULL,
      address     TEXT,
      phone       TEXT,
      email       TEXT,
      logo        TEXT,
      status      TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now')),
      deleted_at  TEXT DEFAULT NULL
    )`,

    // 2. Utilizadores da Organização e Papéis (RBAC)
    `CREATE TABLE IF NOT EXISTS organization_users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      user_id         INTEGER NOT NULL REFERENCES users(id),
      role            TEXT NOT NULL CHECK(role IN ('org_admin', 'group_manager', 'field_officer', 'farmer')),
      status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL,
      UNIQUE(organization_id, user_id)
    )`,

    // 3. Grupos de Produtores
    `CREATE TABLE IF NOT EXISTS groups (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid     TEXT UNIQUE,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      name            TEXT NOT NULL CHECK(length(name) <= 255),
      description     TEXT,
      province        TEXT NOT NULL,
      district        TEXT NOT NULL,
      locality        TEXT,
      latitude        REAL,
      longitude       REAL,
      manager_id      INTEGER REFERENCES users(id),
      status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL
    )`,

    // 4. Atribuição de Gestores a Grupos
    `CREATE TABLE IF NOT EXISTS user_group_assignments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      user_id         INTEGER NOT NULL REFERENCES users(id),
      group_id        INTEGER NOT NULL REFERENCES groups(id),
      created_at      TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, group_id)
    )`,

    // 5. Produtores Agrícolas
    `CREATE TABLE IF NOT EXISTS farmers (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid                 TEXT UNIQUE,
      organization_id             INTEGER NOT NULL REFERENCES organizations(id),
      group_id                    INTEGER NOT NULL REFERENCES groups(id),
      user_id                     INTEGER REFERENCES users(id),
      name                        TEXT NOT NULL CHECK(length(name) <= 255),
      gender                      TEXT CHECK(gender IN ('M', 'F', 'other')),
      birth_date                  TEXT,
      phone                       TEXT,
      id_document                 TEXT,
      photo                       TEXT,
      province                    TEXT NOT NULL,
      district                    TEXT NOT NULL,
      administrative_post         TEXT,
      locality                    TEXT,
      address                     TEXT,
      latitude                    REAL,
      longitude                   REAL,
      agricultural_experience_years INTEGER DEFAULT 0,
      main_crops                  TEXT,
      estimated_total_area        REAL DEFAULT 0,
      status                      TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at                  TEXT DEFAULT (datetime('now')),
      updated_at                  TEXT DEFAULT (datetime('now')),
      deleted_at                  TEXT DEFAULT NULL
    )`,

    // 6. Machambas (Propriedades / Parcelas Agrícolas)
    `CREATE TABLE IF NOT EXISTS farms (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid     TEXT UNIQUE,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      farmer_id       INTEGER NOT NULL REFERENCES farmers(id),
      name            TEXT NOT NULL CHECK(length(name) <= 255),
      location        TEXT,
      province        TEXT NOT NULL,
      district        TEXT NOT NULL,
      locality        TEXT,
      latitude        REAL,
      longitude       REAL,
      total_area      REAL NOT NULL DEFAULT 0,
      cultivated_area REAL NOT NULL DEFAULT 0,
      soil_type       TEXT,
      irrigation_type TEXT,
      status          TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'abandoned')),
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL
    )`,

    // 7. Ciclos de Produção (Campanhas Agrícolas)
    `CREATE TABLE IF NOT EXISTS production_cycles (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid     TEXT UNIQUE,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      name            TEXT NOT NULL,
      start_date      TEXT NOT NULL,
      end_date        TEXT NOT NULL,
      season          TEXT,
      status          TEXT DEFAULT 'active' CHECK(status IN ('planned', 'active', 'completed', 'archived')),
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL
    )`,

    // 8. Culturas
    `CREATE TABLE IF NOT EXISTS crops (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER REFERENCES organizations(id),
      name            TEXT NOT NULL CHECK(length(name) <= 255),
      category        TEXT NOT NULL CHECK(category IN ('cereais', 'leguminosas', 'hortícolas', 'frutas', 'tubérculos', 'outras')),
      default_unit    TEXT NOT NULL DEFAULT 'kg',
      description     TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL
    )`,

    // 9. Registos de Produção (Cultivo e Colheita)
    `CREATE TABLE IF NOT EXISTS production_records (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid          TEXT UNIQUE,
      organization_id      INTEGER NOT NULL REFERENCES organizations(id),
      cycle_id             INTEGER NOT NULL REFERENCES production_cycles(id),
      farm_id              INTEGER NOT NULL REFERENCES farms(id),
      farmer_id            INTEGER NOT NULL REFERENCES farmers(id),
      crop_id              INTEGER NOT NULL REFERENCES crops(id),
      planted_area_ha      REAL NOT NULL DEFAULT 0,
      planting_date        TEXT,
      estimated_production REAL DEFAULT 0,
      current_stage        TEXT DEFAULT 'planted' CHECK(current_stage IN ('planned', 'planted', 'growing', 'ready_for_harvest', 'harvested', 'completed')),
      harvested_quantity   REAL DEFAULT 0,
      loss_quantity        REAL DEFAULT 0,
      loss_reason          TEXT,
      notes                TEXT,
      created_at           TEXT DEFAULT (datetime('now')),
      updated_at           TEXT DEFAULT (datetime('now')),
      deleted_at           TEXT DEFAULT NULL
    )`,

    // 10. Catálogo de Insumos da Organização
    `CREATE TABLE IF NOT EXISTS input_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      name            TEXT NOT NULL CHECK(length(name) <= 255),
      category        TEXT NOT NULL CHECK(category IN ('sementes', 'fertilizantes', 'pesticidas', 'ferramentas', 'equipamentos', 'outros')),
      unit            TEXT NOT NULL DEFAULT 'kg',
      description     TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now')),
      deleted_at      TEXT DEFAULT NULL
    )`,

    // 11. Entradas de Estoque de Insumos
    `CREATE TABLE IF NOT EXISTS input_inventory (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id    INTEGER NOT NULL REFERENCES organizations(id),
      input_id           INTEGER NOT NULL REFERENCES input_items(id),
      batch_number       TEXT,
      quantity_received  REAL NOT NULL,
      quantity_available REAL NOT NULL,
      unit_cost          REAL DEFAULT 0,
      supplier           TEXT,
      received_date      TEXT DEFAULT (date('now')),
      notes              TEXT,
      created_at         TEXT DEFAULT (datetime('now')),
      updated_at         TEXT DEFAULT (datetime('now')),
      deleted_at         TEXT DEFAULT NULL
    )`,

    // 12. Distribuição de Insumos para Produtores
    `CREATE TABLE IF NOT EXISTS input_distributions (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid           TEXT UNIQUE,
      organization_id       INTEGER NOT NULL REFERENCES organizations(id),
      input_id              INTEGER NOT NULL REFERENCES input_items(id),
      inventory_id          INTEGER REFERENCES input_inventory(id),
      farmer_id             INTEGER NOT NULL REFERENCES farmers(id),
      cycle_id              INTEGER REFERENCES production_cycles(id),
      crop_id               INTEGER REFERENCES crops(id),
      quantity              REAL NOT NULL,
      unit                  TEXT NOT NULL,
      distribution_date     TEXT DEFAULT (date('now')),
      distributed_by_user_id INTEGER REFERENCES users(id),
      purpose               TEXT,
      notes                 TEXT,
      created_at            TEXT DEFAULT (datetime('now')),
      updated_at            TEXT DEFAULT (datetime('now')),
      deleted_at            TEXT DEFAULT NULL
    )`,

    // Índices de Desempenho e Multi-Tenancy
    `CREATE INDEX IF NOT EXISTS idx_org_users_org ON organization_users(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_groups_org ON groups(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_farmers_org_group ON farmers(organization_id, group_id)`,
    `CREATE INDEX IF NOT EXISTS idx_farms_org_farmer ON farms(organization_id, farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_cycles_org ON production_cycles(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_production_org_cycle ON production_records(organization_id, cycle_id)`,
    `CREATE INDEX IF NOT EXISTS idx_production_farmer ON production_records(farmer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_input_items_org ON input_items(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_input_dist_org_farmer ON input_distributions(organization_id, farmer_id)`
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }

  // Safe column migration — ignore errors if columns already exist
  const migrations: string[] = [
    "ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0",
    "ALTER TABLE messages ADD COLUMN attachment_url TEXT",
    "ALTER TABLE messages ADD COLUMN attachment_type TEXT",
    "ALTER TABLE messages ADD COLUMN deleted_at TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN subscription_plan TEXT DEFAULT 'free'",
    "ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'inactive'",
    "ALTER TABLE users ADD COLUMN subscription_expiry TEXT",
    "ALTER TABLE users ADD COLUMN organization_id INTEGER REFERENCES organizations(id)",
  ];

  for (const m of migrations) {
    try { await db.execute(m); } catch { /* column already exists */ }
  }
}

// ─── Seed data (só insere se a DB estiver vazia) ──────────────────────────────
async function seedData(db: Client) {
  const result = await db.execute('SELECT COUNT(*) as c FROM users');
  const count = Number(result.rows[0]?.c ?? 0);
  if (count > 0) return; // Já foi initializada

  // Utilizadores demo
  const users: InStatement[] = [
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Armando Maputo', '841234567', 'auth0|mock_user_1', 'Nampula', 'super_admin'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Maria da Graça', '879876543', 'auth0|mock_user_2', 'Monapo', 'org_admin'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['João Transportes', '862345678', 'auth0|mock_user_3', 'Nacala-Porto', 'group_manager'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Técnico Agostinho', '849988776', 'auth0|mock_user_4', 'Rapale', 'field_officer'] },
    { sql: `INSERT INTO users (name, mobile_number, auth0_sub, localization, role) VALUES (?, ?, ?, ?, ?)`,
      args: ['Inspetor Silva', '851122334', 'auth0|mock_user_5', 'Monapo', 'org_admin'] },
  ];

  // Organizações Demo
  const orgs: InStatement[] = [
    { sql: `INSERT INTO organizations (name, description, type, province, district, address, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['Cooperativa Agrícola de Nampula (COOPAN)', 'União de pequenos produtores rurais de Nampula focada em cereais e hortícolas', 'cooperative', 'Nampula', 'Rapale', 'Av. do Trabalho, Km 7', '+258 84 123 4567', 'contato@coopan.org.mz', 'active'] },
    { sql: `INSERT INTO organizations (name, description, type, province, district, address, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['Associação Agro-Pecuária de Monapo', 'Associação distrital para fomento de leguminosas e tubérculos', 'association', 'Nampula', 'Monapo', 'Rua Central, Edifício Comunitário', '+258 87 987 6543', 'geral@agro-monapo.org.mz', 'active'] },
  ];

  // Executar users e orgs
  await db.batch([...users, ...orgs], 'write');

  // Vincular utilizadores às organizações
  const orgUsers: InStatement[] = [
    { sql: `INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)`,
      args: [1, 1, 'org_admin'] },
    { sql: `INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)`,
      args: [1, 2, 'org_admin'] },
    { sql: `INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)`,
      args: [1, 3, 'group_manager'] },
    { sql: `INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)`,
      args: [1, 4, 'field_officer'] },
    { sql: `INSERT INTO organization_users (organization_id, user_id, role) VALUES (?, ?, ?)`,
      args: [2, 5, 'org_admin'] },
  ];
  await db.batch(orgUsers, 'write');

  // Grupos de Produtores
  const groups: InStatement[] = [
    { sql: `INSERT INTO groups (organization_id, name, description, province, district, locality, latitude, longitude, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 'Pólo Rapale - Zona Norte', 'Grupo dedicado à produção intensiva de milho e hortícolas de regadio', 'Nampula', 'Rapale', 'Rapale Sede', -15.0833, 39.1167, 3, 'active'] },
    { sql: `INSERT INTO groups (organization_id, name, description, province, district, locality, latitude, longitude, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 'Pólo Namialo - Rio Monapo', 'Produtores de feijão, amendoim e gergelim', 'Nampula', 'Meconta', 'Namialo', -14.9833, 39.8833, 3, 'active'] },
    { sql: `INSERT INTO groups (organization_id, name, description, province, district, locality, latitude, longitude, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 'Pólo Monapo Centro', 'Grupo de fomento de mandioca processada e horticultura', 'Nampula', 'Monapo', 'Monapo Vila', -14.9000, 40.3000, 5, 'active'] },
  ];
  await db.batch(groups, 'write');

  // Atribuição de gestor ao grupo
  await db.execute({
    sql: `INSERT INTO user_group_assignments (organization_id, user_id, group_id) VALUES (?, ?, ?)`,
    args: [1, 3, 1],
  });

  // Produtores
  const farmers: InStatement[] = [
    { sql: `INSERT INTO farmers (organization_id, group_id, name, gender, birth_date, phone, province, district, administrative_post, locality, agricultural_experience_years, main_crops, estimated_total_area, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 'João Mário Cossa', 'M', '1982-04-12', '841112233', 'Nampula', 'Rapale', 'Rapale Sede', 'Bairro 1', 12, 'Milho, Feijão Boer', 3.5, 'active'] },
    { sql: `INSERT INTO farmers (organization_id, group_id, name, gender, birth_date, phone, province, district, administrative_post, locality, agricultural_experience_years, main_crops, estimated_total_area, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 'Maria Sumaila Abdala', 'F', '1988-09-25', '842223344', 'Nampula', 'Rapale', 'Rapale Sede', 'Namaita', 8, 'Tomate, Cebola, Repolho', 1.8, 'active'] },
    { sql: `INSERT INTO farmers (organization_id, group_id, name, gender, birth_date, phone, province, district, administrative_post, locality, agricultural_experience_years, main_crops, estimated_total_area, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 'António Sitoe Moiane', 'M', '1975-11-03', '843334455', 'Nampula', 'Rapale', 'Anchilo', 'Marrere', 20, 'Mandioca, Amendoim', 4.0, 'active'] },
    { sql: `INSERT INTO farmers (organization_id, group_id, name, gender, birth_date, phone, province, district, administrative_post, locality, agricultural_experience_years, main_crops, estimated_total_area, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 2, 'Carlos Alberto Mário', 'M', '1990-01-15', '844445566', 'Nampula', 'Meconta', 'Namialo', 'Posto Namialo', 6, 'Feijão Manteiga, Soja', 2.5, 'active'] },
    { sql: `INSERT INTO farmers (organization_id, group_id, name, gender, birth_date, phone, province, district, administrative_post, locality, agricultural_experience_years, main_crops, estimated_total_area, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 3, 'Ana Mondlane Nguenha', 'F', '1986-07-19', '875556677', 'Nampula', 'Monapo', 'Monapo Sede', 'Aldeia da Paz', 10, 'Mandioca Doce, Hortícolas', 2.0, 'active'] },
  ];
  await db.batch(farmers, 'write');

  // Machambas
  const farms: InStatement[] = [
    { sql: `INSERT INTO farms (organization_id, farmer_id, name, province, district, locality, total_area, cultivated_area, soil_type, irrigation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 'Machamba Vale do Rapale', 'Nampula', 'Rapale', 'Rapale Sede', 3.5, 2.5, 'Franco-argiloso', 'Sequeiro com apoio fluvial', 'active'] },
    { sql: `INSERT INTO farms (organization_id, farmer_id, name, province, district, locality, total_area, cultivated_area, soil_type, irrigation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 2, 'Horta Namaita Regadio', 'Nampula', 'Rapale', 'Namaita', 1.8, 1.5, 'Aluvial fértil', 'Gotejamento manual', 'active'] },
    { sql: `INSERT INTO farms (organization_id, farmer_id, name, province, district, locality, total_area, cultivated_area, soil_type, irrigation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 3, 'Machamba de Marrere', 'Nampula', 'Rapale', 'Marrere', 4.0, 3.2, 'Arenoso-argiloso', 'Sequeiro', 'active'] },
    { sql: `INSERT INTO farms (organization_id, farmer_id, name, province, district, locality, total_area, cultivated_area, soil_type, irrigation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 4, 'Parcela Namialo Sul', 'Nampula', 'Meconta', 'Namialo', 2.5, 2.0, 'Franco-arenoso', 'Sequeiro', 'active'] },
    { sql: `INSERT INTO farms (organization_id, farmer_id, name, province, district, locality, total_area, cultivated_area, soil_type, irrigation_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 5, 'Machamba Comunitária Monapo', 'Nampula', 'Monapo', 'Aldeia da Paz', 2.0, 1.8, 'Franco-argiloso', 'Sequeiro', 'active'] },
  ];
  await db.batch(farms, 'write');

  // Ciclos de Produção
  const cycles: InStatement[] = [
    { sql: `INSERT INTO production_cycles (organization_id, name, start_date, end_date, season, status) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [1, 'Campanha Agrícola Principal 2026/2027', '2026-01-10', '2026-07-30', 'Época Chuvosa / Principal', 'active'] },
    { sql: `INSERT INTO production_cycles (organization_id, name, start_date, end_date, season, status) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [1, 'Campanha de Hortícolas de Fresco 2026', '2026-04-01', '2026-09-30', 'Época Seca / Fresca', 'planned'] },
    { sql: `INSERT INTO production_cycles (organization_id, name, start_date, end_date, season, status) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [2, 'Campanha Anual Monapo 2026', '2026-01-15', '2026-08-15', 'Época Principal', 'active'] },
  ];
  await db.batch(cycles, 'write');

  // Culturas Padrão
  const crops: InStatement[] = [
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Milho Branco', 'cereais', 'kg', 'Variedade alimentar de alto rendimento energético'] },
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Feijão Manteiga', 'leguminosas', 'kg', 'Leguminosa rica em proteínas para consumo e venda local'] },
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Tomate Roma', 'hortícolas', 'kg', 'Tomate industrial e de mesa com boa resistência a transporte'] },
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Mandioca Doce', 'tubérculos', 'kg', 'Tubérculo de segurança alimentar e processamento de farinha'] },
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Amendoim Corrente', 'leguminosas', 'kg', 'Cultura comercial e de rotação fixadora de nitrogénio'] },
    { sql: `INSERT INTO crops (organization_id, name, category, default_unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [null, 'Soja Grão', 'leguminosas', 'kg', 'Produção destinada à avicultura e indústria de óleo'] },
  ];
  await db.batch(crops, 'write');

  // Registos de Produção (com plantio, estimativa, colheita e perdas)
  const productionRecords: InStatement[] = [
    { sql: `INSERT INTO production_records (organization_id, cycle_id, farm_id, farmer_id, crop_id, planted_area_ha, planting_date, estimated_production, current_stage, harvested_quantity, loss_quantity, loss_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 1, 1, 1, 2.0, '2026-01-20', 4000, 'harvested', 3700, 300, 'Ataque pontual de lagarta do cartucho', 'Colheita realizada com apoio do grupo'] },
    { sql: `INSERT INTO production_records (organization_id, cycle_id, farm_id, farmer_id, crop_id, planted_area_ha, planting_date, estimated_production, current_stage, harvested_quantity, loss_quantity, loss_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 2, 2, 3, 1.2, '2026-02-10', 5000, 'harvested', 4600, 400, 'Queimadura solar e transporte', 'Boa cotação no mercado local'] },
    { sql: `INSERT INTO production_records (organization_id, cycle_id, farm_id, farmer_id, crop_id, planted_area_ha, planting_date, estimated_production, current_stage, harvested_quantity, loss_quantity, loss_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 3, 3, 4, 3.0, '2026-01-25', 12000, 'growing', 0, 0, null, 'Desenvolvimento vegetativo vigoroso'] },
    { sql: `INSERT INTO production_records (organization_id, cycle_id, farm_id, farmer_id, crop_id, planted_area_ha, planting_date, estimated_production, current_stage, harvested_quantity, loss_quantity, loss_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 4, 4, 2, 1.8, '2026-02-05', 2200, 'ready_for_harvest', 0, 0, null, 'Vagens prontas para arranque na próxima semana'] },
    { sql: `INSERT INTO production_records (organization_id, cycle_id, farm_id, farmer_id, crop_id, planted_area_ha, planting_date, estimated_production, current_stage, harvested_quantity, loss_quantity, loss_reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 3, 5, 5, 4, 1.5, '2026-01-30', 6000, 'growing', 0, 0, null, 'Machamba comunitária Monapo'] },
  ];
  await db.batch(productionRecords, 'write');

  // Catálogo de Insumos da Organização
  const inputItems: InStatement[] = [
    { sql: `INSERT INTO input_items (organization_id, name, category, unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [1, 'Sementes de Milho PAN 53', 'sementes', 'kg', 'Semente híbrida certificada de ciclo médio com alta resistência a seca'] },
    { sql: `INSERT INTO input_items (organization_id, name, category, unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [1, 'Fertilizante NPK 12-24-12', 'fertilizantes', 'kg', 'Adubo de fundo para desenvolvimento radicular de cereais'] },
    { sql: `INSERT INTO input_items (organization_id, name, category, unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [1, 'Ureia 46%', 'fertilizantes', 'kg', 'Adubo de cobertura azotado para estímulo foliar'] },
    { sql: `INSERT INTO input_items (organization_id, name, category, unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [1, 'Pulverizador Manual 16L', 'equipamentos', 'unidade', 'Pulverizador costal com bicos de jato cónico e plano'] },
    { sql: `INSERT INTO input_items (organization_id, name, category, unit, description) VALUES (?, ?, ?, ?, ?)`,
      args: [2, 'Sementes de Feijão Manteiga Sel. A', 'sementes', 'kg', 'Semente certificada para a campanha distrital de Monapo'] },
  ];
  await db.batch(inputItems, 'write');

  // Inventário de Insumos (Entradas de estoque)
  const inputInventory: InStatement[] = [
    { sql: `INSERT INTO input_inventory (organization_id, input_id, batch_number, quantity_received, quantity_available, unit_cost, supplier, received_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 'LOTE-PAN-2026-01', 500, 420, 120, 'SeedCo Moçambique', '2026-01-05'] },
    { sql: `INSERT INTO input_inventory (organization_id, input_id, batch_number, quantity_received, quantity_available, unit_cost, supplier, received_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 2, 'LOTE-NPK-2026-03', 2500, 2100, 50, 'MozAgro Distribuidora', '2026-01-08'] },
    { sql: `INSERT INTO input_inventory (organization_id, input_id, batch_number, quantity_received, quantity_available, unit_cost, supplier, received_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 4, 'LOTE-PULV-2026', 30, 22, 1500, 'AgroTech Ferramentas', '2026-01-12'] },
    { sql: `INSERT INTO input_inventory (organization_id, input_id, batch_number, quantity_received, quantity_available, unit_cost, supplier, received_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 5, 'LOTE-FEIJ-MONAPO', 300, 250, 90, 'Casa do Agricultor', '2026-01-10'] },
  ];
  await db.batch(inputInventory, 'write');

  // Distribuição de Insumos aos Produtores
  const inputDistributions: InStatement[] = [
    { sql: `INSERT INTO input_distributions (organization_id, input_id, inventory_id, farmer_id, cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id, purpose, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 1, 1, 1, 1, 1, 50, 'kg', '2026-01-15', 4, 'Plantio de 2.0ha de milho', 'Entregue em saco selado'] },
    { sql: `INSERT INTO input_distributions (organization_id, input_id, inventory_id, farmer_id, cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id, purpose, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 2, 2, 1, 1, 1, 200, 'kg', '2026-01-18', 4, 'Adubação de fundo para milho', '4 sacos de 50kg'] },
    { sql: `INSERT INTO input_distributions (organization_id, input_id, inventory_id, farmer_id, cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id, purpose, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [1, 4, 3, 2, 1, 3, 1, 'unidade', '2026-02-01', 4, 'Tratamento fitossanitário do tomateiro', 'Equipamento consignado'] },
    { sql: `INSERT INTO input_distributions (organization_id, input_id, inventory_id, farmer_id, cycle_id, crop_id, quantity, unit, distribution_date, distributed_by_user_id, purpose, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [2, 5, 4, 5, 3, 2, 50, 'kg', '2026-01-20', 5, 'Campanha distrital de feijão', 'Distribuição inicial'] },
  ];
  await db.batch(inputDistributions, 'write');

  // ─── Marketplace Legado (preservado para compatibilidade e módulos futuros) ───
  const productSQL = `INSERT INTO products (name, quantity, price, photo, category, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const products: InStatement[] = [
    { sql: productSQL, args: ['Tomate Vermelho — 50kg', 200, 70, '/products/tomate.png', 'PRODUTOS', 'Nampula', 1] },
    { sql: productSQL, args: ['Milho Branco — 100kg', 500, 45, '/products/milho.png', 'PRODUTOS', 'Monapo', 1] },
    { sql: productSQL, args: ['Feijão Manteiga — 25kg', 150, 120, '/products/feijao.png', 'PRODUTOS', 'Murrupula', 2] },
    { sql: productSQL, args: ['Arroz Carolino — 50kg', 80, 85, '/products/arroz.png', 'PRODUTOS', 'Nampula', 1] },
    { sql: productSQL, args: ['Mandioca Fresca — 30kg', 300, 25, '/products/mandioca.png', 'PRODUTOS', 'Meconta', 3] },
    { sql: productSQL, args: ['Batata-doce — 20kg', 120, 35, '/products/batata_doce.png', 'PRODUTOS', 'Angoche', 2] },
    { sql: productSQL, args: ['Amendoim — 10kg', 400, 95, '/products/amendoim.png', 'PRODUTOS', 'Ribaué', 1] },
    { sql: productSQL, args: ['Caju — 15kg', 60, 150, '/products/caju.png', 'PRODUTOS', 'Memba', 3] },
    { sql: productSQL, args: ['Gergelim — 5kg', 200, 180, '/products/gergelim.png', 'PRODUTOS', 'Malema', 2] },
    { sql: productSQL, args: ['Soja — 40kg', 250, 65, '/products/soja.png', 'PRODUTOS', 'Rapale', 1] },
    { sql: productSQL, args: ['Banana Madura — caixa', 90, 40, '/products/banana.png', 'PRODUTOS', 'Moma', 3] },
    { sql: productSQL, args: ['Papaia — 20kg', 70, 30, '/products/papaia.png', 'PRODUTOS', 'Nacala-Porto', 2] },
  ];

  // Insumos legado
  const inputSQL = `INSERT INTO inputs (name, quantity, price, photo, user_id) VALUES (?, ?, ?, ?, ?)`;
  const inputsLegacy: InStatement[] = [
    { sql: inputSQL, args: ['Fertilizante NPK — 50kg', 100, 2500, '/products/fertilizante.png', 1] },
    { sql: inputSQL, args: ['Sementes de Milho — 10kg', 50, 1200, '/products/sementes_milho.png', 1] },
  ];

  // Transportes legado
  const transportSQL = `INSERT INTO transports (transport_type, name, price_per_km, photo, location, user_id) VALUES (?, ?, ?, ?, ?, ?)`;
  const transports: InStatement[] = [
    { sql: transportSQL, args: ['Camião', 'Camião 10 Toneladas', 2.5, 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=400', 'Nampula', 1] },
    { sql: transportSQL, args: ['Pick-up', 'Pick-up Toyota Hilux', 1.2, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400', 'Monapo', 1] },
  ];

  // Preços de mercado
  const priceSQL = `INSERT INTO prices (product, price, unit, location, date, trend) VALUES (?, ?, ?, ?, ?, ?)`;
  const prices: InStatement[] = [
    { sql: priceSQL, args: ['Tomate', '70', 'MT/kg', 'Nampula', '01 Abr 2026', 'up'] },
    { sql: priceSQL, args: ['Milho', '45', 'MT/kg', 'Monapo', '01 Abr 2026', 'stable'] },
    { sql: priceSQL, args: ['Feijão', '120', 'MT/kg', 'Murrupula', '01 Abr 2026', 'up'] },
  ];

  await db.batch([...products, ...inputsLegacy, ...transports, ...prices], 'write');

  // Negociação de exemplo (pendente)
  await db.execute({
    sql: `INSERT INTO negotiations (buyer_id, seller_id, product_id, status) VALUES (?, ?, ?, 'pending')`,
    args: [2, 1, 1],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [1, 2, 'Bom dia! Tenho interesse no Tomate. Ainda está disponível?'],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [1, 1, 'Bom dia! Sim, ainda tenho stock. Posso vender 50kg a 65 MT/kg.'],
  });

  // Negociação concluída para TDD e testes do Review zero-trust
  await db.execute({
    sql: `INSERT INTO negotiations (buyer_id, seller_id, product_id, status) VALUES (?, ?, ?, 'completed')`,
    args: [1, 2, 2],
  });

  await db.execute({
    sql: `INSERT INTO messages (negotiation_id, sender_id, body) VALUES (?, ?, ?)`,
    args: [2, 1, 'Vou comprar o milho.'],
  });
}

