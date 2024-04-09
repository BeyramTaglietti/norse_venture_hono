/* eslint-disable @typescript-eslint/no-explicit-any */

// This code is based on pull request:
// https://github.com/stefanprokopdev/verify-apple-id-token/pull/172
//
// REASON: Library does not use edge runtimes compatible libraries

import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import type { JwtPayload } from 'jsonwebtoken';

export interface VerifyAppleIdTokenParams {
  idToken: string;
  clientId: string | string[];
  nonce?: string;
}

export interface VerifyAppleIdTokenResponse extends JwtPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  nonce?: string;
  nonce_supported: boolean;
  email: string;
  email_verified: boolean;
  is_private_email?: boolean;
  real_user_status?: number;
  transfer_sub?: string;
  c_hash: string;
}

export const APPLE_BASE_URL = 'https://appleid.apple.com';
export const JWKS_APPLE_URI = '/auth/keys';

export const getApplePublicKey = async (kid: string, alg: string) => {
  const JWKS = createRemoteJWKSet(
    new URL(`${APPLE_BASE_URL}${JWKS_APPLE_URI}`),
  );
  const key = await JWKS({
    alg,
    kid,
  });
  return key;
};

export const verifyAppleToken = async (
  params: VerifyAppleIdTokenParams,
): Promise<VerifyAppleIdTokenResponse> => {
  const { alg, kid } = decodeProtectedHeader(params.idToken);

  if (alg !== 'RS256') {
    throw new Error(`The alg parameter does not match`);
  }
  if (!kid) throw new Error('kid not found in token');

  const applePublicKey = await getApplePublicKey(kid, alg);

  const { payload: jwtClaims } = await jwtVerify(
    params.idToken,
    applePublicKey,
  );

  if ((jwtClaims?.nonce ?? undefined) !== params.nonce) {
    throw new Error(`The nonce parameter does not match`);
  }

  if (jwtClaims?.iss !== APPLE_BASE_URL) {
    throw new Error(
      `The iss does not match the Apple URL - iss: ${jwtClaims.iss} | expected: ${APPLE_BASE_URL}`,
    );
  }

  const isFounded: any = []
    .concat(jwtClaims.aud as any)
    .some((aud) => [].concat(params.clientId as any).includes(aud));

  if (isFounded) {
    ['email_verified', 'is_private_email'].forEach((field) => {
      if (jwtClaims[field] !== undefined) {
        jwtClaims[field] = Boolean(jwtClaims[field]);
      }
    });

    return jwtClaims as VerifyAppleIdTokenResponse;
  }

  throw new Error(
    `The aud parameter does not include this client - is: ${jwtClaims.aud} | expected: ${params.clientId}`,
  );
};
