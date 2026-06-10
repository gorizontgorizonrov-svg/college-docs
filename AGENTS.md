# AGENTS.md

## Stack
- Next.js 15+ (App Router) + TypeScript + Tailwind CSS v4
- Prisma ORM v5 + PostgreSQL
- Auth.js v5 (NextAuth) with CredentialsProvider + JWT
- React Hook Form + Zod
- AES-256-GCM + SHA-256 for digital signatures

## База данных (Prisma)
- Schema: `prisma/schema.prisma`
- Models (13):
  - User — аутентификация (id, email, passwordHash, role, isActive)
  - Employee — профиль сотрудника (firstName, lastName, middleName, связь с User/Position/Department)
  - Position — должность (name, level для иерархии)
  - Department — отдел/ПЦК (name, code)
  - InternalDocument — внутренний документ (title, content, type, status, number, fileUrl, deadline)
  - DocumentVersion — версии документа (version, content, fileUrl, changeNote, author)
  - WorkflowTemplate — шаблон маршрута (name, docType)
  - WorkflowStage — этап маршрута (stageOrder, approverPositionId, deadlineDays)
  - DocumentApproval — запись согласования (approver, decision, comment, signatureId)
  - DigitalSignature — электронная подпись (signatureData, documentHash, algorithm, isVerified)
  - IncomingDocument — входящий документ (incomingNumber, fromOrg, status, resolution, deadline)
  - Notification — уведомления (type, title, message, isRead)
  - AuditLog — аудит (action, entityType, entityId, oldStatus, newStatus, ipAddress)
- Key enums:
  - Role: INITIATOR, VALIDATOR, SIGNER, REGISTRAR, ADMIN
  - InternalDocType: ORDER, DIRECTIVE, PROTOCOL, ACT, MEMO, CONTRACT, REPORT
  - DocumentStatus: DRAFT, IN_APPROVAL, APPROVED, REJECTED, ARCHIVED
  - ReviewDecision: APPROVE, REJECT, RETURN_TO_AUTHOR
  - IncomingStatus: REGISTERED, UNDER_RESOLUTION, IN_EXECUTION, EXECUTED, ARCHIVED
  - NotificationType: APPROVAL_REQUEST, DOCUMENT_SIGNED, DOCUMENT_REJECTED, DOCUMENT_RETURNED, RESOLUTION_ASSIGNED, DEADLINE_REMINDER, SYSTEM
  - AuditAction: CREATE, EDIT, DELETE, APPROVE, REJECT, RETURN, SIGN, REGISTER, ARCHIVE, ASSIGN_RESOLUTION, EXPORT, LOGIN
- Commands:
  - `npx prisma generate` — после изменений схемы
  - `npx prisma db push` — синхронизация с PostgreSQL
  - `npx prisma db seed` — заполнение тестовыми данными (сотрудники, должности, отделы, шаблоны)

## Структура проекта
- `app/` — Next.js App Router
  - `login/` — страница входа
  - `dashboard/` — главная с аналитикой
  - `documents/` — создание, просмотр, согласование
  - `incoming/` — входящие документы
  - `archive/` — архив с поиском
  - `admin/employees/` — управление сотрудниками
  - `api/auth/[...nextauth]` — NextAuth handler
  - `api/upload` — загрузка файлов
  - `api/files/[fileName]` — раздача файлов
- `components/` — UI: Navigation, Footer, ThemeProvider, ThemeToggle, OfflineNotice, ApprovalTimeline, SignatureStamp
- `actions/` — server actions: documents.ts, workflow.ts, incoming.ts, signature.ts, notifications.ts, dashboard.ts, audit.ts
- `lib/` — утилиты: prisma.ts, env.ts, crypto.ts, audit.ts
- `prisma/` — schema.prisma, seed.ts
- `private/uploads/` — загруженные файлы (gitignored)

## Аутентификация (Auth.js v5)
- Провайдер: Credentials (email + password)
- Стратегия: JWT (без сессий в БД)
- Кастомная сессия: id, role, email
- bcrypt для хеширования паролей
- Страница входа: `/login`
- Middleware защита маршрутов по ролям (`middleware.ts`)

## Ролевая модель
| Роль | Описание | Доступ |
|------|----------|--------|
| INITIATOR | Инициатор (преподаватель) | Создание документов, просмотр своих |
| VALIDATOR | Согласующий (зав.ПЦК, нач.уч.части) | Согласование, возврат на доработку |
| SIGNER | Подписант (директор, зам.директора) | Утверждение, ЭП |
| REGISTRAR | Регистратор (делопроизводитель) | Входящие, регистрация, архив |
| ADMIN | Администратор системы | Полный доступ, управление сотрудниками |

## Seed-данные
- 7 сотрудников колледжа (Турдубаева Б.М. — директор, Беков Э. — директор, Кожобек кызы Гулпери — зам.директора, Абиева М.Ш. — нач.уч.части, Кудукбаева Э. — инспектор УМР, Сапарбаева М.М. — делопроизводитель, Учитель И.И. — преподаватель)
- 8 должностей с level (иерархия 1-99)
- 5 отделов (ПЦК + Учебный отдел + Администрация)
- 3+ workflow шаблона (приказ — 5 этапов, служебная записка — 3 этапа, отчёт — 3 этапа)

## Бизнес-логика документооборота
1. INITIATOR создаёт документ → статус DRAFT
2. Отправляет на согласование → IN_APPROVAL, генерируется номер
3. Документ проходит этапы по шаблону (ПЦК → Учебный отдел → Зам.директора → Директор → Регистратор)
4. На каждом этапе VALIDATOR/SIGNER может: согласовать (APPROVE), отклонить (REJECT), вернуть на доработку (RETURN_TO_AUTHOR)
5. Последний этап — подписание ЭП (AES-256-GCM шифрование SHA-256 хеша)
6. После всех согласований — статус APPROVED
7. REGISTRAR может отправить в архив

## Электронная подпись
- Алгоритм: AES-256-GCM
- Ключ: 32 байта (hex) из ENCRYPTION_KEY
- Процесс: content → SHA-256 → encrypt → iv:authTag:ciphertext
- Хранение: DigitalSignature.signatureData
- Визуализация: SignatureStamp с ФИО, должностью, датой

## Контекст Кыргызстана
- Язык интерфейса: русский
- Формат даты: ДД.ММ.ГГГГ
- Формат номера: ORDER-2026-001
- Гриф утверждения: УТВЕРЖДАЮ (правый верхний угол)
- Соответствие СЭД КР
- Структура: ЖАК (Жалал-Абадский колледж) — СП ЖАГУ

## Команды
- `npm run dev` — разработка (http://localhost:3000)
- `npm run build` — продакшн сборка
- `npm run lint` — линтинг
- `npx prisma generate` — генерация Prisma client
- `npx prisma db push` — синхронизация схемы
- `npx prisma db seed` — заполнение тестовыми данными

## Внешние ссылки
- Документация Auth.js: https://authjs.dev
- Prisma: https://prisma.io/docs
