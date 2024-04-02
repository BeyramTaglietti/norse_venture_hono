import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text('logs'),
  rolledBackAt: timestamp('rolled_back_at', {
    withTimezone: true,
    mode: 'string',
  }),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' })
    .defaultNow()
    .notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
});

export const task = pgTable('Task', {
  id: serial('id').primaryKey().notNull(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  title: text('title').notNull(),
  value: boolean('value').default(false).notNull(),
  description: text('description'),
  date: timestamp('date', { precision: 3, mode: 'string' }),
  tripId: integer('tripId')
    .notNull()
    .references(() => trip.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  price: integer('price'),
});

export const trip = pgTable('Trip', {
  id: serial('id').primaryKey().notNull(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'string' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).notNull(),
  title: text('title').notNull(),
  background: text('background'),
  date: timestamp('date', { precision: 3, mode: 'string' }).notNull(),
  ownerId: integer('ownerId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  backgroundProvider: text('backgroundProvider'),
});

export const friendRequest = pgTable(
  'FriendRequest',
  {
    id: serial('id').primaryKey().notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    senderId: integer('senderId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    receiverId: integer('receiverId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      senderIdReceiverIdKey: uniqueIndex(
        'FriendRequest_senderId_receiverId_key',
      ).on(table.senderId, table.receiverId),
    };
  },
);

export const friends = pgTable(
  '_friends',
  {
    a: integer('A')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    b: integer('B')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      abUnique: uniqueIndex('_friends_AB_unique').on(table.a, table.b),
      bIdx: index().on(table.b),
    };
  },
);

export const user = pgTable(
  'User',
  {
    id: serial('id').primaryKey().notNull(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updatedAt', {
      precision: 3,
      mode: 'string',
    }).notNull(),
    email: text('email').notNull(),
    username: text('username').notNull(),
    refreshToken: text('refreshToken'),
    profilePicture: text('profilePicture'),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('User_email_key').on(table.email),
      usernameKey: uniqueIndex('User_username_key').on(table.username),
    };
  },
);

export const userInTrip = pgTable(
  'UserInTrip',
  {
    tripId: integer('tripId')
      .notNull()
      .references(() => trip.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: integer('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => {
    return {
      userInTripPkey: primaryKey({
        columns: [table.tripId, table.userId],
        name: 'UserInTrip_pkey',
      }),
    };
  },
);
