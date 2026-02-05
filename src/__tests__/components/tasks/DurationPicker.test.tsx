import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DurationPicker } from "@/components/tasks/DurationPicker";
import { ThemeProvider } from "@/contexts/ThemeContext";

const renderWithTheme = async (component: React.ReactElement) => {
  const result = render(<ThemeProvider>{component}</ThemeProvider>);
  // Wait for ThemeProvider to load
  await waitFor(
    () => {
      expect(result.queryByText(/./)).toBeTruthy();
    },
    { timeout: 1000 },
  ).catch(() => {});
  return result;
};

describe("DurationPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render with default text when no value", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker onChange={mockOnChange} />,
    );

    expect(getByText("Длительность")).toBeTruthy();
  });

  it("should display formatted duration for minutes", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker value={30} onChange={mockOnChange} />,
    );

    expect(getByText("30 мин")).toBeTruthy();
  });

  it("should display formatted duration for hours", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker value={60} onChange={mockOnChange} />,
    );

    expect(getByText("1 ч")).toBeTruthy();
  });

  it("should display formatted duration for hours and minutes", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker value={90} onChange={mockOnChange} />,
    );

    expect(getByText("1 ч 30 мин")).toBeTruthy();
  });

  it("should open modal when pressed", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Длительность"));

    expect(getByText("Выберите длительность")).toBeTruthy();
  });

  it("should show quick duration options in modal", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Длительность"));

    expect(getByText("15 мин")).toBeTruthy();
    expect(getByText("30 мин")).toBeTruthy();
    expect(getByText("1 час")).toBeTruthy();
    expect(getByText("2 часа")).toBeTruthy();
  });

  it("should call onChange when quick option selected", async () => {
    const { getByText, getAllByText } = await renderWithTheme(
      <DurationPicker onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Длительность"));
    const options = getAllByText("30 мин");
    fireEvent.press(options[0]!);

    expect(mockOnChange).toHaveBeenCalledWith(30);
  });

  it("should show custom input section", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("Длительность"));

    expect(getByText("Своё значение")).toBeTruthy();
  });

  it("should show clear button when value is set", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker value={60} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("1 ч"));

    expect(getByText("Очистить")).toBeTruthy();
  });

  it("should clear value when clear is pressed", async () => {
    const { getByText } = await renderWithTheme(
      <DurationPicker value={60} onChange={mockOnChange} />,
    );

    fireEvent.press(getByText("1 ч"));
    fireEvent.press(getByText("Очистить"));

    expect(mockOnChange).toHaveBeenCalledWith(undefined);
  });
});
