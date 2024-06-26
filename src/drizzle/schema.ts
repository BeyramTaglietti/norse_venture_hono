import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    email: varchar('email', {
      length: 100,
    }).notNull(),
    username: varchar('username', {
      length: 255,
    }).notNull(),
    refresh_token: varchar('refresh_token', {
      length: 255,
    }).notNull(),
    profile_picture: varchar('profile_picture', {
      length: 255,
    }).notNull(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('User_email_key').on(table.email),
      usernameKey: uniqueIndex('User_username_key').on(table.username),
    };
  },
);

export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
  partecipating_trips: many(trip_partecipants),
  friend_requests: many(friend_requests, {
    relationName: 'receiver',
  }),
  friends: many(friends, {
    relationName: 'user',
  }),
}));

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  title: varchar('title', {
    length: 255,
  }).notNull(),
  background: text('background'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  owner_id: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  background_provider: varchar('background_provider', {
    length: 255,
  }),
});

export const tripsRelations = relations(trips, ({ many, one }) => ({
  owner: one(users, {
    fields: [trips.owner_id],
    references: [users.id],
  }),
  tasks: many(tasks),
  partecipants: many(trip_partecipants),
}));

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  title: varchar('title', {
    length: 255,
  }).notNull(),
  value: boolean('value').default(false).notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }),
  trip_id: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  price: doublePrecision('price'),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  trip: one(trips, {
    fields: [tasks.trip_id],
    references: [trips.id],
  }),
}));

export const trip_partecipants = pgTable(
  'trip_partecipants',
  {
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    trip_id: uuid('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.trip_id, t.user_id] }),
  }),
);

export const trip_partecipants_relations = relations(
  trip_partecipants,
  ({ one }) => ({
    trip: one(trips, {
      fields: [trip_partecipants.trip_id],
      references: [trips.id],
    }),
    user: one(users, {
      fields: [trip_partecipants.user_id],
      references: [users.id],
    }),
  }),
);

export const friend_requests = pgTable(
  'friend_requests',
  {
    sender_id: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    receiver_id: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sender_id, t.receiver_id] }),
  }),
);

export const friend_requests_relations = relations(
  friend_requests,
  ({ one }) => ({
    receiver: one(users, {
      fields: [friend_requests.receiver_id],
      references: [users.id],
      relationName: 'receiver',
    }),
    sender: one(users, {
      fields: [friend_requests.sender_id],
      references: [users.id],
      relationName: 'sender',
    }),
  }),
);

export const friends = pgTable(
  'friends',
  {
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    friend_id: uuid('friend_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.friend_id] }),
  }),
);

export const friends_relations = relations(friends, ({ one }) => ({
  friend: one(users, {
    fields: [friends.friend_id],
    references: [users.id],
    relationName: 'friend',
  }),
  user: one(users, {
    fields: [friends.user_id],
    references: [users.id],
    relationName: 'user',
  }),
}));
