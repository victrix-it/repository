import { parse } from "csv-parse/sync";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import type { UpsertUser } from "@shared/schema";

interface CsvRow {
  [key: string]: string;
}

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

interface UserWithPassword extends Partial<UpsertUser> {
  password?: string;
}

// Generate a CSV template for user imports
export function generateUserCsvTemplate(): string {
  const headers = [
    "Email",
    "First Name",
    "Last Name",
    "Role",
    "Password"
  ];

  const exampleRows = [
    ["john.doe@company.com", "John", "Doe", "user", "SecurePass123!"],
    ["jane.smith@company.com", "Jane", "Smith", "support", "SecurePass456!"],
    ["admin@company.com", "Admin", "User", "admin", "AdminPass789!"],
  ];

  const csvLines = [
    headers.join(","),
    ...exampleRows.map(row => row.map(cell => {
      // Quote cells that contain commas
      if (cell.includes(",")) {
        return `"${cell}"`;
      }
      return cell;
    }).join(","))
  ];

  return csvLines.join("\n");
}

// Normalize column names for flexible matching
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\s-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Map flexible column names to standard field names
function getFieldValue(row: CsvRow, ...possibleNames: string[]): string | undefined {
  const normalizedRow: { [key: string]: string } = {};
  
  // Normalize all column names in the row
  for (const [key, value] of Object.entries(row)) {
    normalizedRow[normalizeColumnName(key)] = value;
  }

  // Try to find a match
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    if (normalizedRow[normalized] !== undefined) {
      return normalizedRow[normalized];
    }
  }
  
  return undefined;
}

// Validate and normalize a user row
function validateUserRow(row: CsvRow, rowNumber: number): { valid: boolean; error?: string; user?: UserWithPassword } {
  // Get email (required)
  const email = getFieldValue(row, "email", "emailaddress", "mail");
  if (!email || email.trim() === "") {
    return { valid: false, error: "Email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: `Invalid email format: ${email}` };
  }

  // Get first name (optional)
  const firstName = getFieldValue(row, "firstname", "first_name", "fname", "givenname");

  // Get last name (optional)
  const lastName = getFieldValue(row, "lastname", "last_name", "lname", "surname");

  // Get role (optional, defaults to 'user')
  let role = getFieldValue(row, "role", "userrole", "accesslevel")?.toLowerCase() || "user";
  
  // Validate role
  const validRoles = ["user", "support", "admin"];
  if (!validRoles.includes(role)) {
    return { valid: false, error: `Invalid role: ${role}. Must be one of: user, support, admin` };
  }

  // Get password (required for local auth)
  const password = getFieldValue(row, "password", "pass", "pwd");
  if (!password || password.trim() === "") {
    return { valid: false, error: "Password is required" };
  }

  // Validate password strength
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  const user: UserWithPassword = {
    email: email.trim(),
    firstName: firstName?.trim() || "",
    lastName: lastName?.trim() || "",
    role: role as "user" | "support" | "admin",
    authProvider: "local",
    password: password, // Will be hashed before storage
  };

  return { valid: true, user };
}

// Import users from CSV content
export async function importUsersFromCsv(csvContent: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    errors: [],
  };

  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
    }) as CsvRow[];

    if (records.length === 0) {
      throw new Error("CSV file is empty or has no data rows");
    }

    // Track existing emails to prevent duplicates in the same import
    const emailsInImport = new Set<string>();
    const existingUsers = await storage.getAllUsers();
    const existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase()));

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is headers and arrays are 0-indexed
      const row = records[i];

      try {
        // Validate the row
        const validation = validateUserRow(row, rowNumber);
        
        if (!validation.valid) {
          result.errors.push({
            row: rowNumber,
            error: validation.error || "Validation failed",
            data: row,
          });
          continue;
        }

        const user = validation.user!;
        const emailLower = user.email!.toLowerCase();

        // Check for duplicate email in existing users
        if (existingEmails.has(emailLower)) {
          result.errors.push({
            row: rowNumber,
            error: `Email already exists: ${user.email}`,
            data: row,
          });
          continue;
        }

        // Check for duplicate email in current import
        if (emailsInImport.has(emailLower)) {
          result.errors.push({
            row: rowNumber,
            error: `Duplicate email in CSV: ${user.email}`,
            data: row,
          });
          continue;
        }

        emailsInImport.add(emailLower);

        // Hash the password
        const passwordHash = await bcrypt.hash(user.password as string, 10);

        // Create the user
        await storage.createUser({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          authProvider: "local",
          passwordHash: passwordHash,
        });

        result.success++;
      } catch (error: any) {
        result.errors.push({
          row: rowNumber,
          error: error.message || "Failed to import user",
          data: row,
        });
      }
    }

    return result;
  } catch (error: any) {
    throw new Error(`CSV parsing error: ${error.message}`);
  }
}
