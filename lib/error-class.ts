import { CredentialsSignin } from "next-auth";
import { AuthError } from "next-auth";

export class CustomError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
    this.message = code;
    this.stack = undefined;
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.data = data;
    this.details = details;
    this.stack = undefined;
  }
}

export class UserNotFoundError extends CustomError {
  constructor(message = "User not found") {
    super(message);
    this.name = "UserNotFoundError";

    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class InvalidCredentialsError extends CustomError {
  constructor(message = "Invalid credentials provided") {
    super(message);
    this.name = "InvalidCredentialsError";

    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class InActiveAccountError extends CustomError {
  constructor(message = "Account is not active") {
    super(message);
    this.name = "InActiveAccountError";

    Object.setPrototypeOf(this, InActiveAccountError.prototype);
  }
}
export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";

    Object.setPrototypeOf(this, InActiveAccountError.prototype);
  }
}
