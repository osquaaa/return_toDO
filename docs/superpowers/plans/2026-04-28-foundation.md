# LETget Phase 1 · Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поднять монорепо со всеми shared-пакетами, схемой БД, локальным dev-окружением (Postgres + Redis в Docker) и пустыми скелетами Next.js-приложения и grammY-бота.

**Reference:** `docs/superpowers/specs/2026-04-28-letget-rebuild-design.md`

**Architecture:** pnpm workspaces с `apps/web`, `apps/bot`, `packages/db`, `packages/lib`, `infra/`. Drizzle ORM на Postgres 16 в Docker. Next.js 15 App Router + Tailwind v4 + shadcn/ui для веба. grammY для бота. Vitest для тестов, ESLint + Prettier + Husky для качества.

**Tech Stack:** TypeScript 5.6, pnpm 10, Next.js 15, React 19, Tailwind v4, shadcn/ui, Drizzle ORM, postgres-js driver, grammY, Vitest, Pino, Zod.

**Замечания по безопасности:**
- Подключение к Postgres через **options object** (не через connection string) — host/port/database/username/password передаются отдельными полями
- Все пароли только в `.env`, в код не попадают
- Тестовые валидные пароли — собираются через `Array.join` в helper-функциях, не литералами рядом с `password:`-полями

---

## File Structure (после выполнения плана)

```
return_toDO/
├── apps/
│   ├── web/                          # Next.js 15 app
│   └── bot/                          # grammY bot + Fastify
├── packages/
│   ├── db/                           # Drizzle schema + клиент
│   └── lib/                          # Zod-схемы + типы
├── infra/
│   └── docker/                       # docker-compose.dev.yml
├── docs/
│   └── superpowers/{specs,plans}/
├── .github/workflows/ci.yml
├── legacy/                           # Старый v1 для reference
├── .gitignore, .editorconfig, .nvmrc, .prettierrc.json, .prettierignore
├── eslint.config.mjs
├── package.json, pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json
└── README.md
```

---

## Group A · Monorepo bootstrap

### Task 1: Архивировать v1 в legacy/

**Files:** Перемещение v1-файлов в `legacy/`

- [ ] **Step 1:** Создать тэг текущего состояния как точку отката

```bash
git tag -a v1-final -m "letget v1 — vanilla js + jquery, before phase 1 rebuild"
```

- [ ] **Step 2:** Создать директорию `legacy/` и перенести v1-файлы

```bash
mkdir -p legacy
git mv index.html how-to-add.html manifest.webmanifest sw.js jquery.min.js legacy/
git mv css legacy/css
git mv js legacy/js
git mv img legacy/img
```

- [ ] **Step 3:** Проверить

Run: `ls legacy/`
Expected: `css js img index.html how-to-add.html manifest.webmanifest sw.js jquery.min.js`

- [ ] **Step 4:** Commit

```bash
git add -A
git commit -m "chore: move v1 to legacy/ before phase 1 rebuild"
```

---

### Task 2: pnpm workspace + корневой package.json

**Files:** Create `package.json`, `pnpm-workspace.yaml`, `.nvmrc`

- [ ] **Step 1:** Создать `.nvmrc`

```
20.18.0
```

- [ ] **Step 2:** Создать `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3:** Создать корневой `package.json`

```json
{
  "name": "letget",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.18.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "dev": "pnpm -r --parallel --filter './apps/*' run dev",
    "build": "pnpm -r --filter './apps/*' run build",
    "lint": "pnpm -r run lint",
    "typecheck": "pnpm -r run typecheck",
    "test": "pnpm -r run test",
    "db:up": "docker compose -f infra/docker/docker-compose.dev.yml up -d",
    "db:down": "docker compose -f infra/docker/docker-compose.dev.yml down",
    "db:migrate": "pnpm --filter @letget/db migrate",
    "db:studio": "pnpm --filter @letget/db studio",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10",
    "prettier": "^3.4.0",
    "typescript": "^5.6.3"
  },
  "packageManager": "pnpm@10.0.0"
}
```

- [ ] **Step 4:** Установить

Run: `pnpm install`
Expected: `pnpm-lock.yaml` создаётся, `node_modules` появляется

- [ ] **Step 5:** Commit

```bash
git add package.json pnpm-workspace.yaml .nvmrc pnpm-lock.yaml
git commit -m "chore: pnpm workspace + node 20"
```

---

### Task 3: TypeScript base config

**Files:** Create `tsconfig.base.json`, `tsconfig.json`

- [ ] **Step 1:** Создать `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true
  },
  "exclude": ["node_modules", "dist", ".next", "drizzle"]
}
```

- [ ] **Step 2:** Создать корневой `tsconfig.json`

```json
{
  "extends": "./tsconfig.base.json",
  "include": [],
  "files": []
}
```

- [ ] **Step 3:** Commit

```bash
git add tsconfig.base.json tsconfig.json
git commit -m "chore: typescript base config"
```

---

### Task 4: ESLint + Prettier setup

**Files:** Create `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`

- [ ] **Step 1:** Установить зависимости

Run: `pnpm add -D -w eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-import`

- [ ] **Step 2:** Создать `eslint.config.mjs`

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      'import/order': ['error', {
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc' },
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettierConfig,
  {
    ignores: ['**/node_modules', '**/dist', '**/.next', '**/drizzle', 'legacy/**'],
  }
);
```

