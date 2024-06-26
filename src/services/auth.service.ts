import { HttpError, HttpStatus } from '@/config/errors';
import { verifyAppleToken } from '@/helpers';
import { LoginResponse } from '@/models';
import {
  createUnsafeUser_db,
  findUnsafeUserById_db,
  findUserByEqualEmail_db,
  findUserByEqualUsername_db,
  updateUser_db,
} from '@/repositories';
import { OAuth2Client } from 'google-auth-library';
import { sign, verify } from 'hono/jwt';

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

export const refreshToken = async (
  currentRefreshToken: string,
): Promise<LoginResponse> => {
  const payload = await verify(
    currentRefreshToken,
    Bun.env.JWT_REFRESH_SECRET!,
  );

  const user = await findUnsafeUserById_db(payload.sub);

  if (!user || !user.refresh_token)
    throw new HttpError(HttpStatus.UNAUTHORIZED, {
      message: 'Invalid operation',
    });

  const tokenIsValid = await Bun.password.verify(
    currentRefreshToken,
    user.refresh_token,
  );

  if (!tokenIsValid)
    throw new HttpError(HttpStatus.UNAUTHORIZED, {
      message: 'Invalid token',
    });

  const access_token = await generateJwtToken(user.id, 'access');
  const refresh_token = await generateJwtToken(user.id, 'refresh');

  const updatedUser = await updateRefreshToken(user.id, refresh_token);

  return {
    access_token,
    refresh_token,
    user: updatedUser,
  };
};

const login = async ({
  userEmail,
  userPicture,
}: {
  userEmail: string;
  userPicture?: string;
}): Promise<LoginResponse> => {
  const userExists = await findUserByEqualEmail_db(userEmail);

  if (!userExists) {
    const user = await register(userEmail, userPicture);

    const access_token = await generateJwtToken(String(user.id), 'access');
    const refresh_token = await generateJwtToken(String(user.id), 'refresh');

    await updateRefreshToken(user.id, refresh_token);

    const { id, email, username, profile_picture, created_at } = user;

    return {
      access_token,
      refresh_token,
      user: {
        id,
        email,
        username,
        profile_picture,
        created_at,
      },
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

    const { id, email, username, profile_picture, created_at } = userExists;

    return {
      access_token,
      refresh_token,
      user: {
        id,
        email,
        username,
        profile_picture,
        created_at,
      },
    };
  }
};

const register = async (email: string, picture?: string) => {
  try {
    const username = await getRandomUsername();

    return createUnsafeUser_db({
      email,
      username,
      profile_picture: picture || '',
      refresh_token: '',
    });
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error while creating user',
    });
  }
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
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Invalid token',
    });

  return payload;
};

const updateRefreshToken = async (userId: string, refreshToken: string) => {
  const hashedToken = await Bun.password.hash(refreshToken);

  try {
    const updatedUser = await updateUser_db(userId, {
      refresh_token: hashedToken,
    });

    return updatedUser;
  } catch {
    throw new HttpError(HttpStatus.INTERNAL_SERVER_ERROR, {
      message: 'Error updating refresh token',
    });
  }
};

const getRandomUsername = async () => {
  const username: string = 'User' + Math.floor(Math.random() * 10000000);

  const userExists = await findUserByEqualUsername_db(username);

  if (userExists) getRandomUsername();

  return username;
};

const generateJwtToken = async (userId: string, type: 'access' | 'refresh') => {
  const now = Math.floor(Date.now() / 1000);

  const minute = 60;
  const day = minute * 60 * 24;

  return await sign(
    {
      sub: userId,
      exp: type === 'access' ? now + minute * 15 : now + day * 120,
    },
    type === 'access' ? Bun.env.JWT_SECRET! : Bun.env.JWT_REFRESH_SECRET!,
  );
};
