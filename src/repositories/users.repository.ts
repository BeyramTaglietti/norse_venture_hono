import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { type InferInsertModel, eq, ilike } from 'drizzle-orm';

export const findUserByLikeUsername_db = (userId: string, username: string) => {
  return db.query.users.findMany({
    where: ilike(users.username, `%${username}%`),
    columns: {
      id: true,
      email: true,
      created_at: true,
      profile_picture: true,
      username: true,
    },
    limit: 20,
  });
};

export const findUserByEqualUsername_db = (username: string) => {
  return db.query.users.findFirst({
    where: eq(users.username, username),
    columns: {
      id: true,
      email: true,
      created_at: true,
      profile_picture: true,
      username: true,
    },
  });
};

export const findUserByEqualEmail_db = (email: string) => {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
};

export const findUserById_db = (userId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      email: true,
      created_at: true,
      profile_picture: true,
      username: true,
    },
  });
};

export const findUnsafeUserById_db = (userId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
};

export const createUnsafeUser_db = async (
  user: InferInsertModel<typeof users>,
) => {
  const newUser = await db.insert(users).values(user).returning();

  return newUser[0];
};

export const updateUser_db = async (
  userId: string,
  data: Partial<InferInsertModel<typeof users>>,
) => {
  const updatedUser = await db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      created_at: users.created_at,
      profile_picture: users.profile_picture,
      username: users.username,
    });

  return updatedUser[0];
};

export const deleteUser_db = async (userId: string) => {
  const deletedUser = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      created_at: users.created_at,
      profile_picture: users.profile_picture,
      username: users.username,
    });

  return deletedUser[0];
};
