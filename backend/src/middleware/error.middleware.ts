import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong", code: "INTERNAL_ERROR" } });
}
