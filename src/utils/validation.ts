export function validateBirthDate(value: string) {
  const trimmed = (value || '').trim();
  const parts = trimmed.split('/');
  if (parts.length !== 3 || trimmed.length !== 10) {
    return { valid: false, error: 'Data deve ser no formato DD/MM/AAAA' };
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return { valid: false, error: 'Data inválida' };
  }
  const now = new Date();
  if (date > now) return { valid: false, error: 'Data não pode ser futura' };
  const age = now.getFullYear() - date.getFullYear();
  if (age < 0 || age > 120) return { valid: false, error: 'Idade fora do intervalo aceitável' };
  return { valid: true, date };
}

export function validateWeight(value: string) {
  if (!value) return { valid: false, error: 'Informe o peso' };
  const cleaned = value.replace(/[ ,]/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return { valid: false, error: 'Peso deve ser numérico' };
  if (num < 2 || num > 500) return { valid: false, error: 'Peso fora da faixa (2–500 kg)' };
  return { valid: true, value: num };
}

export function validateHeight(value: string) {
  if (!value) return { valid: false, error: 'Informe a altura' };
  const cleaned = value.replace(/[ ,]/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return { valid: false, error: 'Altura deve ser numérica' };
  if (num < 30 || num > 250) return { valid: false, error: 'Altura fora da faixa (30–250 cm)' };
  return { valid: true, value: num };
}
