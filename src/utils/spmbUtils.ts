export const getSpmbExternalUrl = (profil: Record<string, string> | undefined | null): string => {
  if (!profil || typeof profil !== 'object') return '';

  // 1. Direct priority keys (case-sensitive check for common variations)
  const priorityKeys = [
    'SPMB',
    'spmb',
    'Spmb',
    '_row21',
    'row21',
    'url_spmb',
    'spmb_url',
    'link_spmb',
    'spmb_link',
    'url_pendaftaran',
    'pendaftaran_url',
    'link_pendaftaran'
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
      lowerKey === 'spmb' || 
      lowerKey === '_row21' || 
      lowerKey === 'row21' || 
      lowerKey.includes('spmb') || 
      lowerKey.includes('pendaftaran')
    ) {
      if (isValidUrlCandidate(val)) {
        return formatUrl(val);
      }
    }
  }

  // 3. Fallback: check _row21
  if (profil._row21 && isValidUrlCandidate(String(profil._row21).trim())) {
    return formatUrl(String(profil._row21).trim());
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
