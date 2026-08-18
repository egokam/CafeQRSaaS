/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

// Next's standalone server is a plain Node process and does not load the
// project .env file itself. Load it before importing the generated server so
// server actions always receive the self-hosted Supabase service-role key.
const path = require("node:path");
const dotenv = require("dotenv");

const appRoot = __dirname;
const envPath = path.join(appRoot, ".env");
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`Unable to load required runtime environment file ${envPath}: ${result.error.message}`);
}

const missing = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
].filter((name) => !process.env[name]);

if (missing.length > 0) {
  throw new Error(`Missing required runtime environment variable(s): ${missing.join(", ")}`);
}

require(path.join(appRoot, ".next", "standalone", "server.js"));