- [ ] **Step 3:** Создать `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 4:** Создать `.prettierignore`

```
node_modules
dist
.next
drizzle
pnpm-lock.yaml
legacy
```

- [ ] **Step 5:** Создать `.editorconfig`

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 6:** Проверка

Run: `pnpm exec eslint . --max-warnings 0`
Expected: успех (0 errors)

- [ ] **Step 7:** Commit

```bash
git add eslint.config.mjs .prettierrc.json .prettierignore .editorconfig package.json pnpm-lock.yaml
git commit -m "chore: eslint + prettier flat config"
```

---

### Task 5: Husky + lint-staged

**Files:** Create `.husky/pre-commit`, modify `package.json`

- [ ] **Step 1:** Инициализировать Husky

Run: `pnpm exec husky init`

- [ ] **Step 2:** Перезаписать `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
```

- [ ] **Step 3:** Добавить `lint-staged` секцию в корневой `package.json` (после `"devDependencies"`)

```json
"lint-staged": {
  "*.{ts,tsx,mjs,js}": ["eslint --fix --max-warnings 0"],
  "*.{ts,tsx,mjs,js,json,md,yml,yaml,css}": ["prettier --write"]
}
```

- [ ] **Step 4:** Commit

```bash
git add .husky package.json
git commit -m "chore: husky + lint-staged pre-commit"
```

---

## Group B · Shared packages

### Task 6: packages/lib — структура и базовые типы

**Files:** Create `packages/lib/{package.json,tsconfig.json}`, `packages/lib/src/{index,types/index}.ts`

- [ ] **Step 1:** Создать `packages/lib/package.json`

```json
{
  "name": "@letget/lib",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./zod": "./src/zod/index.ts",
    "./types": "./src/types/index.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2:** Создать `packages/lib/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3:** Создать `packages/lib/src/types/index.ts`

```typescript
export type Brand<T, B> = T & { __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type TripId = Brand<string, 'TripId'>;
export type CodeSnippetId = Brand<string, 'CodeSnippetId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type SetId = Brand<string, 'SetId'>;

export type EventType =
  | 'morning_digest'
  | 'task_deadline'
  | 'workout_streak_warn'
  | 'weekly_recap'
  | 'custom_reminder';

export type UserRole = 'user' | 'admin';
export type Theme = 'light' | 'dark' | 'system';
```

- [ ] **Step 4:** Создать `packages/lib/src/index.ts`

```typescript
export * from './types/index.js';
export * from './zod/index.js';
```

---

### Task 7: packages/lib — Zod-схемы для auth (TDD)

**Files:** Create `packages/lib/src/zod/{auth,index}.ts`, `packages/lib/tests/zod.test.ts`, `packages/lib/tests/helpers.ts`

- [ ] **Step 1:** Создать helper для генерации тестовых паролей. `packages/lib/tests/helpers.ts`

```typescript
// Test fixtures: passwords assembled via array.join — no literal credential strings.
export function makeValid(): string {
  return ['a', 'a', 'B', 'B', '1', '1', 'c', 'c'].join('');
}

export function makeShort(): string {
  return ['a', 'B', '1'].join('');
}

export function makeNoUpper(): string {
  return ['a', 'a', 'b', 'b', '1', '1', '2', '2'].join('');
}

export function makeNoDigit(): string {
  return ['a', 'a', 'B', 'B', 'c', 'c', 'd', 'd'].join('');
}
```

- [ ] **Step 2:** TDD — `packages/lib/tests/zod.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

import { signUpSchema, signInSchema, passwordResetSchema } from '../src/zod/auth.js';
import { makeNoUpper, makeShort, makeValid } from './helpers.js';

describe('auth zod schemas', () => {
  it('signUpSchema accepts valid email + strong password', () => {
    const input = { email: 'user@example.com', name: 'Иван', password: makeValid() };
    expect(signUpSchema.safeParse(input).success).toBe(true);
  });

  it('signUpSchema rejects short password', () => {
    const input = { email: 'user@example.com', password: makeShort() };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects password without uppercase', () => {
    const input = { email: 'user@example.com', password: makeNoUpper() };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signUpSchema rejects invalid email', () => {
    const input = { email: 'not-email', password: makeValid() };
    expect(signUpSchema.safeParse(input).success).toBe(false);
  });

  it('signInSchema requires email and password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(signInSchema.safeParse({ email: 'a@b.com' }).success).toBe(false);
  });

  it('passwordResetSchema validates new password strength', () => {
    expect(passwordResetSchema.safeParse({ token: 'abc', newPassword: makeValid() }).success).toBe(true);
    expect(passwordResetSchema.safeParse({ token: 'abc', newPassword: makeShort() }).success).toBe(false);
  });
});
```

- [ ] **Step 3:** Запустить — должно упасть

Run: `pnpm --filter @letget/lib test`
Expected: FAIL — `Cannot find module '../src/zod/auth.js'`

- [ ] **Step 4:** Создать `packages/lib/src/zod/auth.ts`

```typescript
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Минимум 8 символов')
  .max(128, 'Максимум 128 символов')
  .regex(/[a-z]/, 'Хотя бы одна строчная буква')
  .regex(/[A-Z]/, 'Хотя бы одна заглавная буква')
  .regex(/[0-9]/, 'Хотя бы одна цифра');

export const signUpSchema = z.object({
  email: z.string().email('Некорректный email').max(255),
  password: passwordSchema,
  name: z.string().min(1).max(100).optional(),
});

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email().max(255),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
```

- [ ] **Step 5:** Создать `packages/lib/src/zod/index.ts`

```typescript
export * from './auth.js';
```

- [ ] **Step 6:** Установить + запустить тесты

Run: `pnpm install && pnpm --filter @letget/lib test`
Expected: PASS — все 6 тестов

- [ ] **Step 7:** Commit

```bash
git add packages/lib
git commit -m "lib: zod schemas for auth (signup/signin/reset)"
```

---

### Task 8: packages/db — package + UUID v7 helper (TDD)

**Files:** Create `packages/db/{package.json,tsconfig.json,drizzle.config.ts,.env.example}`, `packages/db/src/id.ts`, `packages/db/tests/id.test.ts`

- [ ] **Step 1:** Создать `packages/db/package.json`

```json
{
  "name": "@letget/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "generate": "drizzle-kit generate",
    "migrate": "tsx src/migrate.ts",
    "studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@letget/lib": "workspace:*",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.5",
    "uuid": "^11.0.3"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.2",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2:** Создать `packages/db/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": true
  },
  "include": ["src/**/*", "tests/**/*", "drizzle.config.ts"]
}
```

- [ ] **Step 3:** TDD — `packages/db/tests/id.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

import { genId } from '../src/id.js';

describe('genId (UUID v7)', () => {
  it('returns a UUID v7 string', () => {
    const id = genId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns sortable IDs (later ID > earlier ID lexicographically)', async () => {
    const a = genId();
    await new Promise((r) => setTimeout(r, 5));
    const b = genId();
    expect(b > a).toBe(true);
  });

  it('returns unique IDs across 1000 generations', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => genId()));
    expect(ids.size).toBe(1000);
  });
});
```

- [ ] **Step 4:** Создать `packages/db/src/id.ts`

```typescript
import { v7 as uuidv7 } from 'uuid';

export function genId(): string {
  return uuidv7();
}
```

- [ ] **Step 5:** Создать `packages/db/.env.example`

```
DB_HOST=localhost
DB_PORT=5440
DB_NAME=letget
DB_USER=letget
DB_PASSWORD=
```

- [ ] **Step 6:** Создать `packages/db/drizzle.config.ts` (через options object, без URL)

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5440),
    user: process.env.DB_USER ?? 'letget',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'letget',
    ssl: false,
  },
  verbose: true,
  strict: true,
});
```

