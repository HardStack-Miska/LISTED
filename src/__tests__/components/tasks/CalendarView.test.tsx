import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { CalendarView } from "@/components/tasks/CalendarView";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Task } from "@/types";

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

describe("CalendarView", () => {
  const mockOnSelectDate = jest.fn();
  const mockOnTaskPress = jest.fn();

  const createTask = (overrides: Partial<Task> = {}): Task => ({
    id: "task-1",
    title: "Test Task",
    priority: 2,
    completed: false,
    labels: [],
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    mockOnSelectDate.mockClear();
    mockOnTaskPress.mockClear();
  });

  it("should render current month and year", async () => {
    const { getByText } = await renderWithTheme(
      <CalendarView tasks={[]} onSelectDate={mockOnSelectDate} />,
    );

    const now = new Date();
    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    const expectedHeader = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    expect(getByText(expectedHeader)).toBeTruthy();
  });

  it("should render day names header", async () => {
    const { getByText } = await renderWithTheme(
      <CalendarView tasks={[]} onSelectDate={mockOnSelectDate} />,
    );

    expect(getByText("Пн")).toBeTruthy();
    expect(getByText("Вт")).toBeTruthy();
    expect(getByText("Ср")).toBeTruthy();
    expect(getByText("Чт")).toBeTruthy();
    expect(getByText("Пт")).toBeTruthy();
    expect(getByText("Сб")).toBeTruthy();
    expect(getByText("Вс")).toBeTruthy();
  });

  it("should render days of the month", async () => {
    const { getByText } = await renderWithTheme(
      <CalendarView tasks={[]} onSelectDate={mockOnSelectDate} />,
    );

    expect(getByText("1")).toBeTruthy();
    expect(getByText("15")).toBeTruthy();
  });

  it("should call onSelectDate when day is pressed", async () => {
    const { getByText } = await renderWithTheme(
      <CalendarView tasks={[]} onSelectDate={mockOnSelectDate} />,
    );

    fireEvent.press(getByText("15"));

    expect(mockOnSelectDate).toHaveBeenCalled();
    const selectedDate = mockOnSelectDate.mock.calls[0][0];
    expect(selectedDate.getDate()).toBe(15);
  });

  it("should navigate to previous month", async () => {
    const { getByTestId, getByText } = await renderWithTheme(
      <CalendarView
        tasks={[]}
        onSelectDate={mockOnSelectDate}
        testID="calendar"
      />,
    );

    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];

    const prevButton = getByTestId("prev-month");
    fireEvent.press(prevButton);

    const expectedHeader = `${monthNames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
    expect(getByText(expectedHeader)).toBeTruthy();
  });

  it("should navigate to next month", async () => {
    const { getByTestId, getByText } = await renderWithTheme(
      <CalendarView
        tasks={[]}
        onSelectDate={mockOnSelectDate}
        testID="calendar"
      />,
    );

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];

    const nextButton = getByTestId("next-month");
    fireEvent.press(nextButton);

    const expectedHeader = `${monthNames[nextMonth.getMonth()]} ${nextMonth.getFullYear()}`;
    expect(getByText(expectedHeader)).toBeTruthy();
  });

  it("should show task dots on days with tasks", async () => {
    const today = new Date();
    const tasks = [
      createTask({ id: "1", title: "Task 1", dueDate: today }),
      createTask({ id: "2", title: "Task 2", dueDate: today }),
    ];

    const { getByTestId } = await renderWithTheme(
      <CalendarView
        tasks={tasks}
        onSelectDate={mockOnSelectDate}
        testID="calendar"
      />,
    );

    const dayCell = getByTestId(`day-${today.getDate()}`);
    expect(dayCell).toBeTruthy();
  });

  it("should show selected day tasks", async () => {
    const today = new Date();
    const tasks = [
      createTask({ id: "1", title: "Test Task for Today", dueDate: today }),
    ];

    const { getByText } = await renderWithTheme(
      <CalendarView
        tasks={tasks}
        onSelectDate={mockOnSelectDate}
        selectedDate={today}
      />,
    );

    expect(getByText("Test Task for Today")).toBeTruthy();
  });

  it("should show empty state when no tasks for selected day", async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = [
      createTask({ id: "1", title: "Task for tomorrow", dueDate: tomorrow }),
    ];

    const { getByText } = await renderWithTheme(
      <CalendarView
        tasks={tasks}
        onSelectDate={mockOnSelectDate}
        selectedDate={today}
      />,
    );

    expect(getByText("Нет задач на этот день")).toBeTruthy();
  });

  it("should call onTaskPress when task is pressed", async () => {
    const today = new Date();
    const tasks = [
      createTask({ id: "1", title: "Clickable Task", dueDate: today }),
    ];

    const { getByText } = await renderWithTheme(
      <CalendarView
        tasks={tasks}
        onSelectDate={mockOnSelectDate}
        onTaskPress={mockOnTaskPress}
        selectedDate={today}
      />,
    );

    fireEvent.press(getByText("Clickable Task"));

    expect(mockOnTaskPress).toHaveBeenCalledWith(tasks[0]);
  });

  it("should highlight today", async () => {
    const today = new Date();

    const { getByTestId } = await renderWithTheme(
      <CalendarView
        tasks={[]}
        onSelectDate={mockOnSelectDate}
        testID="calendar"
      />,
    );

    const todayCell = getByTestId(`day-${today.getDate()}`);
    expect(todayCell).toBeTruthy();
  });
});
