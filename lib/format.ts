/**
 * Formato numérico con coma decimal (como en el informe). Se arma a mano en lugar de usar
 * Intl para que el resultado no dependa del locale del navegador ni agregue separadores de miles.
 */
export function formatNumero(valor: number, decimales = 2): string {
  if (!Number.isFinite(valor)) return '-';
  const texto = valor.toFixed(decimales);
  // Evita "-0,00" tras el redondeo.
  const normalizado = /^-0(\.0+)?$/.test(texto) ? texto.slice(1) : texto;
  return normalizado.replace('.', ',');
}

export const formatIPA = (ipa: number): string => formatNumero(ipa, 2);
export const formatGrado = (grado: number): string => formatNumero(grado, 4);

/** Convierte "14,5", "14.5" o " 14 " en número. Devuelve NaN si no es un número válido. */
export function parseNumeroLocal(texto: string): number {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '' || !/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(limpio)) return Number.NaN;
  return Number(limpio);
}

/** "14:30" a 14.5. Acepta "H:MM" y "HH:MM". Devuelve NaN si el formato o los minutos no son válidos. */
export function horaADecimal(texto: string): number {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(texto);
  if (!m) return Number.NaN;
  const horas = Number(m[1]);
  const minutos = Number(m[2]);
  if (minutos > 59) return Number.NaN;
  return horas + minutos / 60;
}

/** Acepta decimal ("14,5") o "HH:MM". Es lo que escribe la persona en el campo de hora. */
export function parseHora(texto: string): number {
  return texto.includes(':') ? horaADecimal(texto) : parseNumeroLocal(texto);
}

/** 14.5 a "14:30". Redondea al minuto más cercano; 24 se muestra como "24:00". */
export function decimalAHora(decimal: number): string {
  if (!Number.isFinite(decimal)) return '--:--';
  let totalMinutos = Math.round(decimal * 60);
  if (totalMinutos < 0) totalMinutos = 0;
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/** Texto de las entradas para tiles y anuncios: "1900 W · 3 ocupantes · 12:00". */
export function resumenEntradas(potencia: number, ocupantes: number, hora: number): string {
  const sufijo = ocupantes === 1 ? 'ocupante' : 'ocupantes';
  return `${formatNumero(potencia, Number.isInteger(potencia) ? 0 : 1)} W · ${formatNumero(
    ocupantes,
    Number.isInteger(ocupantes) ? 0 : 1,
  )} ${sufijo} · ${decimalAHora(hora)}`;
}

/** Número para URL y para CSV: punto decimal, sin ceros sobrantes. */
export function numeroParaUrl(valor: number): string {
  return String(Math.round(valor * 10000) / 10000);
}
