# Guia de Operação e Deployment (Wamini B2B)

Este projeto está configurado para ser entregue via **Coolify** ou **Docker (Nixpacks)** num servidor Hetzner/Linux.

## 🚀 Requisitos de Produção

### 1. Variáveis de Ambiente (.env)
Preencha as seguintes variáveis no seu painel de controlo (ex: Coolify Dashboard):

*   **AUTH0_SECRET**: Chave aleatória de 32 hex chars.
*   **AUTH0_BASE_URL**: O URL público final (ex: `https://wamini.moz`).
*   **AUTH0_ISSUER_BASE_URL**: O URL do seu Tenant Auth0.
*   **DATABASE_URL**: `/data/wamini.db` (Importante para persistência).

### 2. Persistência da Base de Dados (CRÍTICO)
Como o projeto utiliza **better-sqlite3**, os dados (users, logs de auditoria e produtos) são locais. Para evitar perda de dados em cada deploy:

1.  No Coolify, vá a **Storage / Volumes**.
2.  Crie um volume apontando o caminho local do host para o caminho do contentor:
    *   **Host Path**: `/var/lib/docker/volumes/wamini_db/_data`
    *   **Container Path**: `/app/.db` (ou o caminho configurado no `DATABASE_URL`).

### 3. Build Automatizado (Nixpacks)
O ficheiro `nixpacks.toml` já trata da compilação nativa do SQLite. O comando de build será automático:
1.  `npm install`
2.  `npm run build`
3.  `npm run start`

---

## 🔒 Post-Deployment (Hardenized Admin)
Após o primeiro login bem-sucedido, utilize o script de promoção para garantir acesso ao dashboard de compliance:
`docker exec -it <container_id> node promote_admin.js 1`

## 🛠️ Manutenção
Para verificar integridade da base de dados e auditoria em produção:
`node run_migration.js`
