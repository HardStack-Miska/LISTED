import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { RecurrencePicker } from "@/components/tasks/RecurrencePicker";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { RecurrenceRule } from "@/types";

const renderWithTheme = async (component: React.ReactElement) => {
  const result = render(<ThemeProvider>{component}</ThemeProvider>);
  await waitFor(
    () => {
      expect(result.queryByText(/./)).toBeTruthy();
    },
    { timeout: 1000 },
  ).catch(() => {});
  return result;
};

describe("RecurrencePicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render with add button when no recurrence", async () => {
    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    expect(getByText("Добавить повтор")).toBeTruthy();
  });

  it("should display daily recurrence", async () => {
    const recurrence: RecurrenceRule = { type: "daily", interval: 1 };

    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={recurrence} onChange={mockOnChange} />,
    );

    expect(getByText("Каждый день")).toBeTruthy();
  });

  it("should display weekly recurrence", async () => {
    const recurrence: RecurrenceRule = { type: "weekly", interval: 1 };

    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={recurrence} onChange={mockOnChange} />,
    );

    expect(getByText("Каждую неделю")).toBeTruthy();
  });

  it("should display monthly recurrence", async () => {
    const recurrence: RecurrenceRule = { type: "monthly", interval: 1 };

    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={recurrence} onChange={mockOnChange} />,
    );

    expect(getByText("Каждый месяц")).toBeTruthy();
  });

  it("should open modal when add button pressed", async () => {
    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Добавить повтор"));

    expect(getByText("Повторять")).toBeTruthy();
  });

  it("should show recurrence options in modal", async () => {
    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Добавить повтор"));

    expect(getByText("Каждый день")).toBeTruthy();
    expect(getByText("Каждую неделю")).toBeTruthy();
    expect(getByText("По будням")).toBeTruthy();
    expect(getByText("Каждый месяц")).toBeTruthy();
  });

  it("should call onChange with daily recurrence", async () => {
    const { getByText, getAllByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Добавить повтор"));
    const dailyOptions = getAllByText("Каждый день");
    fireEvent.press(dailyOptions[0]!);

    expect(mockOnChange).toHaveBeenCalledWith({
      type: "daily",
      interval: 1,
    });
  });

  it("should call onChange with weekly recurrence", async () => {
    const { getByText, getAllByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Добавить повтор"));
    const weeklyOptions = getAllByText("Каждую неделю");
    fireEvent.press(weeklyOptions[0]!);

    expect(mockOnChange).toHaveBeenCalledWith({
      type: "weekly",
      interval: 1,
    });
  });

  it("should call onChange with weekdays recurrence", async () => {
    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={null} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Добавить повтор"));
    fireEvent.press(getByText("По будням"));

    expect(mockOnChange).toHaveBeenCalledWith({
      type: "weekly",
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5],
    });
  });

  it("should show change button when value is set", async () => {
    const recurrence: RecurrenceRule = { type: "daily", interval: 1 };

    const { getByText } = await renderWithTheme(
      <RecurrencePicker value={recurrence} onChange={mockOnChange} />,
    );

    expect(getByText("Изменить")).toBeTruthy();
  });
});
