import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SPACING, FONT_SIZES } from '@/constants';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import type { Task, Project } from '@/types/task';
import { PRIORITY_COLORS } from '@/types/task';

const HOUR_HEIGHT = 60;
const TIMELINE_START = 0;
const TIMELINE_END = 24;
const HOUR_LABEL_WIDTH = 50;
const MIN_TASK_HEIGHT = 25;

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DayTimelineProps {
  date: Date;
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  projects?: Project[];
}

interface TaskPosition {
  task: Task;
  lane: number;
  totalLanes: number;
  startMinutes: number;
  endMinutes: number;
}

// Separate all-day tasks (no dueTime) from timed tasks
const partitionTasks = (
  tasks: Task[],
  date: Date,
): { allDay: Task[]; timed: Task[] } => {
  const dateStr = date.toDateString();
  const dayTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toDateString() === dateStr,
  );

  const allDay: Task[] = [];
  const timed: Task[] = [];

  for (const task of dayTasks) {
    if (task.dueTime) {
      timed.push(task);
    } else {
      allDay.push(task);
    }
  }

  return { allDay, timed };
};

const calculateLanes = (timedTasks: Task[]): TaskPosition[] => {
  const sorted = timedTasks
    .filter((t) => t.dueTime)
    .map((t) => {
      const parts = t.dueTime!.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      const start = h * 60 + m;
      const duration = t.duration || 30;
      return { task: t, startMinutes: start, endMinutes: start + duration };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  // Assign lanes using greedy algorithm
  const lanes: number[][] = []; // lanes[i] = array of end times
  const positions: TaskPosition[] = [];

  for (const item of sorted) {
    let assignedLane = -1;
    for (let i = 0; i < lanes.length; i++) {
      const laneEndTimes = lanes[i];
      if (!laneEndTimes) continue;
      const lastEnd = laneEndTimes[laneEndTimes.length - 1];
      if (lastEnd !== undefined && item.startMinutes >= lastEnd) {
        assignedLane = i;
        break;
      }
    }
    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push([]);
    }
    lanes[assignedLane]!.push(item.endMinutes);
    positions.push({
      task: item.task,
      lane: assignedLane,
      totalLanes: 0, // Updated below
      startMinutes: item.startMinutes,
      endMinutes: item.endMinutes,
    });
  }

  // For each task, count max concurrent overlapping lanes
  for (const pos of positions) {
    const overlapping = positions.filter(
      (p) =>
        p.startMinutes < pos.endMinutes && p.endMinutes > pos.startMinutes,
    );
    pos.totalLanes = Math.max(...overlapping.map((p) => p.lane + 1));
  }

  return positions;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const getProjectColor = (
  task: Task,
  projects: Project[],
): string | undefined => {
  if (!task.projectId || !projects.length) return undefined;
  const project = projects.find((p) => p.id === task.projectId);
  return project?.color;
};

const formatHourLabel = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const DayTimeline: React.FC<DayTimelineProps> = ({
  date,
  tasks,
  onTaskPress,
  projects = [],
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);

  const { allDay, timed } = useMemo(
    () => partitionTasks(tasks, date),
    [tasks, date],
  );

  const positions = useMemo(() => calculateLanes(timed), [timed]);

  const isToday = useMemo(() => isSameDay(date, new Date()), [date]);

  const currentTimeMinutes = useMemo(() => {
    if (!isToday) return -1;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday]);

  const dateLabel = useMemo(() => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [date]);

  // Auto-scroll to 8:00 AM or first task
  useEffect(() => {
    const timer = setTimeout(() => {
      let scrollTarget = 8 * HOUR_HEIGHT; // Default: 8:00 AM

      if (positions.length > 0) {
        const earliest = Math.min(...positions.map((p) => p.startMinutes));
        const earliestOffset = (earliest / 60) * HOUR_HEIGHT;
        scrollTarget = Math.min(scrollTarget, earliestOffset);
      }

      // Offset by one hour for visual breathing room
      const offset = Math.max(0, scrollTarget - HOUR_HEIGHT);
      scrollRef.current?.scrollTo({ y: offset, animated: false });
    }, 100);

    return () => clearTimeout(timer);
  }, [positions]);

  const handleTaskPress = useCallback(
    (task: Task) => {
      onTaskPress?.(task);
    },
    [onTaskPress],
  );

  const availableWidth =
    SCREEN_WIDTH - HOUR_LABEL_WIDTH - SPACING.md * 2 - SPACING.sm;

  const totalHeight = (TIMELINE_END - TIMELINE_START) * HOUR_HEIGHT;

  const hours = useMemo(() => {
    const result: number[] = [];
    for (let h = TIMELINE_START; h < TIMELINE_END; h++) {
      result.push(h);
    }
    return result;
  }, []);

  return (
    <View style={styles.container}>
      {/* Date header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{dateLabel}</Text>
      </View>

      {/* All-day section */}
      {allDay.length > 0 && (
        <View style={styles.allDaySection}>
          <Text style={styles.allDayLabel}>{'Весь день'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.allDayChips}>
              {allDay.map((task) => {
                const projectColor = getProjectColor(task, projects);
                const chipColor =
                  projectColor || PRIORITY_COLORS[task.priority];

                return (
                  <Pressable
                    key={task.id}
                    style={[
                      styles.allDayChip,
                      { backgroundColor: chipColor + '20' },
                      { borderLeftColor: chipColor },
                    ]}
                    onPress={() => handleTaskPress(task)}
                  >
                    <Text
                      style={[styles.allDayChipText, { color: chipColor }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.timelineScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.timelineContainer, { height: totalHeight }]}>
          {/* Hour rows: labels + separator lines */}
          {hours.map((hour) => {
            const top = (hour - TIMELINE_START) * HOUR_HEIGHT;
            return (
              <View key={hour} style={[styles.hourRow, { top }]}>
                <Text style={styles.hourLabel}>
                  {formatHourLabel(hour)}
                </Text>
                <View style={styles.hourLine} />
              </View>
            );
          })}

          {/* Task blocks */}
          {positions.map((pos) => {
            const projectColor = getProjectColor(pos.task, projects);
            const blockColor =
              projectColor || PRIORITY_COLORS[pos.task.priority];
            const top =
              pos.startMinutes * (HOUR_HEIGHT / 60);
            const height = Math.max(
              (pos.endMinutes - pos.startMinutes) * (HOUR_HEIGHT / 60),
              MIN_TASK_HEIGHT,
            );
            const laneWidth =
              pos.totalLanes > 0
                ? availableWidth / pos.totalLanes - 4
                : availableWidth - 4;
            const left =
              HOUR_LABEL_WIDTH +
              (pos.totalLanes > 0
                ? (pos.lane / pos.totalLanes) * availableWidth
                : 0);

            return (
              <Pressable
                key={pos.task.id}
                style={[
                  styles.taskBlock,
                  {
                    top,
                    height,
                    left,
                    width: laneWidth,
                    backgroundColor: blockColor + '33',
                    borderLeftColor: blockColor,
                  },
                ]}
                onPress={() => handleTaskPress(pos.task)}
              >
                <Text
                  style={[styles.taskBlockTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {pos.task.title}
                </Text>
                {pos.task.dueTime && (
                  <Text style={styles.taskBlockTime}>
                    {pos.task.dueTime}
                  </Text>
                )}
              </Pressable>
            );
          })}

          {/* Current time indicator */}
          {isToday && currentTimeMinutes >= 0 && (
            <View
              style={[
                styles.currentTimeLine,
                {
                  top: currentTimeMinutes * (HOUR_HEIGHT / 60),
                },
              ]}
            >
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeRule} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerText: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
      textTransform: 'capitalize',
    },
    allDaySection: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    allDayLabel: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    allDayChips: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    allDayChip: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 6,
      borderLeftWidth: 3,
      maxWidth: 160,
    },
    allDayChipText: {
      fontSize: FONT_SIZES.sm,
      fontWeight: '500',
    },
    timelineScroll: {
      flex: 1,
    },
    timelineContainer: {
      position: 'relative',
    },
    hourRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'flex-start',
      height: HOUR_HEIGHT,
    },
    hourLabel: {
      width: HOUR_LABEL_WIDTH,
      fontSize: FONT_SIZES.xs,
      color: colors.textSecondary,
      textAlign: 'right',
      paddingRight: SPACING.sm,
      marginTop: -7, // Align label center with line
    },
    hourLine: {
      flex: 1,
      height: 1,
      borderStyle: 'dashed',
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    taskBlock: {
      position: 'absolute',
      borderLeftWidth: 3,
      borderRadius: 6,
      paddingHorizontal: SPACING.xs,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    taskBlockTitle: {
      fontSize: FONT_SIZES.xs,
      fontWeight: '500',
      lineHeight: 16,
    },
    taskBlockTime: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
    currentTimeLine: {
      position: 'absolute',
      left: HOUR_LABEL_WIDTH - 6,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
    },
    currentTimeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#d1453b',
    },
    currentTimeRule: {
      flex: 1,
      height: 2,
      backgroundColor: '#d1453b',
    },
  });
