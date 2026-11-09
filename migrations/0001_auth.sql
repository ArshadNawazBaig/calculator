-- Additive, isolated Better Auth 1.7 core models. Existing calculators are untouched.
CREATE TABLE blog_user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'super_admin'))
);
CREATE UNIQUE INDEX blog_user_email_casefold_unique ON blog_user (lower(email));

CREATE TABLE blog_session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES blog_user(id) ON DELETE CASCADE
);
CREATE INDEX blog_session_user_idx ON blog_session ("userId");
CREATE INDEX blog_session_expiry_idx ON blog_session ("expiresAt");

CREATE TABLE blog_account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES blog_user(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("providerId", "accountId")
);
CREATE INDEX blog_account_user_idx ON blog_account ("userId");

CREATE TABLE blog_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_verification_identifier_idx ON blog_verification (identifier);

CREATE TABLE blog_rate_limit (
  id text PRIMARY KEY,
  key text NOT NULL UNIQUE,
  count integer NOT NULL,
  "lastRequest" bigint NOT NULL
);
CREATE INDEX blog_rate_limit_last_request_idx ON blog_rate_limit ("lastRequest");

CREATE TABLE blog_login_throttle (
  account_key text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts > 0),
  window_start timestamptz NOT NULL
);
CREATE INDEX blog_login_throttle_window_idx ON blog_login_throttle (window_start);
