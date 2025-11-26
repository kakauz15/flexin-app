# FlexIN - Guia de Desenvolvimento

## 📋 Sobre o Projeto

FlexIN é uma aplicação de gerenciamento de home office desenvolvida com React Native (Expo) e backend Hono + tRPC, utilizando MySQL como banco de dados.

---

## 🗄️ Banco de Dados

### Configuração MySQL

**Credenciais:**
- Host: `127.0.0.1`
- Usuário: `root`
- Senha: `root`
- Database: `flexin`

### Estrutura de Tabelas

O banco possui 7 tabelas principais:

1. **departments** - Departamentos da empresa
2. **users** - Usuários do sistema
3. **bookings** - Reservas de home office
4. **swap_requests** - Solicitações de troca de dias
5. **app_settings** - Configurações globais
6. **admin_announcements** - Anúncios administrativos
7. **blocked_dates** - Datas bloqueadas

### Usuários de Teste

Todos os usuários têm a senha: **`123456`**

| Nome | Email | Departamento | Admin |
|------|-------|--------------|-------|
| Ana Silva | ana.silva@company.com | Engenharia | ✅ Sim |
| Carlos Santos | carlos.santos@company.com | Produto | ❌ Não |
| Marina Costa | marina.costa@company.com | Design | ❌ Não |
| Pedro Alves | pedro.alves@company.com | Engenharia | ❌ Não |
| Julia Ferreira | julia.ferreira@company.com | Marketing | ❌ Não |

---

## 🚀 Como Executar o Projeto (Tutorial Completo)

### Pré-requisitos

1. **MySQL** instalado e rodando
2. **Node.js** (v18+) ou **Bun** instalado
3. **Expo CLI** (instalado automaticamente com as dependências)

### Passo 1: Configurar o Banco de Dados

```bash
# 1. Inicie o MySQL (se não estiver rodando)
# Windows:
net start MySQL80

# 2. Crie o banco de dados (apenas primeira vez)
mysql -u root -p
# No prompt do MySQL:
CREATE DATABASE flexin;
exit;
```

### Passo 2: Instalar Dependências

```bash
# Com npm
npm install

# OU com bun (mais rápido)
bun install
```

### Passo 3: Configurar o Schema do Banco

```bash
# Aplicar o schema ao banco de dados
npm run db:push
```

### Passo 4: Popular o Banco com Dados Mock

```bash
# Executar o seeder
npm run db:seed
```

Isso criará:
- 4 departamentos
- 5 usuários (senha: `123456`)
- 6 bookings
- 2 swap requests
- Configurações padrão

### Passo 5: Iniciar o Backend

```bash
# Terminal 1 - Iniciar servidor backend
npm run dev
```

O backend estará rodando em: `http://localhost:3000`

### Passo 6: Iniciar o Frontend

```bash
# Terminal 2 - Iniciar Expo
npm run expo

# OU para web diretamente
npm run web
```

### 🎉 Pronto!

Agora você tem:
- ✅ Backend rodando na porta 3000
- ✅ Frontend Expo rodando
- ✅ Banco de dados populado com dados de teste

---

## 📋 Comandos Disponíveis

### Desenvolvimento

```bash
# Iniciar backend (Hono + tRPC)
npm run dev
npm run backend        # Alias para 'dev'

# Iniciar frontend Expo
npm run expo           # Menu interativo
npm run web            # Web diretamente
npm run android        # Android diretamente
npm run ios            # iOS diretamente

# Lint
npm run lint
```

### Banco de Dados

```bash
# Aplicar mudanças no schema ao banco
npm run db:push

# Gerar migrations (para produção)
npm run db:generate

# Popular banco com dados mock
npm run db:seed

# Abrir Drizzle Studio (visualizar banco)
npm run db:studio
```

---

## 🔄 Workflow Diário de Desenvolvimento

### Início do Dia

```bash
# 1. Verificar se MySQL está rodando
# 2. Abrir 2 terminais

# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run expo
```

### Fazer Login no App

Use qualquer um dos usuários de teste:
- **Email:** `ana.silva@company.com`
- **Senha:** `123456`

### Resetar Banco de Dados

```bash
# Se precisar limpar e repopular o banco
npm run db:seed
```

---

## 📁 Estrutura do Projeto

