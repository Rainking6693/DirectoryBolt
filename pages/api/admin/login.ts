import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import {
  ADMIN_FALLBACK_API_KEY,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
} from "../../../lib/auth/constants";
import type { AdminLoginResponse } from "../../../types/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminLoginResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { apiKey } = req.body as { apiKey?: string };
    const validKey = process.env.ADMIN_API_KEY || ADMIN_FALLBACK_API_KEY;

    if (!apiKey || apiKey.trim() !== validKey) {
      return res.status(401).json({
        success: false,
        error: "Invalid admin API key",
      });
    }

    const cookie = serialize(ADMIN_SESSION_COOKIE, ADMIN_SESSION_VALUE, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      redirectTo: "/admin",
    });
  } catch (error) {
    console.error("[admin.login] unexpected error", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}
