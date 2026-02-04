# LISTED

## О проекте
Мобильное приложение для заметок и организации информации с локальным хранением данных.
- **Платформы**: iOS, Android (React Native + Expo)
- **Приоритет**: Mobile-first, оффлайн-режим
- **Будущее**: Облачная синхронизация

## Технический стек
- **Framework**: React Native + Expo (SDK 52+)
- **Language**: TypeScript (strict mode)
- **Storage**: WatermelonDB + SQLite
- **State**: Zustand
- **Editor**: TipTap или react-native-pell-rich-editor
- **Navigation**: Expo Router

## Структура проекта
```
src/
├── app/                 # Expo Router screens
├── components/          # UI компоненты
│   ├── ui/             # Базовые (Button, Input, etc.)
│   ├── blocks/         # Блоки редактора (Text, List, Code, etc.)
│   └── editor/         # Редактор страниц
├── database/           # WatermelonDB модели и схемы
├── stores/             # Zustand stores
├── hooks/              # Кастомные хуки
├── utils/              # Утилиты
├── types/              # TypeScript типы
└── constants/          # Константы приложения
```

## Архитектурные решения

### База данных (WatermelonDB)
Модели:
- `Page` - страница/документ
- `Block` - блок контента (текст, список, код, etc.)
- `Workspace` - рабочее пространство

### Блоки редактора (MVP)
1. Текст (paragraph)
2. Заголовки (h1, h2, h3)
3. Списки (bullet, numbered, checkbox)
4. Код (code block)
5. Изображения (image)

### Вложенные страницы
Страница может содержать ссылки на дочерние страницы (parent_id в модели Page).

---

## Правила разработки

### Обязательно
- Весь код на TypeScript со strict mode
- Компоненты — функциональные с хуками
- Каждый компонент в отдельном файле
- Именование: PascalCase для компонентов, camelCase для функций
- Тесты для критической логики (база данных, синхронизация)

### Запрещено
- `any` тип (используй `unknown` если нужно)
- Inline styles (используй StyleSheet)
- Хардкод строк (выноси в constants)
- console.log в продакшн коде
- Прямые SQL запросы (только через WatermelonDB API)

### Оффлайн-first принципы
- Все данные сначала сохраняются локально
- UI не должен блокироваться при отсутствии сети
- Показывай статус синхронизации пользователю
- Конфликты разрешай по last-write-wins или спрашивай пользователя

### Производительность
- Используй FlatList/FlashList для длинных списков
- Мемоизируй тяжёлые компоненты (React.memo)
- Ленивая загрузка страниц и блоков
- Виртуализация для больших документов

---

## Субагенты

### planner
**Роль**: Планирование фич и разбиение на задачи
**Когда использовать**: Новая фича, неясные требования
**Инструменты**: Read, Glob, Grep, WebFetch

### code-reviewer
**Роль**: Проверка качества кода
**Когда использовать**: Перед коммитом, после крупных изменений
**Проверяет**:
- Соответствие TypeScript strict mode
- Отсутствие any типов
- Правильная структура компонентов
- Отсутствие console.log
- Соблюдение архитектуры

### build-error-resolver
**Роль**: Исправление ошибок сборки
**Когда использовать**: Падает build, ошибки TypeScript
**Инструменты**: Read, Edit, Bash, Glob, Grep

### security-reviewer
**Роль**: Анализ безопасности
**Когда использовать**: Работа с данными пользователя, авторизация
**Проверяет**:
- Безопасное хранение данных
- Валидация входных данных
- Отсутствие уязвимостей

---

## Команды

### /plan <feature>
Запускает planner для планирования фичи

### /review
Запускает code-reviewer для текущих изменений

### /fix-build
Запускает build-error-resolver

### /test
Запускает тесты

### /lint
Запускает ESLint + TypeScript проверку

---

## Git Workflow

### Ветки
- `main` — стабильный код
- `develop` — интеграция
- `feature/*` — новые фичи
- `fix/*` — исправления

### Коммиты (Conventional Commits)
```
feat(editor): add code block support
fix(database): resolve sync conflict
refactor(components): extract BlockRenderer
```

---

## Контакты и ресурсы
- Expo Docs: https://docs.expo.dev
- WatermelonDB: https://watermelondb.dev
- React Native: https://reactnative.dev
