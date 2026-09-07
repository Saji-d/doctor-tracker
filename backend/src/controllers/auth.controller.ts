import { Request, Response, NextFunction, CookieOptions } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { COOKIE_NAME, TOKEN_TTL, COOKIE_MAX_AGE_MS } from "../config/constants";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";

function cookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const token = jwt.sign({ sub: user._id.toString() }, env.JWT_SECRET, { expiresIn: TOKEN_TTL });

    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.status(200).json({ user: { email: user.email } });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
    }
    res.status(200).json({ user: { email: user.email } });
  } catch (err) {
    next(err);
  }
}
