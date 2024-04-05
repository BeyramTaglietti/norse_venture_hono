import { CustomError, HttpErrors } from '@/config/errors';
import { db } from '@/drizzle/db';
import { users } from '@/drizzle/schema';
import { LoginResponse } from '@/models';
import { InferSelectModel, eq } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { sign, verify } from 'hono/jwt';
import verifyAppleToken from 'verify-apple-id-token';

export const googleLogin = async (token: string): Promise<LoginResponse> => {
  const payload = await verifyGoogleToken(token);

  const { email, picture } = payload;

  return await login({ userEmail: email!, userPicture: picture });
};

export const appleLogin = async (token: string): Promise<LoginResponse> => {
  const payload = await verifyAppleToken({
    idToken: token,
    clientId: Bun.env.APPLE_CLIENT_ID!,
  });

  return await login({
    userEmail: payload.email!,
    userPicture: '',
  });
};

export const refreshToken = async (currentRefreshToken: string) => {
  try {
    const payload = await verify(
      currentRefreshToken,
      Bun.env.JWT_REFRESH_SECRET!,
    );

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user || !user.refresh_token)
      throw new CustomError('Invalid operation', HttpErrors.UNAUTHORIZED);

    const tokenIsValid = await Bun.password.verify(
      currentRefreshToken,
      user.refresh_token,
    );

    if (!tokenIsValid)
      throw new CustomError('Invalid token', HttpErrors.UNAUTHORIZED);

    const access_token = await generateJwtToken(user.id, 'access');
    const refresh_token = await generateJwtToken(user.id, 'refresh');

    const updatedUser = await updateRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: updatedUser[0],
    };
  } catch (e) {
    throw new CustomError('Invalid token', HttpErrors.UNAUTHORIZED);
  }
};

const login = async ({
  userEmail,
  userPicture,
}: {
  userEmail: string;
  userPicture?: string;
}): Promise<LoginResponse> => {
  const userExists = await db.query.users.findFirst({
    where: eq(users.email, userEmail),
  });

  if (!userExists) {
    const user = await register(userEmail, userPicture);

    const access_token = await generateJwtToken(String(user.id), 'access');
    const refresh_token = await generateJwtToken(String(user.id), 'refresh');

    await updateRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user,
    };
  } else {
    const access_token = await generateJwtToken(
      String(userExists.id),
      'access',
    );
    const refresh_token = await generateJwtToken(
      String(userExists.id),
      'refresh',
    );

    await updateRefreshToken(userExists.id, refresh_token);

    return {
      access_token,
      refresh_token,
      user: userExists,
    };
  }
};

const register = async (
  email: string,
  picture?: string,
): Promise<InferSelectModel<typeof users>> => {
  const username = await getRandomUsername();

  const newUser = await db
    .insert(users)
    .values({
      email,
      username,
      profile_picture: picture || '',
      refresh_token: '',
    })
    .returning();

  return newUser[0];
};

const verifyGoogleToken = async (token: string) => {
  const client = new OAuth2Client({
    clientId: Bun.env.WEB_CLIENT_ID,
  });

  const audiences = [
    Bun.env.IOS_CLIENT_ID!,
    Bun.env.ANDROID_CLIENT_ID!,
    Bun.env.WEB_CLIENT_ID!,
  ];

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: audiences,
  });

  const payload = ticket.getPayload();

  if (!payload)
    throw new CustomError('Invalid token', HttpErrors.INTERNAL_ERROR);

  return payload;
};

const updateRefreshToken = async (userId: string, refreshToken: string) => {
  const hashedToken = await Bun.password.hash(refreshToken);

  const updatedUser = await db
    .update(users)
    .set({
      refresh_token: hashedToken,
    })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
};

const getRandomUsername = async () => {
  const username: string = 'User' + Math.floor(Math.random() * 10000000);

  const userExists = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (userExists) getRandomUsername();

  return username;
};

const generateJwtToken = async (userId: string, type: 'access' | 'refresh') => {
  const minute = Math.floor(Date.now() / 1000) + 60;

  return await sign(
    {
      sub: userId,
      exp: type === 'access' ? minute * 15 : minute * 60 * 24 * 120,
    },
    type === 'access' ? Bun.env.JWT_SECRET! : Bun.env.JWT_REFRESH_SECRET!,
  );
};
