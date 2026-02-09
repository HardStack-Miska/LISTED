# /new-component - Создание компонента

Создаёт новый React Native компонент по шаблону.

## Аргумент

$ARGUMENTS - имя компонента (PascalCase)

## Шаблон компонента

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ${NAME}Props {
  // props
}

export const ${NAME}: React.FC<${NAME}Props> = (props) => {
  return (
    <View style={styles.container}>
      {/* content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // styles
  },
});
```

## Расположение

- UI компоненты: `src/components/ui/${NAME}.tsx`
- Компоненты задач: `src/components/tasks/${NAME}.tsx`
- Экраны: `src/app/${name}.tsx`

## Checklist

- [ ] Имя в PascalCase
- [ ] Props interface определён
- [ ] Стили в StyleSheet
- [ ] Экспорт добавлен в index.ts
