// Descarga un archivo generado en el navegador (sin servidor).
function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Se libera después del click para que el navegador alcance a iniciar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Fecha local para el nombre del archivo: 2026-11-13_18-05
function stamp(date = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}`;
}

// Backup completo: participantes, historial y configuración.
export function exportJSON({ items, history, settings }) {
  const data = {
    app: "ruleta",
    version: 3,
    exportedAt: new Date().toISOString(),
    items: items.map(({ label }) => label),
    history: history.map(({ n, label }) => ({ n, label })),
    settings,
  };
  download(
    `ruleta_${stamp()}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

// Lista simple, un nombre por renglón: se puede pegar tal cual en "Carga al por mayor".
const toList = (items) => items.map(({ label }) => label).join("\n");

export function exportTXT(items) {
  download(
    `ruleta_${stamp()}.txt`,
    toList(items) + "\n",
    "text/plain;charset=utf-8",
  );
}

// Copia la lista al portapapeles. Devuelve true si salió bien.
export async function copyList(items) {
  const text = toList(items);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sin API de portapapeles (http sin https, navegadores viejos): plan B con execCommand.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
