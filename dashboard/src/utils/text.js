/**
 * Convert API values to safe display text.
 *
 * Laravel relations are inconsistent: some endpoints return a pharmacy/user
 * name as a string, others return the whole model object. Rendering that
 * object directly in JSX throws React error #31 ("Objects are not valid as a
 * React child"). Every display of a relation should go through this helper.
 */
export function textValue(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => textValue(item, ''))
      .filter((part) => part && part !== fallback)
    return parts.length ? parts.join(', ') : fallback
  }

  if (typeof value === 'object') {
    const candidate =
      value.pharmacy_name ||
      value.name ||
      value.manufacturer_name ||
      value.full_name ||
      value.title ||
      value.label ||
      value.email ||
      value.code
    return candidate ? String(candidate) : fallback
  }

  return String(value)
}

export default textValue