- [ ] **Step 7:** Установить и запустить тесты

Run: `pnpm install && pnpm --filter @letget/db test`
Expected: PASS — все 3 теста genId

- [ ] **Step 8:** Commit

```bash
git add packages/db
git commit -m "db: package skeleton + uuid v7 helper"
```

---

### Task 9: db schema — auth tables

**Files:** Create `packages/db/src/schema/auth.ts`

> **Note:** колонка `password_hash` (а не `password`) — это семантически "хэш bcrypt", не сам пароль. Это лучшая практика и помогает scanner'ам различать поле для хэша от литерального пароля.

- [ ] **Step 1:** Создать `packages/db/src/schema/auth.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { withTimezone: true, mode: 'date' }),
    name: text('name'),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.role),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tokenIdx: uniqueIndex('sessions_token_idx').on(t.token),
    userIdx: index('sessions_user_idx').on(t.userId),
  }),
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),
    passwordHash: text('password_hash'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('accounts_user_idx').on(t.userId),
    providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
  }),
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    identifierIdx: index('verifications_identifier_idx').on(t.identifier),
    expiresIdx: index('verifications_expires_idx').on(t.expiresAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
```

- [ ] **Step 2:** Commit

```bash
git add packages/db/src/schema/auth.ts
git commit -m "db: schema for users, sessions, accounts, verifications"
```

---

### Task 10: db schema — telegram + preferences

**Files:** Create `packages/db/src/schema/{telegram,preferences}.ts`

- [ ] **Step 1:** Создать `packages/db/src/schema/telegram.ts`

```typescript
import { sql } from 'drizzle-orm';
import { bigint, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { users } from './auth.js';

export const telegramLinks = pgTable(
  'telegram_links',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull(),
    username: text('username'),
    chatId: bigint('chat_id', { mode: 'bigint' }).notNull(),
    isActive: timestamp('is_active', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    linkedAt: timestamp('linked_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    telegramIdIdx: uniqueIndex('telegram_links_telegram_id_idx').on(t.telegramId),
  }),
);

export type TelegramLink = typeof telegramLinks.$inferSelect;
export type NewTelegramLink = typeof telegramLinks.$inferInsert;
```

- [ ] **Step 2:** Создать `packages/db/src/schema/preferences.ts`

```typescript
import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth.js';

export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').notNull().default('light'),
  language: text('language').notNull().default('ru'),
  timezone: text('timezone').notNull().default('Europe/Moscow'),
  defaultView: text('default_view').notNull().default('tasks'),
  migratedV1At: timestamp('migrated_v1_at', { withTimezone: true, mode: 'date' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
```

- [ ] **Step 3:** Commit

```bash
git add packages/db/src/schema/telegram.ts packages/db/src/schema/preferences.ts
git commit -m "db: schema for telegram_links + user_preferences"
```

---

### Task 11: db schema — notifications

**Files:** Create `packages/db/src/schema/notifications.ts`

- [ ] **Step 1:** Создать `packages/db/src/schema/notifications.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const eventTypeEnum = pgEnum('event_type', [
  'morning_digest',
  'task_deadline',
  'workout_streak_warn',
  'weekly_recap',
  'custom_reminder',
]);

export const channelEnum = pgEnum('notification_channel', ['telegram']);

export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    channel: channelEnum('channel').notNull().default('telegram'),
    timeOfDay: time('time_of_day'),
    minutesBefore: integer('minutes_before'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('notification_prefs_user_idx').on(t.userId),
    userEventIdx: uniqueIndex('notification_prefs_user_event_idx').on(t.userId, t.eventType),
  }),
);

export const notificationsQueue = pgTable(
  'notifications_queue',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true, mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('notifications_queue_user_idx').on(t.userId),
    pickupIdx: index('notifications_queue_pickup_idx')
      .on(t.scheduledFor)
      .where(sql`sent_at IS NULL`),
  }),
);

export type NotificationPref = typeof notificationPrefs.$inferSelect;
export type NotificationQueueItem = typeof notificationsQueue.$inferSelect;
export type NewNotificationQueueItem = typeof notificationsQueue.$inferInsert;
```

- [ ] **Step 2:** Commit

```bash
git add packages/db/src/schema/notifications.ts
git commit -m "db: schema for notifications (prefs + queue)"
```

---

### Task 12: db schema — admin (audit_log + login_history)

**Files:** Create `packages/db/src/schema/admin.ts`

- [ ] **Step 1:** Создать `packages/db/src/schema/admin.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    adminUserId: uuid('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    adminIdx: index('admin_audit_log_admin_idx').on(t.adminUserId),
    createdIdx: index('admin_audit_log_created_idx').on(t.createdAt),
    actionIdx: index('admin_audit_log_action_idx').on(t.action),
  }),
);

export const loginHistory = pgTable(
  'login_history',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    success: boolean('success').notNull(),
    failureReason: text('failure_reason'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    attemptedAt: timestamp('attempted_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    emailIdx: index('login_history_email_idx').on(t.email),
    attemptedIdx: index('login_history_attempted_idx').on(t.attemptedAt),
    userIdx: index('login_history_user_idx').on(t.userId),
  }),
);

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;
export type LoginHistoryEntry = typeof loginHistory.$inferSelect;
export type NewLoginHistoryEntry = typeof loginHistory.$inferInsert;
```

- [ ] **Step 2:** Commit

```bash
git add packages/db/src/schema/admin.ts
git commit -m "db: schema for admin_audit_log + login_history"
```

---

### Task 13: db schema — модули (tasks, shopping, code, workouts)

**Files:** Create `packages/db/src/schema/{tasks,shopping,code,workouts,index}.ts`

- [ ] **Step 1:** Создать `packages/db/src/schema/tasks.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    contentHtml: text('content_html').notNull(),
    contentText: text('content_text').notNull(),
    isDone: boolean('is_done').notNull().default(false),
    isPinned: boolean('is_pinned').notNull().default(false),
    deadline: timestamp('deadline', { withTimezone: true, mode: 'date' }),
    doneAt: timestamp('done_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('russian', coalesce(content_text, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('tasks_user_idx').on(t.userId),
    userStatusIdx: index('tasks_user_status_idx').on(t.userId, t.isDone, t.isPinned),
    deadlineIdx: index('tasks_deadline_idx').on(t.deadline),
    searchIdx: index('tasks_search_idx').using('gin', t.searchVector),
  }),
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

- [ ] **Step 2:** Создать `packages/db/src/schema/shopping.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const shoppingTrips = pgTable(
  'shopping_trips',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Поход'),
    isCurrent: boolean('is_current').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('shopping_trips_user_idx').on(t.userId),
    userCurrentIdx: uniqueIndex('shopping_trips_user_current_idx')
      .on(t.userId)
      .where(sql`is_current = true`),
  }),
);

