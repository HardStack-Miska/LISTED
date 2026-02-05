import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { ReminderPicker } from "@/components/tasks/ReminderPicker";
import { ThemeProvider } from "@/contexts/ThemeContext";

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

describe("ReminderPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render with add button when no reminder set", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={null} onChange={mockOnChange} hasDueDate={true} />,
    );

    expect(getByText("Добавить напоминание")).toBeTruthy();
  });

  it("should display reminder value when set", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={15} onChange={mockOnChange} hasDueDate={true} />,
    );

    expect(getByText("За 15 мин")).toBeTruthy();
  });

  it("should display 'В срок' when value is 0", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={0} onChange={mockOnChange} hasDueDate={true} />,
    );

    expect(getByText("В срок")).toBeTruthy();
  });

  it("should open modal when add button pressed", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={null} onChange={mockOnChange} hasDueDate={true} />,
    );

    fireEvent.press(getByText("Добавить напоминание"));

    expect(getByText("Напомнить")).toBeTruthy();
  });

  it("should show quick reminder options", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={null} onChange={mockOnChange} hasDueDate={true} />,
    );

    fireEvent.press(getByText("Добавить напоминание"));

    expect(getByText("В срок")).toBeTruthy();
    expect(getByText("За 5 мин")).toBeTruthy();
    expect(getByText("За 15 мин")).toBeTruthy();
    expect(getByText("За 30 мин")).toBeTruthy();
    expect(getByText("За 1 час")).toBeTruthy();
    expect(getByText("За 1 день")).toBeTruthy();
  });

  it("should call onChange when reminder option selected", async () => {
    const { getByText, getAllByText } = await renderWithTheme(
      <ReminderPicker value={null} onChange={mockOnChange} hasDueDate={true} />,
    );

    fireEvent.press(getByText("Добавить напоминание"));
    const options = getAllByText("За 15 мин");
    fireEvent.press(options[0]!);

    expect(mockOnChange).toHaveBeenCalledWith(15);
  });

  it("should show disabled state when no due date", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker
        value={null}
        onChange={mockOnChange}
        hasDueDate={false}
      />,
    );

    expect(getByText("Установите срок выполнения")).toBeTruthy();
  });

  it("should show change button when value is set", async () => {
    const { getByText } = await renderWithTheme(
      <ReminderPicker value={15} onChange={mockOnChange} hasDueDate={true} />,
    );

    expect(getByText("Изменить")).toBeTruthy();
  });
});
