export interface AgeWakeWindow {
  minMonths: number;
  maxMonths: number;
  minWakeWindowMin: number;
  maxWakeWindowMin: number;
  typicalWakeWindowMin: number;
  typicalNapLengthMin: number;
}

export const AGE_WAKE_WINDOWS: AgeWakeWindow[] = [
  {
    minMonths: 0,
    maxMonths: 3,
    minWakeWindowMin: 30,
    maxWakeWindowMin: 90,
    typicalWakeWindowMin: 60,
    typicalNapLengthMin: 120,
  },
  {
    minMonths: 4,
    maxMonths: 6,
    minWakeWindowMin: 90,
    maxWakeWindowMin: 150,
    typicalWakeWindowMin: 120,
    typicalNapLengthMin: 90,
  },
  {
    minMonths: 7,
    maxMonths: 9,
    minWakeWindowMin: 120,
    maxWakeWindowMin: 180,
    typicalWakeWindowMin: 150,
    typicalNapLengthMin: 60,
  },
  {
    minMonths: 10,
    maxMonths: 12,
    minWakeWindowMin: 150,
    maxWakeWindowMin: 240,
    typicalWakeWindowMin: 180,
    typicalNapLengthMin: 60,
  },
  {
    minMonths: 13,
    maxMonths: 18,
    minWakeWindowMin: 180,
    maxWakeWindowMin: 300,
    typicalWakeWindowMin: 240,
    typicalNapLengthMin: 60,
  },
  {
    minMonths: 19,
    maxMonths: 999,
    minWakeWindowMin: 240,
    maxWakeWindowMin: 360,
    typicalWakeWindowMin: 300,
    typicalNapLengthMin: 60,
  },
];

export function getAgeInMonths(birthDateISO: string, referenceDateISO?: string): number {
  const birthDate = new Date(birthDateISO);
  const refDate = referenceDateISO ? new Date(referenceDateISO) : new Date();
  const years = refDate.getFullYear() - birthDate.getFullYear();
  const months = refDate.getMonth() - birthDate.getMonth();
  const days = refDate.getDate() - birthDate.getDate();
  let totalMonths = years * 12 + months;
  if (days < 0) {
    totalMonths -= 1;
  }
  return Math.max(0, totalMonths);
}

export function getAgeBaseline(birthDateISO: string, referenceDateISO?: string): AgeWakeWindow {
  const ageMonths = getAgeInMonths(birthDateISO, referenceDateISO);
  for (const baseline of AGE_WAKE_WINDOWS) {
    if (ageMonths >= baseline.minMonths && ageMonths <= baseline.maxMonths) {
      return baseline;
    }
  }
  return AGE_WAKE_WINDOWS[AGE_WAKE_WINDOWS.length - 1];
}
