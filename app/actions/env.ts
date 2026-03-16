"use server";

export async function getDbEnvVar() {
  return process.env.DATABASE_URL || "";
}
