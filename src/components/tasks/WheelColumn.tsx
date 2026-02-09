import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import type { ValueChangedEvent, ValueChangingEvent, PickerItem } from '@quidone/react-native-wheel-picker';
import { useTheme } from '@/contexts';
import { FONT_SIZES } from '@/constants';

const DEFAULT_ITEM_HEIGHT = 44;
const DEFAULT_VISIBLE_ITEMS = 5;

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  itemHeight?: number;
  visibleItems?: number;
  width?: number;
}

type WheelItem = PickerItem<number>;

export const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  selectedIndex,
  onSelect,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  visibleItems = DEFAULT_VISIBLE_ITEMS,
  width = 70,
}) => {
  const { colors } = useTheme();

  const data: WheelItem[] = useMemo(
    () => items.map((label, index) => ({ value: index, label })),
    [items],
  );

  const handleValueChanged = useCallback(
    (event: ValueChangedEvent<WheelItem>) => {
      onSelect(event.item.value);
    },
    [onSelect],
  );

  const overlayStyle = useMemo(
    () => ({
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
    }),
    [colors.primary],
  );

  const textStyle = useMemo(
    () => ({
      fontSize: FONT_SIZES.lg,
      fontWeight: '600' as const,
      color: colors.text,
    }),
    [colors.text],
  );

  return (
    <WheelPicker
      data={data}
      value={selectedIndex}
      onValueChanged={handleValueChanged}
      itemHeight={itemHeight}
      visibleItemCount={visibleItems}
      width={width}
      enableScrollByTapOnItem
      itemTextStyle={textStyle}
      overlayItemStyle={overlayStyle}
    />
  );
};
