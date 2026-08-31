const PRODUCTION = "production";

export function validateEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const environment = { ...input };
  const errors: string[] = [];
  const nodeEnv = readString(environment.NODE_ENV) || "development";
  const isProduction = nodeEnv === PRODUCTION;

  validateInteger(environment, "PORT", 4000, 1, 65_535, errors);
  validateInteger(environment, "SESSION_TTL_DAYS", 7, 1, 365, errors);
  validateInteger(
    environment,
    "BCRYPT_ROUNDS",
    12,
    isProduction ? 10 : 1,
    15,
    errors,
  );
  validateInteger(environment, "SMTP_PORT", 587, 1, 65_535, errors);
  validateInteger(
    environment,
    "SMTP_CONNECTION_TIMEOUT_MS",
    10_000,
    1_000,
    60_000,
    errors,
  );
  validateInteger(
    environment,
    "HTTP_REQUEST_TIMEOUT_MS",
    30_000,
    1_000,
    120_000,
    errors,
  );
  validateInteger(
    environment,
    "HTTP_HEADERS_TIMEOUT_MS",
    35_000,
    1_000,
    120_000,
    errors,
  );
  validateInteger(
    environment,
    "HTTP_KEEP_ALIVE_TIMEOUT_MS",
    5_000,
    1_000,
    120_000,
    errors,
  );
  validateInteger(
    environment,
    "AUTH_TOKEN_RETENTION_DAYS",
    7,
    1,
    3_650,
    errors,
  );
  validateInteger(
    environment,
    "SESSION_RETENTION_DAYS",
    30,
    1,
    3_650,
    errors,
  );
  validateInteger(
    environment,
    "AUDIT_LOG_RETENTION_DAYS",
    365,
    1,
    3_650,
    errors,
  );
  validateInteger(
    environment,
    "GOCARDLESS_REQUEST_TIMEOUT_MS",
    10_000,
    1_000,
    60_000,
    errors,
  );
  validateInteger(
    environment,
    "GOCARDLESS_MAX_RETRIES",
    2,
    0,
    4,
    errors,
  );
  validateInteger(
    environment,
    "BANK_SYNC_INTERVAL_MINUTES",
    360,
    60,
    10_080,
    errors,
  );
  validateInteger(environment, "BANK_SYNC_BATCH_SIZE", 10, 1, 100, errors);
  validateInteger(environment, "BANK_SYNC_LOCK_MINUTES", 10, 1, 60, errors);

  for (const key of [
    "COOKIE_SECURE",
    "SMTP_SECURE",
    "BANK_CONNECTIONS_ENABLED",
    "BANK_SYNC_ENABLED",
  ]) {
    validateBoolean(environment, key, errors);
  }

  validateUrlList(environment, "FRONTEND_ORIGIN", errors, isProduction);
  validateUrl(environment, "APP_PUBLIC_URL", errors, isProduction);
  validateUrl(environment, "PUBLIC_API_URL", errors, isProduction);

  const databaseUrl = readString(environment.DATABASE_URL);
  if (databaseUrl && !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    errors.push("DATABASE_URL must be a PostgreSQL connection URL");
  }

  const googleClientId = readString(environment.GOOGLE_CLIENT_ID);
  if (
    googleClientId &&
    !googleClientId.endsWith(".apps.googleusercontent.com")
  ) {
    errors.push("GOOGLE_CLIENT_ID must be a Google web OAuth client ID");
  }

  const bodyLimit = readString(environment.REQUEST_BODY_LIMIT);
  if (bodyLimit && !/^\d+(?:b|kb|mb)$/i.test(bodyLimit)) {
    errors.push("REQUEST_BODY_LIMIT must use a value such as 100kb or 1mb");
  }

  const smtpUser = readString(environment.SMTP_USER);
  const smtpPassword = readString(environment.SMTP_PASSWORD);
  if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
    errors.push("SMTP_USER and SMTP_PASSWORD must be configured together");
  }

  const bankConnectionsEnabled = readBoolean(
    environment.BANK_CONNECTIONS_ENABLED,
    false,
  );
  const bankSyncEnabled = readBoolean(environment.BANK_SYNC_ENABLED, false);
  if (bankSyncEnabled && !bankConnectionsEnabled) {
    errors.push(
      "BANK_SYNC_ENABLED requires BANK_CONNECTIONS_ENABLED to be true",
    );
  }
  if (bankConnectionsEnabled) {
    requireKeys(
      environment,
      ["GOCARDLESS_SECRET_ID", "GOCARDLESS_SECRET_KEY"],
      errors,
    );
  }

  if (isProduction) {
    requireKeys(
      environment,
      [
        "DATABASE_URL",
        "FRONTEND_ORIGIN",
        "APP_PUBLIC_URL",
        "PUBLIC_API_URL",
        "CSRF_SECRET",
        "SMTP_HOST",
        "EMAIL_FROM",
        "BANK_CONNECTIONS_ENABLED",
      ],
      errors,
    );
    if (readString(environment.COOKIE_SECURE) !== "true") {
      errors.push("COOKIE_SECURE must be true in production");
    }
    const csrfSecret = readString(environment.CSRF_SECRET);
    if (
      csrfSecret.length < 32 ||
      csrfSecret.toLowerCase().includes("replace-with")
    ) {
      errors.push(
        "CSRF_SECRET must be a unique production secret with at least 32 characters",
      );
    }
    const trustProxy = readString(environment.TRUST_PROXY).toLowerCase();
    if (!trustProxy || trustProxy === "false") {
      errors.push(
        "TRUST_PROXY must explicitly trust the production reverse proxy",
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join("\n- ")}`,
    );
  }

  environment.NODE_ENV = nodeEnv;
  return environment;
}

function validateInteger(
  environment: Record<string, unknown>,
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
  errors: string[],
): void {
  const raw = readString(environment[key]);
  if (!raw) {
    environment[key] = String(fallback);
    return;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    errors.push(`${key} must be an integer from ${minimum} to ${maximum}`);
  }
}

function validateBoolean(
  environment: Record<string, unknown>,
  key: string,
  errors: string[],
): void {
  const value = readString(environment[key]);
  if (value && value !== "true" && value !== "false") {
    errors.push(`${key} must be true or false`);
  }
}

function validateUrl(
  environment: Record<string, unknown>,
  key: string,
  errors: string[],
  requireHttps: boolean,
): void {
  const value = readString(environment[key]);
  if (!value) return;
  try {
    const url = new URL(value);
    if (requireHttps && url.protocol !== "https:") {
      errors.push(`${key} must use HTTPS in production`);
    }
  } catch {
    errors.push(`${key} must be a valid absolute URL`);
  }
}

function validateUrlList(
  environment: Record<string, unknown>,
  key: string,
  errors: string[],
  requireHttps: boolean,
): void {
  const values = readString(environment[key])
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  for (const value of values) {
    validateUrl({ [key]: value }, key, errors, requireHttps);
  }
}

function requireKeys(
  environment: Record<string, unknown>,
  keys: string[],
  errors: string[],
): void {
  for (const key of keys) {
    if (!readString(environment[key])) {
      errors.push(`${key} is required`);
    }
  }
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  const normalized = readString(value);
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