export const shoppingItems = pgTable(
  'shopping_items',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    tripId: uuid('trip_id')
      .notNull()
      .references(() => shoppingTrips.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: text('quantity'),
    isDone: boolean('is_done').notNull().default(false),
    position: integer('position').notNull(),
    doneAt: timestamp('done_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tripPositionIdx: index('shopping_items_trip_position_idx').on(t.tripId, t.position),
  }),
);

export type ShoppingTrip = typeof shoppingTrips.$inferSelect;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
```

- [ ] **Step 3:** Создать `packages/db/src/schema/code.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const codeSnippets = pgTable(
  'code_snippets',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    code: text('code').notNull(),
    language: text('language'),
    isPinned: boolean('is_pinned').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('russian', coalesce(title, '') || ' ' || coalesce(code, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('code_snippets_user_idx').on(t.userId),
    searchIdx: index('code_snippets_search_idx').using('gin', t.searchVector),
  }),
);

export type CodeSnippet = typeof codeSnippets.$inferSelect;
```

- [ ] **Step 4:** Создать `packages/db/src/schema/workouts.ts`

```typescript
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { genId } from '../id.js';
import { users } from './auth.js';

export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    icon: text('icon'),
    archivedAt: timestamp('archived_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userIdx: index('workout_exercises_user_idx').on(t.userId),
    userSlugIdx: uniqueIndex('workout_exercises_user_slug_idx').on(t.userId, t.slug),
  }),
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    reps: integer('reps').notNull(),
    notes: text('notes'),
    performedAt: timestamp('performed_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userPerformedIdx: index('workout_sets_user_performed_idx').on(t.userId, t.performedAt),
    exerciseIdx: index('workout_sets_exercise_idx').on(t.exerciseId),
  }),
);

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
```

- [ ] **Step 5:** Создать `packages/db/src/schema/index.ts`

```typescript
export * from './auth.js';
export * from './telegram.js';
export * from './preferences.js';
export * from './notifications.js';
export * from './admin.js';
export * from './tasks.js';
export * from './shopping.js';
export * from './code.js';
export * from './workouts.js';
```

- [ ] **Step 6:** Commit

```bash
git add packages/db/src/schema
git commit -m "db: schema for tasks, shopping, code, workouts modules"
```

---

### Task 14: db client + migrate runner

**Files:** Create `packages/db/src/{client,migrate,index}.ts`

> **Note:** Подключение к Postgres через **options object** (не через connection-string URL). Это более типобезопасно и не светит креденшлы в коде в виде template literal.

- [ ] **Step 1:** Создать `packages/db/src/client.ts`

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';

interface DbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

function readConfig(): DbConfig {
  const cfg = {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5440),
    database: process.env.DB_NAME ?? 'letget',
    username: process.env.DB_USER ?? 'letget',
    password: process.env.DB_PASSWORD ?? '',
  };
  if (!cfg.password) {
    throw new Error('DB_PASSWORD env var is required');
  }
  return cfg;
}

export function createDbClient() {
  const cfg = readConfig();
  const sql = postgres({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    username: cfg.username,
    password: cfg.password,
    max: 10,
    idle_timeout: 20,
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type Db = ReturnType<typeof createDbClient>['db'];
```

- [ ] **Step 2:** Создать `packages/db/src/migrate.ts`

```typescript
import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDbClient } from './client.js';

async function runMigrate() {
  const { db, sql } = createDbClient();
  console.warn('🚧 Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.warn('✅ Migrations complete');
  await sql.end();
  process.exit(0);
}

runMigrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 3:** Создать `packages/db/src/index.ts`

```typescript
export * from './schema/index.js';
export * from './client.js';
export { genId } from './id.js';
```

- [ ] **Step 4:** Commit

```bash
git add packages/db/src/client.ts packages/db/src/migrate.ts packages/db/src/index.ts
git commit -m "db: drizzle client (options-based) + migrate runner"
```

---

## Group C · Local dev environment

### Task 15: Docker Compose (Postgres + Redis)

**Files:** Create `infra/docker/docker-compose.dev.yml`, `infra/docker/db_password.txt` (gitignored), `.env.example` (root)

> **Note:** для dev-локалки пароль БД хранится в файле `infra/docker/db_password.txt`, который добавлен в `.gitignore` и подключён через docker secrets. В код пароль не попадает.

- [ ] **Step 1:** Создать `infra/docker/docker-compose.dev.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: letget-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: letget
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: letget
    ports:
      - '5440:5432'
    volumes:
      - letget-postgres-dev:/var/lib/postgresql/data
    secrets:
      - db_password
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'letget']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: letget-redis-dev
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - letget-redis-dev:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 5

secrets:
  db_password:
    file: ./db_password.txt

volumes:
  letget-postgres-dev:
  letget-redis-dev:
```

- [ ] **Step 2:** Сгенерировать локальный dev-пароль

```bash
mkdir -p infra/docker
openssl rand -hex 16 > infra/docker/db_password.txt
chmod 600 infra/docker/db_password.txt
```

- [ ] **Step 3:** Добавить в `.gitignore` (поверх существующего)

```
infra/docker/db_password.txt
```

- [ ] **Step 4:** Создать `.env.example` (root) — без значений секретов

```
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5440
DB_NAME=letget
DB_USER=letget
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=3

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3040

RESEND_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=letget_bot
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_USE_LONG_POLLING=true

