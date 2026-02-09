import type { Task, TaskGroup } from '@/types';

const DAY_NAMES = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTH_NAMES = [
  'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.toDateString() === b.toDateString();

export const formatDayName = (date: Date): string => {
  const today = getStartOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const target = getStartOfDay(date);

  if (target.getTime() === today.getTime()) return 'Сегодня';
  if (target.getTime() === tomorrow.getTime()) return 'Завтра';

  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
};

export const groupTasksByDate = (tasks: Task[]): TaskGroup[] => {
  const groups = new Map<string, Task[]>();
  const noDate: Task[] = [];

  for (const task of tasks) {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toDateString();
      const existing = groups.get(dateKey) ?? [];
      groups.set(dateKey, [...existing, task]);
    } else {
      noDate.push(task);
    }
  }

  const sortedDates = Array.from(groups.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  const result: TaskGroup[] = sortedDates.map((dateKey) => ({
    title: formatDayName(new Date(dateKey)),
    tasks: groups.get(dateKey) ?? [],
  }));

  if (noDate.length > 0) {
    result.push({ title: 'Без даты', tasks: noDate });
  }

  return result;
};

export const filterOverdueTasks = (tasks: Task[]): Task[] => {
  const today = getStartOfDay();
  return tasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < today && !task.completed,
  );
};

export const filterTodayTasks = (tasks: Task[]): Task[] => {
  const today = getStartOfDay();
  return tasks.filter(
    (task) =>
      !task.completed &&
      (!task.dueDate || isSameDay(new Date(task.dueDate), today)),
  );
};

export const filterCompletedTasks = (tasks: Task[]): Task[] =>
  tasks.filter((task) => task.completed);
