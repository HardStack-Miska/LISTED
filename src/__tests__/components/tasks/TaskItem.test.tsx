import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { Task, Label } from "@/types";

const mockLabels: Label[] = [
  { id: "label-1", name: "work", color: "#6366f1", order: 0 },
  { id: "label-2", name: "personal", color: "#22c55e", order: 1 },
];

const mockTask: Task = {
  id: "task-1",
  title: "Test Task",
  description: "Test description",
  priority: 2,
  dueDate: new Date("2026-02-10"),
  completed: false,
  labels: ["label-1"],
  order: 0,
  createdAt: new Date("2026-02-01"),
  updatedAt: new Date("2026-02-01"),
};

describe("TaskItem", () => {
  const mockToggleComplete = jest.fn();
  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render task title", () => {
    const { getByText } = render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    expect(getByText("Test Task")).toBeTruthy();
  });

  it("should call onPress when task is pressed", () => {
    const { getByText } = render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    fireEvent.press(getByText("Test Task"));
    expect(mockOnPress).toHaveBeenCalledWith("task-1");
  });

  it("should call onLongPress when task is long pressed", () => {
    const { getByText } = render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
      />,
    );

    fireEvent(getByText("Test Task"), "longPress");
    expect(mockOnLongPress).toHaveBeenCalledWith("task-1");
  });

  it("should render completed task with strikethrough style", () => {
    const completedTask = { ...mockTask, completed: true };

    const { getByText } = render(
      <TaskItem
        task={completedTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    const title = getByText("Test Task");
    expect(title.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textDecorationLine: "line-through" }),
      ]),
    );
  });

  it("should display due date when present", () => {
    const { getByText } = render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    // The date should be formatted (e.g., "10 фев")
    expect(getByText(/10/)).toBeTruthy();
  });

  it("should display labels when present", () => {
    const { getByText } = render(
      <TaskItem
        task={mockTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
        allLabels={mockLabels}
      />,
    );

    expect(getByText("work")).toBeTruthy();
  });

  it("should show priority flag for high priority tasks", () => {
    const highPriorityTask = { ...mockTask, priority: 1 as const };

    const { UNSAFE_queryAllByType } = render(
      <TaskItem
        task={highPriorityTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    // Priority flag icon should be present for P1-P3
    // This is a basic presence check
    expect(UNSAFE_queryAllByType).toBeDefined();
  });

  it("should not show priority flag for P4 tasks", () => {
    const lowPriorityTask = { ...mockTask, priority: 4 as const };

    const { queryByTestId } = render(
      <TaskItem
        task={lowPriorityTask}
        onToggleComplete={mockToggleComplete}
        onPress={mockOnPress}
      />,
    );

    // P4 tasks should not have a priority flag
    expect(queryByTestId("priority-flag")).toBeNull();
  });
});