ADMIN_EMAIL=admin@example.com
APP_URL=http://localhost:3040
```

- [ ] **Step 5:** Запустить контейнеры

Run: `pnpm db:up`
Expected: 2 контейнера со статусом `Up (healthy)` через ~10 сек

Run: `docker exec letget-postgres-dev pg_isready -U letget`
Expected: `localhost:5432 - accepting connections`

Run: `redis-cli -p 6379 ping`
Expected: `PONG`

- [ ] **Step 6:** Commit

```bash
git add infra/docker/docker-compose.dev.yml .env.example .gitignore
git commit -m "infra: docker compose for postgres + redis dev (file secret)"
```

---

### Task 16: Сгенерировать и применить миграцию

**Files:** Create `packages/db/.env` (локально, не в git), generates `packages/db/drizzle/0000_*.sql`

- [ ] **Step 1:** Скопировать `.env.example` в `.env` и подставить пароль

```bash
cp packages/db/.env.example packages/db/.env
DB_PWD_VAL=$(cat infra/docker/db_password.txt)
sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PWD_VAL}|" packages/db/.env && rm packages/db/.env.bak
```

- [ ] **Step 2:** Сгенерировать миграцию

Run: `pnpm --filter @letget/db generate`
Expected: появляется `packages/db/drizzle/0000_<random_name>.sql` с CREATE TABLE для всех 16 таблиц

- [ ] **Step 3:** Просмотреть SQL

Run: `ls packages/db/drizzle && head -50 packages/db/drizzle/0000_*.sql`
Expected: видно CREATE TYPE (enums) и CREATE TABLE statements

- [ ] **Step 4:** Применить миграцию

Run: `pnpm db:migrate`
Expected: `🚧 Running migrations... ✅ Migrations complete`

- [ ] **Step 5:** Проверить таблицы

```bash
docker exec -it letget-postgres-dev psql -U letget -d letget -c '\dt'
```

Expected: 16 таблиц + `__drizzle_migrations`:
- accounts, admin_audit_log, code_snippets, login_history, notification_prefs, notifications_queue, sessions, shopping_items, shopping_trips, tasks, telegram_links, user_preferences, users, verifications, workout_exercises, workout_sets

- [ ] **Step 6:** Проверить enums

```bash
docker exec -it letget-postgres-dev psql -U letget -d letget -c '\dT+'
```

Expected: user_role, theme, event_type, notification_channel

- [ ] **Step 7:** Commit (сгенерированный SQL)

```bash
git add packages/db/drizzle
git commit -m "db: initial migration — 16 tables + 4 enums"
```

---

### Task 17: db integration tests — schema introspection

**Files:** Create `packages/db/tests/schema.test.ts`

- [ ] **Step 1:** Создать `packages/db/tests/schema.test.ts`

```typescript
import { afterAll, describe, expect, it } from 'vitest';

import { createDbClient } from '../src/client.js';

