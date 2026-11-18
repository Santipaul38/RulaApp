// Función serverless (Vercel): recibe el link de una lista o watchlist de
// Letterboxd y devuelve los títulos de todas sus películas.
// GET /api/letterboxd?url=https://letterboxd.com/usuario/list/nombre/
//
// Letterboxd no tiene API pública ni habilita CORS, así que leemos el HTML
// de la lista desde acá. Si cambian el markup, hay que tocar parsePage().

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAX_PAGES = 20; // 2000 pelis en listas, 560 en watchlists
const USER = "[A-Za-z0-9_]+";
const LIST_RE = new RegExp(`^/(${USER})/list/([a-z0-9-]+)(?:/|$)`, "i");
const WATCHLIST_RE = new RegExp(`^/(${USER})/watchlist(?:/|$)`, "i");

class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Solo aceptamos letterboxd.com y boxd.it, y lo llevamos a la URL base
// (sin /detail/, /by/..., /page/N/), que es la que no frena Cloudflare.
async function canonicalUrl(raw) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new UserError("Eso no parece un link.");
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "boxd.it") {
    const res = await fetch(`https://boxd.it${url.pathname}`, {
      redirect: "manual",
      headers: { "User-Agent": UA },
    });
    const location = res.headers.get("location");
    if (!location) throw new UserError("Ese link corto de boxd.it no lleva a ningún lado.");
    url = new URL(location, "https://letterboxd.com");
  } else if (host !== "letterboxd.com") {
    throw new UserError("Tiene que ser un link de Letterboxd.");
  }

  const list = url.pathname.match(LIST_RE);
  if (list) return `https://letterboxd.com/${list[1]}/list/${list[2]}/`;
  const watch = url.pathname.match(WATCHLIST_RE);
  if (watch) return `https://letterboxd.com/${watch[1]}/watchlist/`;
  throw new UserError(
    "Tiene que ser una lista (letterboxd.com/usuario/list/nombre) o una watchlist.",
  );
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#")
      return String.fromCodePoint(
        e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)),
      );
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function parsePage(html) {
  const films = [];
  for (const [, raw] of html.matchAll(/data-item-name="([^"]*)"/g)) {
    const full = decode(raw).trim();
    const m = full.match(/^(.*\S)\s+\((\d{4})\)$/);
    films.push(m ? { title: m[1], year: Number(m[2]) } : { title: full, year: null });
  }
  const pages = [...html.matchAll(/\/page\/(\d+)\//g)].map((m) => Number(m[1]));
  const lastPage = Math.max(1, ...pages);
  const og = html.match(/<meta property="og:title" content="([^"]*)"/);
  return { films, lastPage, name: og ? decode(og[1]) : null };
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
  });
  if (res.status === 404) throw new UserError("No encontré esa lista. ¿Es pública?", 404);
  if (!res.ok)
    throw new UserError(
      "Letterboxd no nos dejó entrar. Probá subiendo el CSV exportado de la lista.",
      502,
    );
  return parsePage(await res.text());
}

export async function getList(rawUrl) {
  const base = await canonicalUrl(String(rawUrl || "").trim());
  const first = await fetchPage(base);
  const total = Math.min(first.lastPage, MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: total - 1 }, (_, i) => fetchPage(`${base}page/${i + 2}/`)),
  );
  const films = [first, ...rest].flatMap((p) => p.films);
  if (!films.length) throw new UserError("La lista está vacía (o no pude leerla).", 404);
  return {
    url: base,
    name: first.name,
    films,
    truncated: first.lastPage > MAX_PAGES,
  };
}

export async function GET(request) {
  const url = new URL(request.url).searchParams.get("url");
  try {
    if (!url) throw new UserError("Falta el link.");
    const data = await getList(url);
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    const status = err instanceof UserError ? err.status : 500;
    const error =
      err instanceof UserError ? err.message : "Algo se rompió leyendo la lista.";
    if (status === 500) console.error(err);
    return Response.json({ error }, { status });
  }
}
