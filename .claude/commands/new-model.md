# /new-model - Создание модели WatermelonDB

Создаёт новую модель базы данных.

## Аргумент

$ARGUMENTS - имя модели (PascalCase, единственное число)

## Шаблон модели

```typescript
import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export class ${NAME} extends Model {
  static table = '${TABLE_NAME}';

  static associations = {
    // связи с другими таблицами
  };

  @text('title') title!: string;
  @field('is_active') isActive!: boolean;
  @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
```

## Шаблон схемы

```typescript
// в database/schema.ts
{
  name: '${TABLE_NAME}',
  columns: [
    { name: 'title', type: 'string' },
    { name: 'is_active', type: 'boolean' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
},
```

## Checklist

- [ ] Модель создана в `src/database/models/`
- [ ] Схема добавлена в `src/database/schema.ts`
- [ ] Модель зарегистрирована в `src/database/index.ts`
- [ ] Миграция создана если БД уже существует

## Типы полей WatermelonDB

| Декоратор | Тип в SQLite | Использование |
|-----------|--------------|---------------|
| `@text` | string | Текстовые поля |
| `@field` | boolean/number | Булевы, числа |
| `@date` | number (timestamp) | Даты |
| `@json` | string (JSON) | Сложные объекты |
| `@relation` | - | Связи с другими моделями |