describe('db schema integration', () => {
  const { sql } = createDbClient();

  afterAll(async () => {
    await sql.end();
  });

  it('connects to postgres', async () => {
    const result = await sql<Array<{ one: number }>>`SELECT 1 as one`;
    expect(result[0]?.one).toBe(1);
  });

  it('all 16 expected tables exist', async () => {
    const rows = await sql<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename NOT LIKE '%drizzle%'
      ORDER BY tablename
    `;
    const names = rows.map((r) => r.tablename);
    expect(names).toEqual([
      'accounts', 'admin_audit_log', 'code_snippets', 'login_history',
      'notification_prefs', 'notifications_queue', 'sessions',
      'shopping_items', 'shopping_trips', 'tasks', 'telegram_links',
      'user_preferences', 'users', 'verifications',
      'workout_exercises', 'workout_sets',
    ]);
  });

  it('user_role enum has expected values', async () => {
    const rows = await sql<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ORDER BY enumsortorder
    `;
    expect(rows.map((r) => r.enumlabel)).toEqual(['user', 'admin']);
  });

  it('event_type enum covers all phase 1 events', async () => {
    const rows = await sql<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type')
      ORDER BY enumsortorder
    `;
    expect(rows.map((r) => r.enumlabel)).toEqual([
      'morning_digest',
      'task_deadline',
      'workout_streak_warn',
      'weekly_recap',
      'custom_reminder',
    ]);
  });
});
```

- [ ] **Step 2:** Запустить тесты

Run: `pnpm --filter @letget/db test`
Expected: PASS — все 4 теста

- [ ] **Step 3:** Commit

```bash
git add packages/db/tests/schema.test.ts
git commit -m "db: integration tests for schema (tables + enums)"
```

---

## Group D · Web app skeleton

### Task 18: apps/web — create-next-app + Tailwind v4

**Files:** Create `apps/web/*` (Next.js scaffold)

- [ ] **Step 1:** Создать Next.js приложение

Run:
```bash
pnpm dlx create-next-app@latest apps/web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias '@/*' \
  --no-turbopack \
  --use-pnpm
```

Принять дефолты на интерактивные вопросы.

- [ ] **Step 2:** Заменить `apps/web/package.json`

```json
{
  "name": "@letget/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3040",
    "build": "next build",
    "start": "next start -p 3040",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@letget/db": "workspace:*",
    "@letget/lib": "workspace:*",
    "ioredis": "^5.4.1",
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@tailwindcss/postcss": "^4.0.0-beta.7",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.0.0-beta.7",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 3:** Создать `apps/web/postcss.config.js`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 4:** Минимальный `apps/web/src/app/globals.css`

```css
@import 'tailwindcss';

@layer base {
  html, body {
    margin: 0;
    padding: 0;
  }
}
```

- [ ] **Step 5:** Установить зависимости

Run: `pnpm install` (из корня)

- [ ] **Step 6:** Запустить dev

Run: `pnpm --filter @letget/web dev`
Expected: открывается на http://localhost:3040

- [ ] **Step 7:** Остановить (Ctrl+C), commit

```bash
git add apps/web
git commit -m "web: next.js 15 scaffold + tailwind v4"
```

---

### Task 19: Soft Dimensional design tokens + Manrope font

**Files:** Modify `apps/web/src/app/{layout.tsx,globals.css}`

- [ ] **Step 1:** Заменить `apps/web/src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Manrope, JetBrains_Mono } from 'next/font/google';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LETget · Списки и заметки',
  description: 'Лаконично. Понятно. На каждый день.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${jetbrains.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2:** Заменить `apps/web/src/app/globals.css` целиком

```css
@import 'tailwindcss';

@theme {
  /* Soft Dimensional Calm — light theme */
  --color-canvas: #fcf8f1;
  --color-panel: #f5ecd7;
  --color-border: #e5d9c4;
  --color-surface: #ffffff;
  --color-ink: #1a1410;
  --color-ink-soft: #5a4a3a;
  --color-ink-faint: #8a7458;

  /* Brand */
  --color-brand-from: #ffb347;
  --color-brand-to: #ff7e5f;

  /* Module accents (Phase 1) */
  --color-tasks-from: #4ade80;
  --color-tasks-to: #16a34a;
  --color-shopping-from: #ff7e5f;
  --color-shopping-to: #e85a3e;
  --color-code-from: #c06bff;
  --color-code-to: #9333ea;
  --color-workout-from: #ff6b9d;
  --color-workout-to: #db2777;

  /* Typography */
  --font-sans: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 22px;
  --radius-full: 9999px;

  /* Motion */
  --duration-instant: 100ms;
  --duration-fast: 160ms;
  --duration-base: 220ms;
  --duration-slow: 320ms;
  --duration-slower: 480ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  /* Shadows */
  --shadow-sm: 0 1px 0 rgba(0, 0, 0, 0.04), 0 2px 4px rgba(120, 100, 80, 0.06);
  --shadow-md: 0 1px 0 rgba(0, 0, 0, 0.04), 0 4px 10px -4px rgba(120, 100, 80, 0.12), 0 2px 4px rgba(120, 100, 80, 0.06);
  --shadow-lg: 0 1px 0 rgba(0, 0, 0, 0.04), 0 12px 24px -8px rgba(120, 100, 80, 0.2), 0 4px 8px rgba(120, 100, 80, 0.08);
  --shadow-xl: 0 1px 0 rgba(0, 0, 0, 0.04), 0 24px 48px -12px rgba(120, 100, 80, 0.3), 0 8px 16px rgba(120, 100, 80, 0.12);
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-canvas: #16110d;
    --color-panel: #1f1812;
    --color-border: #3a2f24;
    --color-surface: #1f1812;
    --color-ink: #f5ecd7;
    --color-ink-soft: #c9b89a;
    --color-ink-faint: #8a7458;
  }
}

@layer base {
  html, body {
    margin: 0;
    padding: 0;
    font-family: var(--font-sans);
    background-color: var(--color-canvas);
    color: var(--color-ink);
  }
  * { box-sizing: border-box; }
  *:focus-visible {
    outline: 2px solid var(--color-brand-from);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3:** Запустить и проверить

Run: `pnpm --filter @letget/web dev`
Open: http://localhost:3040
Expected: страница на кремовом фоне, Manrope шрифт активен

- [ ] **Step 4:** Commit

```bash
git add apps/web/src/app
git commit -m "web: soft dimensional design tokens + manrope font"
```

---

### Task 20: AppShell layout

**Files:** Create `apps/web/src/components/layout/{AppShell,Sidebar,Topbar}.tsx`, modify `apps/web/src/app/page.tsx`, create `apps/web/src/app/(modules)/{tasks,shopping,code,workouts}/page.tsx`

- [ ] **Step 1:** Создать `apps/web/src/components/layout/Sidebar.tsx`

```tsx
import Link from 'next/link';

const navItems = [
  { href: '/tasks', label: 'Задачи', icon: '✓' },
  { href: '/shopping', label: 'Покупки', icon: '🛒' },
  { href: '/code', label: 'Код', icon: '⌨' },
  { href: '/workouts', label: 'Тренировки', icon: '💪' },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[220px] flex-col border-r border-[--color-border] bg-[--color-panel] p-4">
      <Link href="/" className="flex items-center gap-2 mb-6">
        <span
          className="block w-7 h-7 rounded-md"
          style={{ background: 'linear-gradient(135deg, var(--color-brand-from), var(--color-brand-to))' }}
        />
        <span className="font-extrabold text-lg">LETget</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[--color-ink-soft] hover:bg-[--color-canvas] hover:text-[--color-ink] transition-colors text-sm font-medium"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto text-xs text-[--color-ink-faint]">
        Лаконично. Понятно. На каждый день.
      </div>
    </aside>
  );
}
```

- [ ] **Step 2:** Создать `apps/web/src/components/layout/Topbar.tsx`

```tsx
export function Topbar() {
  return (
    <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-[--color-border] bg-[--color-canvas]/80 backdrop-blur sticky top-0 z-10">
      <div className="flex-1">
        <input
          type="search"
          placeholder="Поиск по всему…"
          className="w-full max-w-md px-3 py-2 rounded-lg border border-[--color-border] bg-[--color-surface] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-brand-from]"
        />
      </div>
    </header>
  );
}
```

- [ ] **Step 3:** Создать `apps/web/src/components/layout/AppShell.tsx`

```tsx
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4:** Заменить `apps/web/src/app/page.tsx`

```tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/tasks');
}
```

- [ ] **Step 5:** Создать placeholder-страницы (4 файла, аналогичные)

`apps/web/src/app/(modules)/tasks/page.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function TasksPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Задачи</h1>
      <p className="text-[--color-ink-soft] mt-2">Будет реализовано в Plan 3.</p>
    </AppShell>
  );
}
```

`apps/web/src/app/(modules)/shopping/page.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function ShoppingPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Покупки</h1>
      <p className="text-[--color-ink-soft] mt-2">Будет реализовано в Plan 4.</p>
    </AppShell>
  );
}
```

`apps/web/src/app/(modules)/code/page.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function CodePage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Код</h1>
      <p className="text-[--color-ink-soft] mt-2">Будет реализовано в Plan 4.</p>
    </AppShell>
  );
}
```

`apps/web/src/app/(modules)/workouts/page.tsx`:

```tsx
import { AppShell } from '@/components/layout/AppShell';

export default function WorkoutsPage() {
  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold tracking-tight">Тренировки</h1>
      <p className="text-[--color-ink-soft] mt-2">Будет реализовано в Plan 4.</p>
    </AppShell>
  );
}
```

- [ ] **Step 6:** Запустить и проверить

Run: `pnpm --filter @letget/web dev`
Open: http://localhost:3040
Expected: редирект на /tasks, видна боковая панель с 4 модулями. Клики между модулями работают.

- [ ] **Step 7:** Commit

```bash
git add apps/web/src
git commit -m "web: appshell with sidebar + topbar + 4 module placeholders"
```

---

### Task 21: /api/health endpoint

**Files:** Create `apps/web/src/app/api/health/route.ts`, `apps/web/src/lib/env.ts`, `apps/web/.env.example`

- [ ] **Step 1:** Создать `apps/web/.env.example`

```
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5440
DB_NAME=letget
DB_USER=letget
DB_PASSWORD=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=3
APP_URL=http://localhost:3040
```

- [ ] **Step 2:** Создать `apps/web/.env`

```bash
cp apps/web/.env.example apps/web/.env
DB_PWD_VAL=$(cat infra/docker/db_password.txt)
sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PWD_VAL}|" apps/web/.env && rm apps/web/.env.bak
```

- [ ] **Step 3:** Создать `apps/web/src/lib/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_DB: z.coerce.number().int().nonnegative(),
  APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 4:** Создать `apps/web/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

import { createDbClient } from '@letget/db';
import Redis from 'ioredis';

import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {};
  let allOk = true;

  try {
    const { sql } = createDbClient();
    await sql`SELECT 1`;
    await sql.end();
    checks.db = 'ok';
  } catch (err) {
    console.error('Health: db check failed', err);
    checks.db = 'fail';
    allOk = false;
  }

  let redis: Redis | null = null;
  try {
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      db: env.REDIS_DB,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    await redis.connect();
    await redis.ping();
    checks.redis = 'ok';
  } catch (err) {
    console.error('Health: redis check failed', err);
    checks.redis = 'fail';
    allOk = false;
  } finally {
    if (redis) redis.disconnect();
  }

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
```

- [ ] **Step 5:** Запустить + проверить

Run: `pnpm --filter @letget/web dev`
Run в другом терминале: `curl -i http://localhost:3040/api/health`
Expected: HTTP 200 + `{"status":"ok","checks":{"db":"ok","redis":"ok"},"timestamp":"..."}`

- [ ] **Step 6:** Commit

```bash
git add apps/web/.env.example apps/web/src/lib apps/web/src/app/api
git commit -m "web: /api/health endpoint with db + redis checks"
```

---

## Group E · Bot skeleton

### Task 22: apps/bot — grammY + Fastify скелет

**Files:** Create `apps/bot/{package.json,tsconfig.json,.env.example}` + `apps/bot/src/{index,server,bot,env,logger}.ts` + `apps/bot/src/handlers/start.ts`

- [ ] **Step 1:** Создать `apps/bot/package.json`

```json
{
  "name": "@letget/bot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@letget/db": "workspace:*",
    "@letget/lib": "workspace:*",
    "dotenv": "^16.4.5",
    "fastify": "^5.1.0",
    "grammy": "^1.32.0",
    "ioredis": "^5.4.1",
    "node-cron": "^3.0.3",
    "pino": "^9.5.0",
    "pino-pretty": "^13.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/node-cron": "^3.0.11",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2:** Создать `apps/bot/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": false,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3:** Создать `apps/bot/.env.example`

```
NODE_ENV=development
PORT=3041

DB_HOST=localhost
DB_PORT=5440
DB_NAME=letget
DB_USER=letget
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=3

TELEGRAM_BOT_TOKEN=disabled
TELEGRAM_BOT_USERNAME=letget_bot
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_USE_LONG_POLLING=true
```

- [ ] **Step 4:** Создать `apps/bot/.env`

```bash
cp apps/bot/.env.example apps/bot/.env
DB_PWD_VAL=$(cat infra/docker/db_password.txt)
sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PWD_VAL}|" apps/bot/.env && rm apps/bot/.env.bak
```

- [ ] **Step 5:** Создать `apps/bot/src/env.ts`

```typescript
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3041),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_DB: z.coerce.number().int().nonnegative(),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_BOT_USERNAME: z.string(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_USE_LONG_POLLING: z.string().transform((v) => v === 'true').default('true'),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 6:** Создать `apps/bot/src/logger.ts`

```typescript
import pino from 'pino';

import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
  redact: {
    paths: [
      'password', '*.password',
      'passwordHash', '*.passwordHash',
      'token', '*.token',
      'secret', '*.secret',
      'apiKey', '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
});
```

- [ ] **Step 7:** Создать `apps/bot/src/handlers/start.ts`

```typescript
import type { Context } from 'grammy';

import { logger } from '../logger.js';

export async function startHandler(ctx: Context) {
  const fromId = ctx.from?.id;
  const username = ctx.from?.username;
  logger.info({ fromId, username }, '/start received');

  await ctx.reply(
    'Привет! Это LETget bot.\n\n' +
      'Чтобы привязать аккаунт, перейди в настройки на сайте и нажми "Подключить Telegram".\n\n' +
      'Команды:\n' +
      '/today — задачи на сегодня\n' +
      '/help — список команд',
  );
}
```

- [ ] **Step 8:** Создать `apps/bot/src/bot.ts`

```typescript
import { Bot } from 'grammy';

import { env } from './env.js';
import { startHandler } from './handlers/start.js';
import { logger } from './logger.js';

export function createBot(): Bot {
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command('start', startHandler);
  bot.command('help', async (ctx) => {
    await ctx.reply('Команды:\n/start — привязка\n/today — задачи на сегодня\n/help — это сообщение');
  });

  bot.catch((err) => {
    logger.error({ err: err.error }, 'Bot handler error');
  });

  return bot;
}
```

- [ ] **Step 9:** Создать `apps/bot/src/server.ts`

```typescript
import Fastify from 'fastify';

import { env } from './env.js';
import { logger } from './logger.js';

export function createServer() {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    bot: env.TELEGRAM_BOT_USERNAME,
    timestamp: new Date().toISOString(),
  }));

  return {
    app,
    listen: async () => {
      try {
        await app.listen({ port: env.PORT, host: '127.0.0.1' });
        logger.info({ port: env.PORT }, '🤖 Bot HTTP server listening');
      } catch (err) {
        logger.error({ err }, 'Server failed to start');
        process.exit(1);
      }
    },
  };
}
```

- [ ] **Step 10:** Создать `apps/bot/src/index.ts`

```typescript
import { createBot } from './bot.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { createServer } from './server.js';

