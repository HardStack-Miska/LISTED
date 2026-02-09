# LISTED — Task Manager App

## О проекте

**LISTED** — мобильное приложение для управления задачами в стиле Todoist.

### Стек технологий
- **Framework:** React Native 0.76 (Expo SDK 52, New Architecture)
- **Router:** Expo Router 4
- **Database:** SQLite (expo-sqlite) + PowerSync (опциональная синхронизация)
- **Auth:** Supabase Auth + expo-secure-store
- **State:** React Context (TaskContext, AuthContext, SyncContext, ThemeContext, SnackbarContext)
- **Charts:** react-native-gifted-charts
- **UI Picker:** @quidone/react-native-wheel-picker
- **Notifications:** expo-notifications
- **Styling:** StyleSheet + константы (COLORS, SPACING, FONT_SIZES, UI_SIZES)
- **Testing:** Jest 30 + @testing-library/react-native (138 тестов, 15 suites)
- **Linting:** ESLint 9 + Prettier

### Структура проекта

```
src/
├── app/                          # Expo Router экраны
│   ├── (auth)/                   # Авторизация (sign-in, sign-up)
│   ├── (tabs)/                   # Основные табы
│   │   ├── today.tsx             # Задачи на сегодня
│   │   ├── tasks/index.tsx       # Все задачи (фильтры, сортировка)
│   │   ├── calendar.tsx          # Календарный вид
│   │   ├── upcoming.tsx          # Предстоящие задачи
│   │   ├── projects/index.tsx    # Проекты
│   │   ├── labels/index.tsx      # Метки
│   │   ├── analytics.tsx         # Статистика
│   │   └── settings.tsx          # Настройки
│   ├── task/[id].tsx             # Детали/редактирование задачи
│   ├── projects/[id].tsx         # Детали проекта
│   └── onboarding.tsx            # Онбординг
├── components/
│   ├── tasks/                    # Компоненты задач
│   │   ├── TaskItem.tsx
│   │   ├── QuickAddTask.tsx
│   │   ├── DatePicker.tsx        # Быстрый выбор даты + календарь
│   │   ├── TimePicker.tsx        # Выбор времени (wheel picker)
│   │   ├── DurationPicker.tsx    # Длительность задачи
│   │   ├── WheelColumn.tsx       # Обёртка @quidone/react-native-wheel-picker
│   │   ├── PriorityPicker.tsx    # Приоритет P1-P4
│   │   ├── RecurrencePicker.tsx  # Повторение задач
│   │   ├── ReminderPicker.tsx    # Напоминания
│   │   ├── SubtaskList.tsx       # Подзадачи
│   │   ├── CalendarView.tsx      # Основной календарь
│   │   ├── CalendarMonthGrid.tsx # Месячная сетка
│   │   ├── CalendarDayView.tsx   # Дневной вид
│   │   ├── DayTimeline.tsx       # Таймлайн дня
│   │   ├── FilterBuilder.tsx     # Конструктор фильтров
│   │   ├── FilterList.tsx        # Список фильтров
│   │   └── ActivityHistory.tsx   # История активности
│   └── ui/                       # Переиспользуемые UI компоненты
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── FloatingActionButton.tsx
│       ├── HoldToDeleteButton.tsx
│       ├── OfflineBanner.tsx
│       ├── SearchBar.tsx
│       └── Snackbar.tsx
├── contexts/                     # React Context провайдеры
│   ├── TaskContext.tsx            # CRUD задач, проектов, меток
│   ├── AuthContext.tsx            # Авторизация
│   ├── SyncContext.tsx            # Синхронизация с сервером
│   ├── ThemeContext.tsx           # Тёмная/светлая тема
│   └── SnackbarContext.tsx        # Уведомления в UI
├── hooks/                        # Кастомные хуки
│   ├── useTasks.ts
│   ├── useProjects.ts
│   ├── useLabels.ts
│   ├── useAnalytics.ts
│   ├── useTaskDetail.ts
│   └── useNotificationDeepLink.ts
├── services/                     # Сервисный слой
│   ├── database/                 # SQLite (DatabaseService, WebDatabaseService, schema)
│   ├── auth/                     # AuthService
│   ├── notifications/            # NotificationService
│   ├── network/                  # NetworkService
│   ├── powersync/                # PowerSync (опциональная синхронизация)
│   ├── supabase/                 # Supabase клиент
│   ├── filters/                  # FilterService
│   ├── analytics/                # AnalyticsService
│   ├── activity/                 # ActivityService
│   └── sentry/                   # SentryService (error tracking)
├── utils/                        # Утилиты
│   ├── index.ts
│   ├── dateFilters.ts
│   └── recurrence.ts
└── constants/index.ts            # COLORS_LIGHT, COLORS_DARK, SPACING, FONT_SIZES, UI_SIZES
```

### Реализованные функции
- Задачи с приоритетами P1-P4
- Проекты с цветами
- Метки (теги)
- Подзадачи
- Календарь (месяц, день, таймлайн)
- Поиск и фильтрация (конструктор фильтров)
- Сортировка (дата → приоритет → имя)
- Пометка просроченных задач
- Тёмная/светлая тема (автоматически)
- Quick Add (быстрое добавление)
- Повторяющиеся задачи (recurrence)
- Напоминания (push-уведомления)
- Длительность задач
- Авторизация (sign-in / sign-up через Supabase)
- Онбординг
- Статистика и аналитика
- Offline-поддержка
- История активности

---

## Команды

```bash
npm start              # Запуск Expo
npm test               # Jest тесты
npm run lint           # ESLint проверка
npm run lint:fix       # ESLint с автофиксом
npm run typecheck      # TypeScript проверка (tsc --noEmit)
npm run format         # Prettier форматирование
npm run format:check   # Prettier проверка
```

---

## Правила

### Поведение
- Do what has been asked; nothing more, nothing less
- ALWAYS read a file before editing it
- ALWAYS run `npm run typecheck` and `npm test` after code changes
- ALWAYS prefer editing existing files over creating new ones
- NEVER create files unless absolutely necessary
- NEVER proactively create documentation files (*.md) unless explicitly requested
- NEVER commit secrets, credentials, or .env files
- NEVER save files to root folder — use `src/` structure

### Стиль кода
- TypeScript strict mode
- `const` вместо `let`
- camelCase для переменных/функций, PascalCase для компонентов
- UPPER_SNAKE_CASE для констант
- Один компонент на файл, максимум 300 строк
- StyleSheet для стилей, константы из `@/constants`
- `useCallback`, `useMemo` для оптимизации рендеров
- Код на английском, UI текст на русском
- Одинарные кавычки, 2 пробела, точка с запятой

### Тестирование
- Тесты в `src/__tests__/` (зеркальная структура `src/`)
- Jest + @testing-library/react-native
- Формат: `should [behavior] when [condition]`
- Мокай внешние зависимости, не внутреннюю логику
- Тесты должны быть изолированы, без общего состояния

### Git (Conventional Commits)
- `feat(scope):` — новая функциональность
- `fix(scope):` — исправление бага
- `refactor(scope):` — рефакторинг
- `style(scope):` — форматирование
- `test(scope):` — тесты
- Атомарные коммиты, макс 72 символа в заголовке
- Ветки: `feature/*`, `fix/*`, `release/*`

### Безопасность
- NEVER hardcode API keys, secrets, or credentials
- NEVER commit .env files
- Validate user input at system boundaries
- Use parameterized SQL queries (no string concatenation)
