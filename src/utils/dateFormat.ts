export function formatDateDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function parseDDMMYYYYToISO(dateString: string): string {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected DD-MM-YYYY');
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    throw new Error('Invalid date');
  }
  return date.toISOString();
}

export function isValidDDMMYYYY(dateString: string): boolean {
  try {
    parseDDMMYYYYToISO(dateString);
    return true;
  } catch {
    return false;
  }
}
