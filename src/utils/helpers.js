export function isRecentDocument(createdAt) {
  if (!createdAt?.seconds) return false;

  const created = createdAt.seconds * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return new Date(created) > new Date(Date.now() - sevenDays);
}