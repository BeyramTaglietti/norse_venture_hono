import { Context } from 'hono';

export enum HttpErrors {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

export class CustomError extends Error {
  public readonly status: HttpErrors;
  public readonly message: string;

  constructor(message: string, status: HttpErrors) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = status;
    this.message = message;
  }
}

export const throwCustomError = (
  error: CustomError | Error | unknown,
  c: Context,
) => {
  if (error instanceof CustomError) {
    return c.json({ message: error.message }, error.status);
  } else if (error instanceof Error) {
    return c.json({ message: error.message }, 500);
  }
};