```
FlexIN/
├── app/                    # Rotas do Expo Router
├── backend/
│   ├── db/
│   │   ├── index.ts       # Configuração do Drizzle
│   │   ├── schema.ts      # Schema do banco de dados
│   │   └── seed.ts        # Seeder com dados mock
│   ├── routers/           # Routers tRPC
│   └── server.ts          # Servidor Hono
├── components/            # Componentes React Native
├── hooks/                 # Custom hooks
├── services/              # Serviços e lógica de negócio
├── types/                 # Definições TypeScript
├── KB/                    # Knowledge Base
│   └── kaue.md           # Este arquivo
└── drizzle.config.ts     # Configuração Drizzle Kit
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React Native** (0.81.5) - Framework mobile
- **Expo** (54.0.20) - Toolchain e SDK
- **Expo Router** (6.0.13) - Navegação baseada em arquivos
- **NativeWind** (4.1.23) - Tailwind CSS para React Native
- **Lucide React Native** - Ícones

### Backend
- **Hono** (4.10.5) - Framework web minimalista
- **tRPC** (11.7.1) - Type-safe API
- **Drizzle ORM** (0.44.7) - ORM TypeScript-first
- **MySQL2** (3.15.3) - Driver MySQL

### Autenticação
- **bcryptjs** (3.0.3) - Hash de senhas
- **jsonwebtoken** (9.0.2) - JWT tokens

### State Management
- **Zustand** (5.0.2) - State management
- **TanStack Query** (5.90.8) - Data fetching e cache

### Utilitários
- **date-fns** (4.1.0) - Manipulação de datas
- **zod** (4.1.12) - Validação de schemas
- **superjson** (2.2.5) - Serialização JSON

---

## 🔐 Autenticação

O sistema suporta múltiplos métodos de autenticação:

- **Local** (email/senha)
- **Google OAuth**
- **LinkedIn OAuth**
- **Microsoft OAuth**

### Fluxo de Autenticação

1. Usuário faz login com credenciais
2. Backend valida e retorna JWT token
3. Token é armazenado no AsyncStorage
4. Requisições subsequentes incluem o token no header

---

## 📊 Dados Mock

O seeder cria automaticamente:

- **4 Departamentos**: Engenharia, Produto, Design, Marketing
- **5 Usuários**: Com avatars e senhas hash
- **6 Bookings**: Distribuídos pela semana
- **2 Swap Requests**: Solicitações de troca pendentes
- **1 App Settings**: Configurações padrão

### Configurações Padrão

```json
{
  "maxBookingsPerDay": 3,
  "maxBookingsPerWeekPerUser": 2,
  "allowedDays": [1, 2, 3, 4, 5],
  "requireApprovalForBookings": false
}
```

---

## 🔄 Workflow de Desenvolvimento

### 1. Modificar Schema

Edite `backend/db/schema.ts` para adicionar/modificar tabelas:

```typescript
export const myTable = mysqlTable('my_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2. Aplicar ao Banco

```bash
npx drizzle-kit push
```

### 3. Atualizar Seeder (Opcional)

Edite `backend/db/seed.ts` para incluir dados mock da nova tabela.

### 4. Popular Banco

```bash
npx tsx backend/db/seed.ts
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to MySQL"

Verifique se o MySQL está rodando:
```bash
# Windows
net start MySQL80

# Verificar status
mysql -u root -p
```

### Erro: "Database 'flexin' does not exist"

Crie o banco de dados:
```sql
CREATE DATABASE flexin;
```

### Erro: "Port already in use"

Mate o processo na porta:
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Limpar Cache do Expo

```bash
npx expo start -c
```

---

## 📝 Notas Importantes

### Seeder
- O seeder **limpa todos os dados** antes de popular
- Execute sempre que precisar resetar o banco para o estado inicial
- Útil para testes e desenvolvimento

### Migrations vs Push
- `drizzle-kit push`: Aplica mudanças diretamente (desenvolvimento)
- `drizzle-kit generate`: Gera migrations (produção)

### TypeScript
- Todos os tipos são inferidos do schema Drizzle
- Use `zod` para validação de input no tRPC

### React Query
- Cache automático de queries
- Invalidação automática em mutations
- Configurado via tRPC

---

## 🔗 Links Úteis

- [Expo Docs](https://docs.expo.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [tRPC](https://trpc.io/)
- [Hono](https://hono.dev/)
- [NativeWind](https://www.nativewind.dev/)

---

## 📞 Contato

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** 26/11/2025
