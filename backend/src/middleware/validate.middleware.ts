import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

// The schema shape is always { body?, query?, params? }, so the first path
// segment is just that wrapper key — drop it so callers see the actual
// field name (e.g. "email"), not the generic wrapper ("body").
function formatZodIssues(err: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.slice(1).join(".") || issue.path.join(".") || "_";
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ApiError(400, "VALIDATION_ERROR", "Validation failed", formatZodIssues(err)));
        return;
      }
      next(err);
    }
  };
}
