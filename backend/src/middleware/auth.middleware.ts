import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { COOKIE_NAME } from "../config/constants";
import { ApiError } from "../utils/ApiError";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Unauthorized"));
  }
}
