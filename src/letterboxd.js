// Trae las películas de una lista de Letterboxd. Dos caminos:
// 1. El link, que resuelve la función /api/letterboxd (scrapea la página).
// 2. El CSV que exporta Letterboxd, que se lee acá mismo (plan B si
//    Cloudflare bloquea el scraping, o para listas privadas).
// Las dos devuelven [{ title, year }].

export async function fetchLetterboxdList(url) {
  let res;
  try {
    res = await fetch(`/api/letterboxd?url=${encodeURIComponent(url)}`);
  } catch {
    throw new Error("No hay conexión. Probá de nuevo en un rato.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(data?.error || "No pude traer la lista.");
  return data; // { name, films, truncated }
}

// Parser CSV mínimo (comillas, comas y saltos de línea adentro de comillas).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

// Sirve para el export de una lista ("Position,Name,Year,URL,...", que viene
// después de un encabezado con los datos de la lista) y para el de la
// watchlist ("Date,Name,Year,Letterboxd URI").
export function parseLetterboxdCsv(text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const headerAt = rows.findIndex(
    (r) => r.includes("Name") && r.includes("Year"),
  );
  if (headerAt === -1)
    throw new Error("Ese CSV no parece una lista exportada de Letterboxd.");
  const header = rows[headerAt];
  const nameCol = header.indexOf("Name");
  const yearCol = header.indexOf("Year");
  const films = rows
    .slice(headerAt + 1)
    .map((r) => ({
      title: (r[nameCol] || "").trim(),
      year: Number(r[yearCol]) || null,
    }))
    .filter((f) => f.title);
  if (!films.length) throw new Error("El CSV no tiene películas.");
  return films;
}

export const filmLabel = (film, withYear) =>
  withYear && film.year ? `${film.title} (${film.year})` : film.title;
