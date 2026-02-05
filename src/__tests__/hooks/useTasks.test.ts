import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useTasks } from "@/hooks/useTasks";
import { databaseService } from "@/services/database";

// Mock database service
jest.mock("@/services/database", () => ({
  databaseService: {
    initDatabase: jest.fn().mockResolvedValue(undefined),
    getTasksForToday: jest.fn().mockResolvedValue([]),
    getTasksUpcoming: jest.fn().mockResolvedValue([]),
    createTask: jest.fn().mockResolvedValue({ id: "new-task-id" }),
    toggleTaskComplete: jest.fn().mockResolvedValue(undefined),
    deleteTask: jest.fn().mockResolvedValue(undefined),
    updateTask: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("useTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useTasks("today"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should load today tasks when mode is today", async () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Task 1",
        priority: 2,
        completed: false,
        labels: [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (databaseService.getTasksForToday as jest.Mock).mockResolvedValue(
      mockTasks,
    );

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(databaseService.getTasksForToday).toHaveBeenCalled();
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it("should load upcoming tasks when mode is upcoming", async () => {
    const mockTasks = [
      {
        id: "task-2",
        title: "Future Task",
        priority: 3,
        dueDate: new Date("2026-03-01"),
        completed: false,
        labels: [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (databaseService.getTasksUpcoming as jest.Mock).mockResolvedValue(
      mockTasks,
    );

    const { result } = renderHook(() => useTasks("upcoming"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(databaseService.getTasksUpcoming).toHaveBeenCalled();
    expect(result.current.tasks).toEqual(mockTasks);
  });

  it("should create task and refresh list", async () => {
    (databaseService.getTasksForToday as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const newTask = await result.current.createTask({
        title: "New Task",
        priority: 1,
      });
      expect(newTask.id).toBe("new-task-id");
    });

    expect(databaseService.createTask).toHaveBeenCalledWith({
      title: "New Task",
      priority: 1,
    });
  });

  it("should toggle task completion", async () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Task 1",
        priority: 2,
        completed: false,
        labels: [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (databaseService.getTasksForToday as jest.Mock).mockResolvedValue(
      mockTasks,
    );

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleComplete("task-1");
    });

    expect(databaseService.toggleTaskComplete).toHaveBeenCalledWith("task-1");
    expect(result.current.tasks[0]?.completed).toBe(true);
  });

  it("should delete task", async () => {
    const mockTasks = [
      {
        id: "task-1",
        title: "Task 1",
        priority: 2,
        completed: false,
        labels: [],
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (databaseService.getTasksForToday as jest.Mock).mockResolvedValue(
      mockTasks,
    );

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteTask("task-1");
    });

    expect(databaseService.deleteTask).toHaveBeenCalledWith("task-1");
    expect(result.current.tasks).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    (databaseService.getTasksForToday as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Не удалось загрузить задачи");
  });

  it("should refresh tasks", async () => {
    (databaseService.getTasksForToday as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useTasks("today"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the mock to track the refresh call
    (databaseService.getTasksForToday as jest.Mock).mockClear();

    await act(async () => {
      await result.current.refresh();
    });

    expect(databaseService.getTasksForToday).toHaveBeenCalled();
  });
});
