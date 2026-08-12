import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import fsPromises from "fs/promises";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import csurf from "csurf";
import { z } from "zod";
import { Redis } from "@upstash/redis";

// Only initialize Redis if credentials are provided
export let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function jsonToFrontmatter(data: Record<string, unknown>): string {
  let md = "---\n";
  md += `title: ${JSON.stringify(data.title)}\n`;
  md += `date: ${JSON.stringify(data.date)}\n`;
  md += `promotion: ${JSON.stringify(data.promotion)}\n`;
  md += `significance: ${JSON.stringify(data.significance)}\n`;
  md += `registry_section: ${JSON.stringify(data.registry_section)}\n`;
  if (data.image_url) md += `image_url: ${JSON.stringify(data.image_url)}\n`;
  md += "---\n\n";
  return md;
}

const safeUrlSchema = z.string().refine(
  (val) => {
    if (val.startsWith("/") || val.startsWith("#")) return true;
    try {
      const url = new URL(val);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Must be a safe URL (http/https) or relative path" },
);

const archiveSchema = z.object({
  title: z.string(),
  date: z.string(),
  promotion: z.string(),
  significance: z.enum([
    "Cultural Significance",
    "Historical Significance",
    "Aesthetic Significance",
    "Conceptual Failure",
    "Technical Failure",
    "Contextual Failure",
    "So Bad It's Good",
    "Cautionary Archive",
    "Homage & Influence",
  ]),
  registry_section: z.enum([
    "Registry of Excellence",
    "Registry of Infamy - Division A",
    "Registry of Infamy - Division B",
    "Registry of Homage & Influence",
  ]),
  image_url: safeUrlSchema.optional(),
  external_links: z
    .array(
      z.object({
        name: z.string(),
        url: safeUrlSchema,
      }),
    )
    .optional(),
});

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self';",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});
app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const MAINTENANCE_MODE = false;
app.use((req, res, next) => {
  if (MAINTENANCE_MODE && !req.path.startsWith("/api/admin")) {
    res.status(503).json({ error: "System under maintenance" });
    return;
  }
  next();
});

const adminAuthHash = crypto
  .createHash("sha256")
  .update(process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString("hex"))
  .digest();
const activeSessions = new Map<string, number>();
const SESSION_EXPIRATION_MS = 60 * 60 * 1000;

const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const sessionExpiration = activeSessions.get(token);
  if (sessionExpiration) {
    if (Date.now() < sessionExpiration) {
      next();
      return;
    } else {
      activeSessions.delete(token);
    }
  }

  res.status(401).json({ error: "Unauthorized" });
};

const loginAttempts = new Map<
  string,
  { count: number; lockUntil: number; lastAttempt: number }
>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const adminRateLimitChecker = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  if (loginAttempts.size > 1000) {
    const keysToDelete = [];
    for (const [key, value] of loginAttempts.entries()) {
      if (value.lockUntil > 0 && value.lockUntil <= now) {
        keysToDelete.push(key);
      } else if (
        value.lockUntil === 0 &&
        now - value.lastAttempt > LOCK_TIME_MS
      ) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length === 0 && loginAttempts.size > 1000) {
      let oldestKey = null;
      let oldestTime = now;
      for (const [key, value] of loginAttempts.entries()) {
        if (value.lockUntil === 0 && value.lastAttempt < oldestTime) {
          oldestTime = value.lastAttempt;
          oldestKey = key;
        }
      }
      if (oldestKey) keysToDelete.push(oldestKey);
    }

    for (const key of keysToDelete) {
      loginAttempts.delete(key);
    }

    if (loginAttempts.size > 1000 && !loginAttempts.has(ip)) {
      res
        .status(503)
        .json({
          success: false,
          error: "Service temporarily unavailable due to high load",
        });
      return;
    }
  }

  const record = loginAttempts.get(ip) || {
    count: 0,
    lockUntil: 0,
    lastAttempt: now,
  };

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    record.count = 0;
    record.lockUntil = 0;
  }

  if (record.lockUntil > now) {
    res
      .status(429)
      .json({
        success: false,
        error: "Too many attempts, please try again later",
      });
    return;
  }

  next();
};

const adminRateLimitTracker = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let record = loginAttempts.get(ip);
  if (!record) {
    record = { count: 0, lockUntil: 0, lastAttempt: now };
    loginAttempts.set(ip, record);
  } else {
    record.lastAttempt = now;
  }

  res.on("finish", () => {
    if (record && res.statusCode === 401) {
      record.count += 1;
      if (record.count >= MAX_LOGIN_ATTEMPTS) {
        record.lockUntil = Date.now() + LOCK_TIME_MS;
        record.count = 0;
      }
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      loginAttempts.delete(ip);
    }
  });

  next();
};

