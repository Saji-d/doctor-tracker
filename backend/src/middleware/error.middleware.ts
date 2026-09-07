import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
}

// A MongoDB duplicate-key error (E11000) can still reach here even though
// services check-then-create, because that check is not atomic — a
// concurrent request can slip through between the check and the insert.
// The unique index is the real guarantee; this just maps its failure to the
// same 409 shape a caught duplicate already returns, instead of a raw 500.
function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === 11000;
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

  if (isDuplicateKeyError(err)) {
    res.status(409).json({ error: { message: "A record with this value already exists", code: "CONFLICT" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong", code: "INTERNAL_ERROR" } });
}
