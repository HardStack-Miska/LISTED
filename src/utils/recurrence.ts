import type { Task, RecurrenceRule } from '@/types';

export interface VirtualTask extends Task {
  isVirtual: boolean;
  sourceTaskId: string;
}

/**
 * Calculate the next occurrence date based on recurrence rule.
 * Extracted from TaskContext for reuse.
 */
export const getNextOccurrenceDate = (
  currentDate: Date,
  rule: RecurrenceRule,
): Date => {
  const next = new Date(currentDate);

  switch (rule.type) {
    case 'daily':
      next.setDate(next.getDate() + rule.interval);
      break;

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        let found = false;
        for (let i = 1; i <= 7 && !found; i++) {
          const checkDate = new Date(currentDate);
          checkDate.setDate(checkDate.getDate() + i);
          if (rule.daysOfWeek.includes(checkDate.getDay())) {
            next.setTime(checkDate.getTime());
            found = true;
          }
        }
      } else {
        next.setDate(next.getDate() + 7 * rule.interval);
      }
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + rule.interval);
      if (rule.dayOfMonth) {
        const maxDay = new Date(
          next.getFullYear(),
          next.getMonth() + 1,
          0,
        ).getDate();
        next.setDate(Math.min(rule.dayOfMonth, maxDay));
      }
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + rule.interval);
      break;

    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
};

/**
 * Generate virtual future occurrences of recurring tasks.
 * These are display-only -- not saved to DB.
 *
 * @param tasks - Real tasks from database
 * @param daysAhead - How many days into the future to generate (default 90)
 * @returns Array of virtual tasks representing future occurrences
 */
export const generateVirtualOccurrences = (
  tasks: Task[],
  daysAhead = 90,
): VirtualTask[] => {
  const virtualTasks: VirtualTask[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const recurringTasks = tasks.filter(
    (t) => t.recurrence && t.dueDate && !t.completed,
  );

  for (const task of recurringTasks) {
    if (!task.recurrence || !task.dueDate) continue;

    let currentDate = new Date(task.dueDate);
    let count = 0;
    const maxOccurrences = 200; // Safety limit

    while (count < maxOccurrences) {
      const nextDate = getNextOccurrenceDate(currentDate, task.recurrence);

      // Stop if past the end date
      if (nextDate > endDate) break;

      // Stop if past recurrence endDate
      if (
        task.recurrence.endDate &&
        nextDate > new Date(task.recurrence.endDate)
      ) {
        break;
      }

      // Stop if endAfterCount reached
      if (
        task.recurrence.endAfterCount &&
        count >= task.recurrence.endAfterCount - 1
      ) {
        break;
      }

      virtualTasks.push({
        ...task,
        id: `${task.id}_virtual_${count}`,
        dueDate: nextDate,
        isVirtual: true,
        sourceTaskId: task.id,
        completed: false,
        completedAt: undefined,
      });

      currentDate = nextDate;
      count++;
    }
  }

  return virtualTasks;
};
