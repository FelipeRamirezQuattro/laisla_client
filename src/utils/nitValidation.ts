// DIAN's official módulo 11 check-digit algorithm for Colombian NIT numbers:
// https://siemprealdia.co/colombia/impuestos/digito-de-verificacion-del-nit/
const WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function calculateNitDV(nit: string): number {
  const digits = nit.replace(/\D/g, '');
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits[digits.length - 1 - i]);
    const weight = WEIGHTS[i] ?? 0;
    sum += digit * weight;
  }
  const remainder = sum % 11;
  return remainder <= 1 ? remainder : 11 - remainder;
}

export function isValidNitDV(nit: string, dv: string | number): boolean {
  const digits = nit.replace(/\D/g, '');
  if (!digits) return false;
  return calculateNitDV(digits) === Number(dv);
}
