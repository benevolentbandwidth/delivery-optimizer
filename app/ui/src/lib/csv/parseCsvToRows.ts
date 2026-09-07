/**
 * Minimal RFC-4180 CSV parser — handles quoted fields, embedded commas,
 * escaped quotes, and CRLF/LF line endings.
 */
export function parseCsvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (inQuotes) {
      if (character === '"' && nextCharacter === '"') {
        currentField += '"';
        index++;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        currentField += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if (character === "\r" && nextCharacter === "\n") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      index++;
    } else if (character === "\n" || character === "\r") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += character;
    }
  }

  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell !== ""));
}
