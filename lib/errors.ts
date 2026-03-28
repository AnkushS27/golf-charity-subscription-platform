export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "APP_ERROR", status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code, status: error.status };
  }

  return {
    message: "Unexpected server error",
    code: "INTERNAL_ERROR",
    status: 500,
  };
}