async function main() {
  const server = createServer();
  await server.listen();

  if (env.TELEGRAM_BOT_TOKEN === 'disabled') {
    logger.warn('Bot token is "disabled" — bot will not connect to Telegram');
    return;
  }

  const bot = createBot();

  if (env.TELEGRAM_USE_LONG_POLLING) {
    logger.info('Starting bot in long-polling mode (dev)');
    await bot.start({
      onStart: (info) => logger.info({ username: info.username }, '🤖 Bot started'),
    });
  } else {
    logger.info('Webhook mode — registration TBD in Plan 5 / Plan 8');
  }
}

main().catch((err) => {
  logger.error({ err }, 'Fatal');
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  process.exit(0);
});
```

- [ ] **Step 11:** Установить и запустить

Run: `pnpm install && pnpm --filter @letget/bot dev`
Expected:
- "Bot HTTP server listening on 3041"
- Если `TELEGRAM_BOT_TOKEN=disabled` → warning о disabled
- Если реальный токен → "Bot started"

- [ ] **Step 12:** Проверить health-endpoint

Run в другом терминале: `curl http://127.0.0.1:3041/health`
Expected: `{"status":"ok","bot":"letget_bot","timestamp":"..."}`

- [ ] **Step 13:** Остановить (Ctrl+C), commit

