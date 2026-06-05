import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    notes: text("notes"),
    estimatedPomodoros: integer("estimated_pomodoros").default(1).notNull(),
    completedPomodoros: integer("completed_pomodoros").default(0).notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    position: doublePrecision("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: false }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("tasks_user_idx").on(t.userId),
    completedIdx: index("tasks_completed_idx").on(t.isCompleted),
    positionIdx: index("tasks_position_idx").on(t.position),
  }),
);

export const pomodoroSessions = pgTable(
  "pomodoro_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
    sessionType: varchar("session_type", { length: 20 }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
    taskIdx: index("sessions_task_idx").on(t.taskId),
    completedIdx: index("sessions_completed_idx").on(t.completedAt),
  }),
);

export const settings = pgTable(
  "settings",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workDuration: integer("work_duration").default(25).notNull(),
    shortBreakDuration: integer("short_break_duration").default(5).notNull(),
    longBreakDuration: integer("long_break_duration").default(15).notNull(),
    cyclesUntilLongBreak: integer("cycles_until_long_break").default(4).notNull(),
    autoStart: boolean("auto_start").default(false).notNull(),
    soundEnabled: boolean("sound_enabled").default(true).notNull(),
    volume: integer("volume").default(80).notNull(),
    theme: varchar("theme", { length: 20 }).default("system").notNull(),
    notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: uniqueIndex("settings_user_idx").on(t.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessions.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