app.use("/api/admin", adminRateLimitChecker);

app.post(
  "/api/admin/verify",
  adminRateLimitTracker,
  (req: Request, res: Response) => {
    let isSuccess = false;
    const { password } = req.body;
    if (typeof password === "string") {
      const passwordHash = crypto
        .createHash("sha256")
        .update(password)
        .digest();
      if (crypto.timingSafeEqual(passwordHash, adminAuthHash)) {
        isSuccess = true;
      }
    }

    if (isSuccess) {
      const sessionToken = crypto.randomBytes(32).toString("hex");

      if (activeSessions.size > 100) {
        const now = Date.now();
        for (const [key, exp] of activeSessions.entries()) {
          if (now >= exp) activeSessions.delete(key);
        }
      }

      activeSessions.set(sessionToken, Date.now() + SESSION_EXPIRATION_MS);
      res.json({ success: true, token: sessionToken });
    } else {
      res.status(401).json({ success: false, error: "Invalid password" });
    }
  },
);

const SUBMISSION_RATE_LIMIT = new Map<
  string,
  { count: number; lockUntil: number }
>();
const MAX_SUBMISSIONS = 10;
const SUBMISSION_LOCK_TIME_MS = 60 * 60 * 1000;

const submissionRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let record = SUBMISSION_RATE_LIMIT.get(ip);
  if (!record) {
    record = { count: 0, lockUntil: 0 };
    SUBMISSION_RATE_LIMIT.set(ip, record);
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    record.count = 0;
    record.lockUntil = 0;
  }

  if (record.lockUntil > now) {
    res
      .status(429)
      .json({ error: "Rate limit exceeded. Maximum 10 submissions per hour." });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_SUBMISSIONS) {
    record.lockUntil = now + SUBMISSION_LOCK_TIME_MS;
  }

  next();
};

app.post(
  "/api/articles/submit",
  verifyAdminToken,
  submissionRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const validatedData = archiveSchema.parse(req.body);
      const slug = generateSlug(validatedData.title);

      const filePath = path.join(__dirname, "content", "archive", `${slug}.md`);

      try {
        await fsPromises.access(filePath);
        res
          .status(409)
          .json({ error: "Article with this title already exists" });
        return;
      } catch {
        // File does not exist, safe to proceed
      }

      const frontmatter = jsonToFrontmatter(validatedData);
      await fsPromises.writeFile(filePath, frontmatter, "utf8");

      console.log(
        `[Submission Audit] Timestamp: ${new Date().toISOString()} | IP: ${req.ip || req.socket.remoteAddress} | Slug: ${slug} | User-Agent: ${req.get("user-agent")}`,
      );

      res.status(201).json({ slug, previewUrl: `/archive/${slug}` });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "ZodError") {
        res
          .status(400)
          .json({
            error: "Validation failed",
            details: (error as { errors?: unknown[] }).errors,
          });
      } else {
        console.error("Submission error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  },
);


app.delete(
  "/api/articles/:slug",
  verifyAdminToken,
  async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      if (!slug || typeof slug !== "string") {
         res.status(400).json({ error: "Invalid slug" });
         return;
      }

      // Prevent Path Traversal by extracting just the base filename
      const safeSlug = path.basename(slug);
      const filePath = path.join(__dirname, "content", "archive", `${safeSlug}.md`);

      try {
        await fsPromises.access(filePath);
      } catch {
        res.status(404).json({ error: "Article not found" });
        return;
      }

      await fsPromises.unlink(filePath);

      console.log(
        `[Deletion Audit] Timestamp: ${new Date().toISOString()} | IP: ${req.ip || req.socket.remoteAddress} | Slug: ${slug} | User-Agent: ${req.get("user-agent")}`,
      );

      res.status(200).json({ success: true, message: "Article deleted successfully" });
    } catch (error) {
      console.error("Deletion error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.use((_req: Request, res: Response) => {
  res.status(404).type("text/plain").send("404 Not Found");
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (err instanceof Error && "status" in err) {
    const httpErr = err as Error & { status: number };
    const errorMsg =
      process.env.NODE_ENV === "production" && httpErr.status >= 500
        ? "An unexpected error occurred"
        : httpErr.message || "Error";
    res.status(httpErr.status).json({ error: errorMsg });
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
