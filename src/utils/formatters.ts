export const formatBirthDate = (text: string) => {
  let cleaned = (text || '').replace(/\D/g, '');
  if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
  let formatted = cleaned;
  if (cleaned.length > 2) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    if (cleaned.length > 4) {
      formatted += `/${cleaned.slice(4, 8)}`;
    }
  }
  return formatted;
};

export const sanitizeNumberInput = (text: string, maxLength = 6) => {
  const cleaned = (text || '').replace(/[^0-9.,]/g, '').slice(0, maxLength);
  return cleaned;
};
