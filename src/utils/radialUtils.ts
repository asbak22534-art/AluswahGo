export const getRadialExternalUrl = (profil: Record<string, string> | undefined | null): string => {
  if (!profil || typeof profil !== 'object') return '';

  // 1. Direct priority keys (case-sensitive check for common variations and cell B17)
  const priorityKeys = [
    '_row17',
    'row17',
    'link_radial',
    'radial_link',
    'url_radial',
    'radial_url',
    'radial',
    'Radial',
    'RADIAL',
    'url_external_radial',
    'radial_external_url'
  ];

  for (const k of priorityKeys) {
    if (profil[k] && typeof profil[k] === 'string') {
      const val = profil[k].trim();
      if (isValidUrlCandidate(val)) {
        return formatUrl(val);
      }
    }
  }

  // 2. Iterate all keys in profil object case-insensitively
  for (const [key, rawVal] of Object.entries(profil)) {
    if (!rawVal) continue;
    const val = String(rawVal).trim();
    if (!val) continue;

    const lowerKey = key.trim().toLowerCase();
    
    if (
      lowerKey === 'radial' || 
      lowerKey === '_row17' || 
      lowerKey === 'row17' || 
      lowerKey.includes('radial')
    ) {
      if (isValidUrlCandidate(val)) {
        return formatUrl(val);
      }
    }
  }

  // 3. Fallback: check _row17 directly
  if (profil._row17 && isValidUrlCandidate(String(profil._row17).trim())) {
    return formatUrl(String(profil._row17).trim());
  }

  return '';
};

function isValidUrlCandidate(val: string): boolean {
  if (!val) return false;
  const lower = val.toLowerCase();
  return lower.startsWith('http://') || 
         lower.startsWith('https://') || 
         (lower.includes('.') && !lower.includes(' ') && lower.length > 3);
}

function formatUrl(val: string): string {
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
