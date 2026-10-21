export const COMPANY_TIME_ZONE = 'America/Sao_Paulo';
export const PICKUP_THRESHOLD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

// Instants are compared in UTC so the result does not depend on the device zone.
// The displayed times use the company's Brazilian timezone.
export function getPickupAgeDays(lote, now = Date.now()) {
  if (!lote?.pintado || lote.data_entrega || !lote.data_pintura) return null;
  const paintedAt = Date.parse(lote.data_pintura);
  const instant = Number(now);
  if (!Number.isFinite(paintedAt) || !Number.isFinite(instant) || paintedAt > instant) return null;
  return Math.floor((instant - paintedAt) / DAY_MS);
}

export function isPickupPending(lote, now = Date.now()) {
  const days = getPickupAgeDays(lote, now);
  return days !== null && days >= PICKUP_THRESHOLD_DAYS;
}

export function buildStatusUpdates(lote, updates, now = new Date().toISOString()) {
  const result = { ...updates, updated_at: now };
  delete result.data_pintura;
  if (updates.pintado === true && !lote.pintado) result.data_pintura = now;
  if (updates.pintado === false && lote.pintado) result.data_pintura = null;
  return result;
}
