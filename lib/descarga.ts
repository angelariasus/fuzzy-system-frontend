/** Descarga un texto como archivo desde el navegador (CSV de resultados). */
export function descargarTexto(nombre: string, contenido: string, mime = 'text/csv;charset=utf-8'): void {
  // El BOM hace que Excel abra el CSV en UTF-8 y respete las tildes.
  const blob = new Blob(['\uFEFF', contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
