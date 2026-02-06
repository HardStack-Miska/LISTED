# /lint - Проверка кода

Запускает ESLint и TypeScript проверки.

## Команды

```bash
# ESLint
npx eslint src/ --ext .ts,.tsx

# ESLint с автоисправлением
npx eslint src/ --ext .ts,.tsx --fix

# TypeScript
npx tsc --noEmit

# Prettier проверка
npx prettier --check "src/**/*.{ts,tsx}"

# Prettier исправление
npx prettier --write "src/**/*.{ts,tsx}"
```

## Полная проверка перед коммитом

```bash
npm run lint && npm run typecheck && npm test
```

## Типичные ошибки ESLint

| Правило | Исправление |
|---------|-------------|
| `@typescript-eslint/no-explicit-any` | Заменить `any` на конкретный тип |
| `react-hooks/exhaustive-deps` | Добавить зависимости в массив |
| `react-native/no-inline-styles` | Вынести в StyleSheet |
| `no-console` | Удалить console.log |

## При ошибках

1. Запусти с `--fix` для автоисправлений
2. Оставшиеся ошибки исправь вручную
3. Если правило неуместно — добавь `// eslint-disable-next-line` с комментарием почему
