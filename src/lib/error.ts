// Do things right.

export class AppError extends Error {
  context: any;

  constructor(message?: string, context?: any) {
    super(message);
    this.name = "AppError";
    this.context = context;
  }
}

export function error<T>(message?: string, context?: T): AppError {
  return new AppError(message, context);
}

export function fault<T>(message?: string, context?: T) {
  throw new AppError(message, context);
}
