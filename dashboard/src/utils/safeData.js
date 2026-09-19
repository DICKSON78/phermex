export function toArray(data, fallback = []) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return fallback;
}

export function toObject(data, fallback = null) {
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) return data.data;
  return fallback;
}