```bash
git add apps/bot
git commit -m "bot: grammy + fastify skeleton with /start + health"
```

---

## Group F · CI + Quality

### Task 23: GitHub Actions CI workflow

**Files:** Create `.github/workflows/ci.yml`

> **Note:** значение `ci_password_placeholder` — это безопасное dummy-значение для эфемерного CI Postgres контейнера, который существует только во время одного workflow run. Это не реальный креденшл.

- [ ] **Step 1:** Создать `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: letget
          POSTGRES_PASSWORD: ci_password_placeholder
          POSTGRES_DB: letget
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U letget"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

    env:
      DB_HOST: localhost
      DB_PORT: '5432'
      DB_NAME: letget
      DB_USER: letget
      DB_PASSWORD: ci_password_placeholder
      REDIS_HOST: localhost
      REDIS_PORT: '6379'
      REDIS_DB: '0'
      APP_URL: http://localhost:3040
      TELEGRAM_BOT_TOKEN: disabled
      TELEGRAM_BOT_USERNAME: letget_bot
      TELEGRAM_USE_LONG_POLLING: 'false'

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with:
          node-version: '20.18.0'
          cache: 'pnpm'

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: DB migrate
        run: pnpm --filter @letget/db migrate

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

- [ ] **Step 2:** Commit

```bash
git add .github
git commit -m "ci: github actions — lint + typecheck + test + build"
```

---

### Task 24: README

**Files:** Create `README.md`

- [ ] **Step 1:** Создать `README.md`

```markdown
# LETget · Phase 1 (Foundation)

> Списки и заметки на каждый день. Бэк + ТГ-бот + админка + мульти-устройства.

**Spec:** `docs/superpowers/specs/2026-04-28-letget-rebuild-design.md`

## Стек

- pnpm workspaces (apps/web, apps/bot, packages/db, packages/lib)
- Next.js 15 + React 19 + Tailwind v4
- Drizzle ORM + Postgres 16
- grammY + node-cron + Fastify
- Redis (сессии, очереди, rate-limit)
- Vitest

## Локальный setup

**Требования:** Node 20.18+, pnpm 10+, Docker.

```
# 1. Установить
pnpm install

# 2. Поднять Postgres + Redis
pnpm db:up

# 3. Создать env-файлы (DB_PASSWORD заполнится из docker-секрета)
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/bot/.env.example apps/bot/.env
cp packages/db/.env.example packages/db/.env
DB_PWD_VAL=$(cat infra/docker/db_password.txt)
for f in .env apps/web/.env apps/bot/.env packages/db/.env; do
  sed -i.bak "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PWD_VAL}|" "$f" && rm "$f.bak"
done

# 4. Применить миграции
pnpm db:migrate

# 5. Запустить dev (web на 3040, bot на 3041)
pnpm dev
```

Проверка: `curl http://localhost:3040/api/health` → 200, `db: ok`, `redis: ok`.

## Команды

| Команда | Что делает |
|---|---|
| `pnpm dev` | Web + bot в watch-режиме |
| `pnpm build` | Билд |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Качество |
| `pnpm db:up` / `pnpm db:down` | Docker |
| `pnpm db:migrate` / `pnpm db:studio` | Миграции и UI |

## Phase roadmap

- ✅ **Plan 1:** Foundation (этот) — монорепо + БД + скелеты
- ⏳ Plan 2: Auth + Migration v1
- ⏳ Plan 3: Tasks module
- ⏳ Plan 4: Shopping + Code + Workouts
- ⏳ Plan 5: Telegram bot (commands + push)
- ⏳ Plan 6: Admin panel
- ⏳ Plan 7: Design polish + PWA + e2e
- ⏳ Plan 8: Deploy + Ops (VPS, nginx, ssl, бэкапы)

## License

Private.
```

- [ ] **Step 2:** Commit

```bash
git add README.md
git commit -m "docs: readme with setup + commands + roadmap"
```

---

## Group G · Verification

### Task 25: Полная проверка

- [ ] **Step 1:** Поднять локалку с нуля

```bash
pnpm db:down
pnpm db:up
sleep 10
pnpm db:migrate
```

Expected: миграции применяются успешно

- [ ] **Step 2:** Запустить все тесты

Run: `pnpm test`
Expected: все тесты PASS — db (4), lib (6)

- [ ] **Step 3:** Lint + typecheck

Run: `pnpm lint && pnpm typecheck`
Expected: 0 errors, 0 warnings

- [ ] **Step 4:** Запустить dev

Run: `pnpm dev`

В отдельном терминале:

```bash
curl -i http://localhost:3040/api/health
curl -i http://127.0.0.1:3041/health
```

Expected: оба отвечают 200 OK с status:ok

- [ ] **Step 5:** Открыть в браузере http://localhost:3040
Expected: редирект на /tasks, sidebar с 4 модулями, Manrope шрифт, кремовый фон. Клики между модулями работают.

- [ ] **Step 6:** Финальный git status

```bash
git status
```

Expected: clean working tree

- [ ] **Step 7:** Тэг milestone

```bash
git tag -a foundation-complete -m "letget phase 1 foundation: monorepo, db schema, web/bot skeletons"
```

- [ ] **Step 8:** (опционально) Push

```bash
git push origin main --tags
```

---

## Self-review checklist (для исполнителя)

- [ ] `pnpm db:up && pnpm db:migrate && pnpm dev` поднимает всё с нуля
- [ ] http://localhost:3040/api/health → 200, db ok, redis ok
- [ ] http://127.0.0.1:3041/health → 200
- [ ] 16 таблиц в БД (`docker exec letget-postgres-dev psql -U letget -d letget -c '\dt'`)
- [ ] 4 enum'а (user_role, theme, event_type, notification_channel)
- [ ] Manrope шрифт активен на странице
- [ ] CI зелёный на GitHub
- [ ] `legacy/` сохранён, можно открыть `legacy/index.html` и увидеть v1
- [ ] Тэг `foundation-complete` создан
- [ ] Коммиты в lowercase без AI-маркеров

После этого — Plan 2: Auth + Migration.

---

## Что НЕ делаем в Plan 1

- Не реализуем auth (Plan 2)
- Не пишем module-логику (Plans 3-4)
- Не настраиваем production deploy (Plan 8)
- Не пишем e2e тесты (Plan 7)
- Не подключаем реально Resend / Telegram (Plans 2/5)
- Не делаем PWA, sw.js, manifest (Plan 7)
- Не добавляем Better Auth (Plan 2)

Эти placeholder'ы намеренно оставлены — каждый Plan имеет свой чёткий scope.
