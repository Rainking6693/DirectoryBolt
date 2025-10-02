import { NextApiRequest, NextApiResponse } from "next";
import {
  ADMIN_FALLBACK_API_KEY,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_VALUE,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
} from "../../../lib/auth/constants";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const adminSession = req.cookies[ADMIN_SESSION_COOKIE];
    const staffSession = req.cookies[STAFF_SESSION_COOKIE];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const validKey = process.env.ADMIN_API_KEY || ADMIN_FALLBACK_API_KEY;

    const hasSession = adminSession === ADMIN_SESSION_VALUE || staffSession === STAFF_SESSION_VALUE;
    const hasKey = bearerToken === validKey;

    if (!hasSession && !hasKey) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin authentication required",
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: "admin-user",
        username: "admin",
        email: "ben.stone@directorybolt.com",
        first_name: "BEN",
        last_name: "STONE",
        role: "super_admin",
        permissions: {
          system: true,
          users: true,
          analytics: true,
          billing: true,
          support: true,
        },
      },
    });
  } catch (error) {
    console.error("[admin.auth-check] unexpected error", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication service temporarily unavailable",
    });
  }
}
