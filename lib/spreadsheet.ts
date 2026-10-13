// Spreadsheet apps (Excel, Google Sheets, LibreOffice) run a CSV cell as a formula when it starts with
// one of these characters (optionally after spaces). Prefixing a single quote makes it plain text (OWASP).
const FORMULA_PREFIX = /^(?:\s*[=+\-@]|[\t\r])/;

export function safeSpreadsheetCell<T>(value: T): T | string {
  return typeof value === "string" && FORMULA_PREFIX.test(value) ? `'${value}` : value;
}
