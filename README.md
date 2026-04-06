# TOPICS Pay

Projeto fullstack de autenticacao para a plataforma **TOPICS Pay**.

## Stack

- Front-end: Next.js + TypeScript + Tailwind + React Hook Form + Zod
- Back-end: Node.js + Express + TypeScript + Prisma + PostgreSQL + JWT + Bcrypt
- Banco: Supabase Postgres

## Recursos entregues

- Login, cadastro e logout
- Sessao persistida com JWT em cookie HTTP-only
- Rota protegida `/api/me`
- Protecao de rotas no frontend via middleware
- Recuperacao de senha com token expiravel
- Confirmacao de conta por codigo de 6 digitos
- Reenvio de codigo de confirmacao
- Estrutura pronta para envio real de e-mails transacionais
- Painel protegido apos login
- Campo `role` com `admin`, `member` e `guest`
- Modelagem Prisma para `User`, `PasswordResetToken` e `EmailVerificationCode`
- Estrutura `frontend/` e `backend/` separada
- Interface premium escura nas telas de autenticacao

## Principais rotas

### Backend

- `POST /api/auth/register`
- `POST /api/auth/verify-account-code`
- `POST /api/auth/resend-verification-code`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/me`
- `GET /api/admin/overview`

### Frontend

- `/login`
- `/signup`
- `/verify-account`
- `/forgot-password`
- `/reset-password`
- `/dashboard`

## Configuracao com Supabase

### Frontend

O arquivo [frontend/.env.example](c:\Users\exema\Downloads\SITES E APPS\TOPICS - MEMBERS\frontend\.env.example) ja foi preparado com:

- `NEXT_PUBLIC_SUPABASE_URL=https://sdwfhqvchhntectukiju.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_7ub2qG8Snra7dWR9ZAbB6g_7dHjPL2w`

Em producao na Vercel, o frontend deve consumir o backend interno em `/api`. Nao configure `NEXT_PUBLIC_API_URL` apontando para `localhost`.

### Backend

O arquivo [backend/.env.example](c:\Users\exema\Downloads\SITES E APPS\TOPICS - MEMBERS\backend\.env.example) foi ajustado para usar o Postgres do Supabase:

```env
DATABASE_URL=postgresql://postgres.sdwfhqvchhntectukiju:[YOUR-SUPABASE-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

No deploy atual, `DATABASE_URL` e obrigatoria para o build e para o runtime do backend. O schema Prisma agora e sincronizado automaticamente no build do backend com `prisma db push`, para que as tabelas reais existam no Supabase apos cada deploy.

Para entrega real de e-mails, o backend tambem aceita configuracao via Resend:

```env
# Opcional. Se omitido, o backend usa "resend" automaticamente quando
# RESEND_API_KEY e EMAIL_FROM_ADDRESS estiverem configurados.
EMAIL_PROVIDER=resend
EMAIL_FROM_NAME=TOPICS Pay
EMAIL_FROM_ADDRESS=no-reply@seudominio.com
EMAIL_REPLY_TO=suporte@seudominio.com
RESEND_API_KEY=re_xxxxxxxxx
```

## Setup rapido

### 1. Configure os arquivos de ambiente

```bash
copy backend\\.env.example backend\\.env
copy frontend\\.env.example frontend\\.env.local
```

### 2. Preencha a senha do banco Supabase em `backend/.env`

Substitua:

```env
[YOUR-SUPABASE-PASSWORD]
```

pela senha real do projeto.

### 3. Instale as dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Gere o Prisma Client e aplique o schema

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

O `seed` cria ou atualiza o administrador configurado em `backend/.env`.

### 5. Rode a API

```bash
cd backend
npm run dev
```

API em `http://localhost:4000/api`

### 6. Rode o frontend

```bash
cd frontend
npm run dev
```

App em `http://localhost:3000`

## Fluxo de confirmacao por codigo

1. O usuario faz cadastro.
2. O backend cria a conta com `isEmailVerified=false`.
3. O backend gera um codigo de 6 digitos em `EmailVerificationCode`.
4. O frontend redireciona para `/verify-account`.
5. Ao confirmar o codigo, a conta e marcada como verificada e a sessao ja nasce autenticada.
6. Se precisar, o usuario pode reenviar um novo codigo.

## Observacoes importantes

- Em desenvolvimento, o backend retorna o codigo de verificacao e o token de reset para facilitar testes.
- O login agora bloqueia contas nao confirmadas e redireciona para a verificacao por codigo.
- O backend foi validado com `tsc`, schema Prisma aplicado no Supabase e seed inicial executado.
- O frontend foi validado por tipagem (`tsc --noEmit`) e pelas rotas locais.
- O Supabase CLI continua opcional para este projeto, porque a conexao do Prisma usa diretamente a string do banco.
- O envio real de e-mails foi preparado com Resend, mas depende de uma `RESEND_API_KEY` valida e de um remetente autorizado.

## Comandos Supabase informados

Quando voce quiser concluir o link oficial com o projeto Supabase, os comandos sao:

```bash
supabase login
supabase init
supabase link --project-ref sdwfhqvchhntectukiju
```
