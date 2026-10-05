// Counts are supplied by the API; a missing participant list is not an empty list.
export const readParticipantCount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
