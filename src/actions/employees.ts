"use server";

import { createClient } from "@supabase/supabase-js";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import {
  assertAdminCafeAccess,
  clearCashierEmployeeSession,
  getApprovedCashierDevice,
  setCashierEmployeeSession,
} from "./auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const scrypt = promisify(scryptCallback);

export type Employee = {
  id: string;
  cafe_id: string;
  name: string;
  username: string;
  is_active: boolean;
  created_at: string;
};

type EmployeeInput = {
  name: string;
  username: string;
  pin: string;
};

type EmployeeUpdateInput = Partial<EmployeeInput> & { is_active?: boolean };

const normalizeName = (value: unknown) => {
  if (typeof value !== "string") throw new Error("Employee name is required");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) {
    throw new Error("Employee name must be between 2 and 100 characters");
  }
  return name;
};

const normalizeUsername = (value: unknown) => {
  if (typeof value !== "string") throw new Error("Username is required");
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new Error("Username must contain 3–50 letters, numbers, dots, dashes, or underscores");
  }
  return username;
};

const validatePin = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4,12}$/.test(value)) {
    throw new Error("PIN must contain 4–12 digits");
  }
  return value;
};

async function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(pin, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPin(pin: string, encoded: string) {
  const [algorithm, salt, expectedHash] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHash) return false;

  const actual = (await scrypt(pin, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected server error";

/** Lists staff only after proving that the signed-in admin owns this cafe. */
export async function getCafeEmployees(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("id, cafe_id, name, username, is_active, created_at")
      .eq("cafe_id", cafeId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, employees: (data || []) as Employee[] };
  } catch (error) {
    return { success: false, employees: [] as Employee[], error: errorMessage(error) };
  }
}

export async function createEmployee(cafeId: string, input: EmployeeInput) {
  try {
    await assertAdminCafeAccess(cafeId);
    const name = normalizeName(input.name);
    const username = normalizeUsername(input.username);
    const pin = await hashPin(validatePin(input.pin));

    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert({ cafe_id: cafeId, name, username, pin, is_active: true })
      .select("id, cafe_id, name, username, is_active, created_at")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error("This username is already used in this cafe");
      throw error;
    }
    return { success: true, employee: data as Employee };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function updateEmployee(
  cafeId: string,
  employeeId: string,
  input: EmployeeUpdateInput
) {
  try {
    await assertAdminCafeAccess(cafeId);
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = normalizeName(input.name);
    if (input.username !== undefined) updates.username = normalizeUsername(input.username);
    if (input.pin !== undefined && input.pin !== "") updates.pin = await hashPin(validatePin(input.pin));
    if (input.is_active !== undefined) {
      if (typeof input.is_active !== "boolean") throw new Error("Invalid active status");
      updates.is_active = input.is_active;
    }
    if (Object.keys(updates).length === 0) throw new Error("No employee changes were supplied");

    const { data, error } = await supabaseAdmin
      .from("employees")
      .update(updates)
      .eq("id", employeeId)
      .eq("cafe_id", cafeId)
      .select("id, cafe_id, name, username, is_active, created_at")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") throw new Error("This username is already used in this cafe");
      throw error;
    }
    if (!data) throw new Error("Employee not found in this cafe");
    return { success: true, employee: data as Employee };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteEmployee(cafeId: string, employeeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);
    const { data, error } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", employeeId)
      .eq("cafe_id", cafeId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Employee not found in this cafe");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

/**
 * Opens a shift only on an approved terminal. PIN hashes never leave the
 * server, and the cookie is tied to both cafe and terminal device ID.
 */
export async function verifyCashierPin(cafeId: string, username: string, pin: string) {
  try {
    const { deviceId, posDeviceId } = await getApprovedCashierDevice(cafeId);
    const normalizedUsername = normalizeUsername(username);
    const suppliedPin = validatePin(pin);
    const { data: employee, error } = await supabaseAdmin
      .from("employees")
      .select("id, cafe_id, name, username, pin, is_active")
      .eq("cafe_id", cafeId)
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (error) throw error;
    if (!employee || !employee.is_active || !(await verifyPin(suppliedPin, employee.pin))) {
      return { success: false, error: "Invalid username or PIN" };
    }

    await setCashierEmployeeSession(cafeId, deviceId, employee.id);
    return {
      success: true,
      employee: {
        id: employee.id,
        cafe_id: employee.cafe_id,
        name: employee.name,
        username: employee.username,
      },
      posDeviceId,
    };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

/** Locks the shift only; the approved terminal stays registered for reuse. */
export async function logoutCashierShift(cafeId: string) {
  await clearCashierEmployeeSession(cafeId);
  return { success: true };
}
