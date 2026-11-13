import { useState } from "react";
import Background from "./Background.jsx";
import Wheel from "./Wheel.jsx";
import { colorFor } from "./colors.js";
import { usePersistentState } from "./usePersistentState.js";

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const HISTORY_SIZE = 10;

const SPIN_TEXTS = [
  "ARRANCÓ EL BAILE…",
  "NI PESTAÑEES…",
  "AGARRATE CATALINA…",
  "MÁS VUELTAS QUE UN TRÁMITE…",
  "SE PICÓ, CHE…",
];
const WIN_TITLES = [
  "¡Y SALIÓ…!",
  "¡TE TOCÓ, PAPÁ!",
  "¡LA RULETA HABLÓ!",
  "¡FUISTE, CAMPEÓN!",
  "¡SE PUDRIÓ TODO!",
];
const WIN_PHRASES = [
  "¿No te gusta? Andá a llorarle al Chiqui Tapia.",
  "Reclamos, a la AFA. Acá no se atiende.",
  "Bancatela como un campeón.",
  "Ni en pedo se repite.",
  "Te tocó lavar los platos del asado.",
  "Posta, la ruleta no miente.",
];

const ACCENTS = [
  { name: "Dorado", value: "#FFC23D" },
  { name: "Turquesa", value: "#1FC8B4" },
  { name: "Celeste", value: "#3DA8FF" },
  { name: "Naranja", value: "#FF7A2F" },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const fieldClass =
  "box-border rounded-[14px] border-2 border-borde-input bg-input px-4 text-base text-crema outline-none";
const ghostClass =
  "ghost inline-flex min-h-11 items-center gap-1.5 border-none bg-transparent px-2.5 text-sm font-medium text-lila";

export default function App() {
  const [items, setItems] = usePersistentState("ruleta:v3:items", []);
  const [history, setHistory] = usePersistentState("ruleta:v3:history", []);
  const [removeWinner, setRemoveWinner] = usePersistentState(
    "ruleta:v3:eliminate",
    false,
  );
  const [accent, setAccent] = usePersistentState(
    "ruleta:v3:accent",
    ACCENTS[0].value,
  );
  const [duration, setDuration] = usePersistentState("ruleta:v3:duration", 5);

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinMsg, setSpinMsg] = useState("");
  const [pending, setPending] = useState(null);
  const [winner, setWinner] = useState(null); // { id, label, color, head, sub }
  const [draft, setDraft] = useState("");
  const [bulk, setBulk] = useState("");
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const n = items.length;
  const noSpin = spinning || n < 2;

  const addLabels = (labels) => {
    const clean = labels.map((s) => s.trim()).filter(Boolean);
    if (clean.length)
      setItems((list) => [
        ...list,
        ...clean.map((label) => ({ id: newId(), label })),
      ]);
  };

  const add = () => {
    addLabels([draft]);
    setDraft("");
  };

  const addBulk = () => {
    addLabels(bulk.split(/[\n,]+/));
    setBulk("");
  };

  const shuffle = () => {
    if (spinning) return;
    setItems((list) => {
      const arr = [...list];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  const clearAll = () => {
    if (spinning) return;
    setItems([]);
    setHistory([]);
    setWinner(null);
  };

  const removeById = (id) =>
    setItems((list) => list.filter((x) => x.id !== id));

  const spin = () => {
    if (noSpin) return;
    const seg = 360 / n;
    const i = Math.floor(Math.random() * n);
    // Punto al azar dentro del gajo ganador, lejos de los bordes.
    const target = (i + 0.5) * seg + (Math.random() - 0.5) * seg * 0.7;
    const cur = ((rotation % 360) + 360) % 360;
    const delta = (((360 - target - cur) % 360) + 720) % 360;
    const picked = items[i];
    setPending({
      id: picked.id,
      label: picked.label,
      color: colorFor(i, n).bg,
      head: pick(WIN_TITLES),
      sub: pick(WIN_PHRASES),
    });
    setWinner(null);
    setSpinMsg(pick(SPIN_TEXTS));
    setSpinning(true);
    setRotation(rotation + 360 * 7 + delta);
  };

  const handleSpinEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    if (pending) {
      setWinner(pending);
      // El más reciente va primero; `n` es el número de giro (#1, #2…).
      setHistory((h) =>
        [
          {
            n: (h[0]?.n ?? h.length) + 1,
            label: pending.label,
            color: pending.color,
          },
          ...h,
        ].slice(0, HISTORY_SIZE),
      );
      setPending(null);
    }
  };

  // "Que siga la joda": cierra el cartel (con modo eliminación activado, igual lo saca).
  const closeWinner = () => {
    if (removeWinner && winner) removeById(winner.id);
    setWinner(null);
  };

  // "Afuera, ya fue": siempre lo saca.
  const dropWinner = () => {
    if (!winner) return;
    removeById(winner.id);
    setWinner(null);
  };

  return (
    <div
      className="relative box-border min-h-screen overflow-hidden bg-noche px-5 pb-16 pt-10 font-sans text-crema"
      style={{ "--color-accent": accent }}
    >
      <Background />

      <div className="relative z-[1] mx-auto flex max-w-[1180px] flex-col gap-9">
        {/* Encabezado */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-bold tracking-[0.24em] text-rosa-claro">
              ACÁ NO HAY VAR, MAESTRO
            </span>
            <h1 className="m-0 font-display text-[clamp(48px,9vw,68px)] font-normal leading-none text-accent [text-shadow:5px_5px_0_#FF3D7F]">
              RULETA<span className="sr-only"> de nombres online para sortear</span>
            </h1>
            <p className="m-0 text-[17px] text-lila">
              Metés los nombres, le das masa y lo que sale, sale. ¿No te gustó?
              Andá a llorarle a Lord Chiqui Tapia.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border-2 border-borde bg-panel px-[18px] py-2.5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-accent"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
              <path d="M16 4a4 4 0 0 1 0 8" />
              <path d="M19 14c1.8.9 3 2.8 3 5" />
            </svg>
            <span className="text-base font-bold">{n} en el baile</span>
          </div>
        </header>

        <div className="flex flex-wrap items-start gap-10">
          {/* Columna de la rueda */}
          <div className="flex min-w-0 flex-[1_1_520px] flex-col items-center gap-[30px]">
            <Wheel
              items={items}
              rotation={rotation}
              spinning={spinning}
              duration={duration}
              canSpin={!noSpin}
              onSpin={spin}
              onSpinEnd={handleSpinEnd}
            >
              {winner && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(20,10,38,0.78)]">
                  <div
                    role="dialog"
                    aria-label="Resultado"
                    className="pop box-border flex w-[78%] flex-col items-center gap-3.5 rounded-[28px] border-4 border-accent bg-crema px-6 py-7 text-center text-tinta shadow-[0_10px_0_#FF3D7F]"
                  >
                    <span className="text-[13px] font-bold tracking-[0.22em] text-rosa-texto">
                      {winner.head}
                    </span>
                    <div className="flex max-w-full items-center gap-3">
                      <span
                        className="h-[18px] w-[18px] flex-none rounded-full border-[3px] border-tinta"
                        style={{ background: winner.color }}
                      />
                      <span className="font-display text-[clamp(24px,5vw,40px)] leading-[1.05] [overflow-wrap:anywhere]">
                        {winner.label}
                      </span>
                    </div>
                    <span className="text-[15px] text-tinta-suave">
                      {winner.sub}
                    </span>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
                      <button
                        type="button"
                        autoFocus
                        onClick={closeWinner}
                        className="min-h-11 rounded-full border-none bg-tinta px-[22px] text-[15px] font-bold text-crema"
                      >
                        Que siga la joda
                      </button>
                      <button
                        type="button"
                        onClick={dropWinner}
                        className="min-h-11 rounded-full border-2 border-tinta bg-transparent px-[22px] text-[15px] font-bold text-tinta"
                      >
                        Afuera, ya fue
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Wheel>

            <button
              type="button"
              onClick={spin}
              disabled={noSpin}
              className="min-h-16 max-w-full rounded-full border-none bg-rosa px-[clamp(24px,6vw,60px)] font-display text-[clamp(18px,4vw,24px)] tracking-[0.04em] text-white shadow-[0_7px_0_#A3134A]"
            >
              {spinning
                ? spinMsg
                : n < 2
                  ? "FALTA GENTE, CHE"
                  : "¡DALE QUE VA!"}
            </button>

            {/* Historial y reclamos */}
            <div className="flex w-full max-w-[560px] flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] font-bold tracking-[0.18em] text-lila">
                  LOS QUE YA LIGARON
                </span>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="ghost min-h-11 border-none bg-transparent px-2 text-sm font-medium text-lila"
                >
                  Limpiar
                </button>
              </div>
              {history.length === 0 ? (
                <span className="text-[15px] text-apagado">
                  Acá todavía no ligó nadie. Dale, girá que se enfría el mate.
                </span>
              ) : (
                <ol
                  className="flex flex-wrap gap-2"
                  aria-label="Resultados, del más reciente al más viejo"
                >
                  {history.map((h, i) => {
                    const num = h.n ?? history.length - i;
                    const latest = i === 0;
                    return (
                      <li
                        key={num}
                        className={`inline-flex items-center gap-2 rounded-full border-2 bg-panel py-[7px] pl-2.5 pr-3.5 text-[15px] font-medium ${
                          latest ? "border-accent" : "border-borde opacity-80"
                        }`}
                      >
                        <span className="text-xs font-bold text-apagado">
                          #{num}
                        </span>
                        <span
                          className="h-2.5 w-2.5 flex-none rounded-full"
                          style={{ background: h.color }}
                        />
                        {h.label}
                        {latest && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-noche">
                            último
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
              {history.length > 1 && (
                <span className="-mt-1 text-xs text-apagado">
                  Del más reciente al más viejo · se guardan los últimos{" "}
                  {HISTORY_SIZE}
                </span>
              )}
              <p className="mt-1 rounded-[14px] border-2 border-dashed border-rosa bg-rosa/12 px-4 py-3 text-sm leading-[1.45] text-[#FFD3E2]">
                <strong className="text-white">
                  Departamento de reclamos:
                </strong>{" "}
                la ruleta no acepta quejas, apelaciones ni “pero yo no estaba
                listo”. Si no te gustó el resultado, andá a llorarle a Lord
                Chiqui Tapia.
              </p>
            </div>
          </div>

          {/* Panel lateral */}
          <aside className="box-border flex min-w-0 max-w-full flex-[1_1_340px] flex-col gap-6 rounded-[28px] border-2 border-borde bg-[rgba(33,18,60,0.82)] p-[26px] backdrop-blur-[14px]">
            <div className="flex flex-col gap-2.5">
              <label htmlFor="nuevo" className="text-sm font-bold">
                Sumá una víctima
              </label>
              <div className="flex gap-2.5">
                <input
                  id="nuevo"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  placeholder="Ej: el que nunca pone para el asado"
                  className={`${fieldClass} min-h-12 min-w-0 flex-auto`}
                />
                <button
                  type="button"
                  onClick={add}
                  className="min-h-12 flex-none rounded-[14px] border-none bg-accent px-5 text-base font-bold text-[#2A1145]"
                >
                  ¡Adentro!
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="masiva" className="text-sm font-bold">
                Carga al por mayor{" "}
                <span className="font-normal text-lila">
                  · uno por renglón o con comas, como venga
                </span>
              </label>
              <textarea
                id="masiva"
                rows={4}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={
                  "El Tano\nLa Colo\nEl primo de Fede que cayó sin avisar"
                }
                className={`${fieldClass} w-full resize-y py-3 leading-normal`}
              />
              <button
                type="button"
                onClick={addBulk}
                className="min-h-12 rounded-[14px] border-2 border-accent bg-transparent text-base font-bold text-accent"
              >
                Mandalos a todos
              </button>
            </div>

            <div className="h-0.5 bg-borde" />

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold">Los anotados</span>
                  <span className="box-border inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-rosa px-2 text-sm font-bold text-white">
                    {n}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={shuffle}
                    className={ghostClass}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M16 3h5v5" />
                      <path d="M4 20 21 3" />
                      <path d="M21 16v5h-5" />
                      <path d="M15 15l6 6" />
                      <path d="M4 4l5 5" />
                    </svg>
                    Mezclar
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className={ghostClass}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                    </svg>
                    Barajar y dar de nuevo
                  </button>
                </div>
              </div>
              <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
                {n === 0 && (
                  <span className="px-1 py-3.5 text-[15px] text-apagado">
                    Más vacía que la heladera a fin de mes. Sumá a alguien
                    arriba.
                  </span>
                )}
                {items.map((r, i) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl py-1 pl-3 pr-1 hover:bg-fila"
                  >
                    <span className="w-[22px] text-[13px] font-bold text-apagado">
                      {i + 1}
                    </span>
                    <span
                      className="h-3.5 w-3.5 flex-none rounded-full"
                      style={{ background: colorFor(i, n).bg }}
                    />
                    <span
                      className="min-w-0 flex-auto truncate text-base"
                      title={r.label}
                    >
                      {r.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeById(r.id)}
                      aria-label={`Quitar ${r.label}`}
                      className="ghost inline-flex h-11 w-11 flex-none items-center justify-center rounded-[10px] border-none bg-transparent text-lila"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M6 6l12 12" />
                        <path d="M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-borde bg-input px-4 py-3.5">
              <input
                type="checkbox"
                checked={removeWinner}
                onChange={() => setRemoveWinner((v) => !v)}
                className="mt-px h-5 w-5 flex-none accent-rosa"
              />
              <span className="text-[15px] leading-[1.4]">
                <strong>Modo eliminación:</strong> el que sale, se va a las
                duchas y no vuelve a jugar
              </span>
            </label>
          </aside>
        </div>

        {/* Firma */}
        <footer className="border-t-2 border-borde pt-6 text-center text-sm text-lila">
          Hecho con{" "}
          <span role="img" aria-label="mate">
            🧉
          </span>{" "}
          por{" "}
          <a
            href="https://github.com/Santipaul38"
            target="_blank"
            rel="noopener noreferrer author"
            className="font-bold text-accent underline decoration-2 underline-offset-4 hover:brightness-110"
          >
            Santiago
          </a>
        </footer>
      </div>

      {/* Tweaks: color principal y duración del giro */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
        {tweaksOpen && (
          <div className="pop w-64 rounded-2xl border-2 border-borde bg-[rgba(33,18,60,0.92)] p-4 backdrop-blur-[14px]">
            <p className="mb-2 text-sm font-bold">Color principal</p>
            <div className="mb-4 flex gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAccent(a.value)}
                  aria-label={a.name}
                  aria-pressed={accent === a.value}
                  title={a.name}
                  className={`h-8 w-8 rounded-full border-2 ${accent === a.value ? "border-crema" : "border-transparent"}`}
                  style={{ background: a.value }}
                />
              ))}
            </div>
            <label
              htmlFor="duracion"
              className="mb-1 flex justify-between text-sm font-bold"
            >
              Duración del giro{" "}
              <span className="text-accent">{duration} s</span>
            </label>
            <input
              id="duracion"
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={duration}
              disabled={spinning}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setTweaksOpen((o) => !o)}
          aria-expanded={tweaksOpen}
          className="ghost rounded-full border-2 border-borde bg-panel px-4 py-2 text-sm font-bold text-lila"
        >
          ⚙ Tweaks
        </button>
      </div>
    </div>
  );
}
