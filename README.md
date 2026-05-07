# ЖАК ЖАГУ — Автоматизация приёмной комиссии

Веб-приложение для автоматизации работы приёмной комиссии Жалал-Абадского колледжа (ЖАК), структурного подразделения ЖАГУ, КР.

## Стек

- **Next.js 14+** (App Router)
- **TypeScript**, **Tailwind CSS**
- **Prisma ORM v5** + **PostgreSQL**
- **Auth.js v5** (NextAuth)
- **React Hook Form** + **Zod**

## Требования

- Node.js 18+
- PostgreSQL 14+

## Быстрый старт

```bash
# 1. Клонировать
git clone <repo>
cd college-admissions

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env
# Отредактировать DATABASE_URL и NEXTAUTH_SECRET

# 4. Применить схему БД
npx prisma generate
npx prisma db push

# 5. Запустить
npm run dev
```

## Переменные окружения

| Переменная | Описание |
|----------|----------|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_SECRET | Секрет для JWT (мин. 32 символа) |
| NEXTAUTH_URL | URL приложения |
| ENCRYPTION_KEY | Ключ для AES-256 (опционально) |

## Роли

| Роль | Описание |
|------|----------|
| APPLICANT | Абитуриент — подача заявлений, загрузка документов |
| MODERATOR | Модератор — проверка документов, review заявлений |
| ADMIN | Администратор — полный доступ, audit log |

## Структура проекта

```
app/
├── applicant/        # Личный кабинет абитуриента
├── moderator/        # Панель модератора
│   ├── applications/ # Управление заявлениями
│   ├── reports/      # Отчёты и экспорт
│   └── audit-log/    # Журнал аудита
├── documents/        # Загрузка документов
├── login/            # Авторизация
├── register/         # Регистрация
└── api/              # API endpoints
```

## Деплой

### Vercel + Neon

1. Создать БД на https://neon.tech
2. Задеплоить на https://vercel.com
3. Добавить переменные окружения
4. `npx prisma db push`

### Docker

```bash
docker compose up -d
```

## Функции

- Регистрация абитуриентов
- Подача заявлений на специальности
- Загрузка документов
- Review модераторами
- Рейтинг и сортировка по баллам
- Автоматическое зачисление
- Экспорт в Excel
- Журнал аудита
- PWA поддержка