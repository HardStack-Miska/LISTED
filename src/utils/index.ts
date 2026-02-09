// Utility functions exports
export { getNextOccurrenceDate } from './recurrence';
export {
  groupTasksByDate,
  filterOverdueTasks,
  filterTodayTasks,
  filterCompletedTasks,
  formatDayName,
  getStartOfDay,
  isSameDay,
} from './dateFilters';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
