import { useMemo, useState } from "react";

/* ------------------------------------------------------------------
   EstudiHambre - maqueta visual (prototipo)
   Datos de ejemplo: los restaurantes y las calificaciones son
   inventados y solo sirven para demostrar la interfaz y los filtros.
------------------------------------------------------------------- */

// Genera calificaciones de ejemplo de forma determinista.
function sembrar(n, base, pctAbundante, comentarios = []) {
  return Array.from({ length: n }, (_, i) => ({
    e: Math.max(1, Math.min(5, Math.round(base + ((i % 3) - 1) * 0.7))),
    a: i / n < pctAbundante,
    c: comentarios[i] || "",
  }));
}

const DATOS_INICIALES = [
  {
    id: 1,
    nombre: "Sazón del Parque",
    direccion: "Cra. 15 # 12-30",
    metros: 250,
    precio: 9000,
    plato: "Sopa, seco con pollo, jugo",
    horario: "11:30 a.m. - 2:30 p.m.",
    tel: "300 000 0001",
    votos: sembrar(14, 4.4, 0.7, ["Muy buena porción", "Sazón casera"]),
  },
  {
    id: 2,
    nombre: "La Cocina de la Esquina",
    direccion: "Cl. 14 # 18-05",
    metros: 400,
    precio: 12000,
    plato: "Sopa, bandeja paisa pequeña, limonada",
    horario: "11:00 a.m. - 3:00 p.m.",
    tel: "300 000 0002",
    votos: sembrar(22, 4.6, 0.55, ["Excelente calidad"]),
  },
  {
    id: 3,
    nombre: "Corrientazo El Estudiante",
    direccion: "Cra. 18 # 13-22",
    metros: 120,
    precio: 7500,
    plato: "Sopa, arroz, carne, ensalada",
    horario: "11:30 a.m. - 2:00 p.m.",
    tel: "300 000 0003",
    votos: sembrar(9, 3.6, 0.85, ["Barato y llena"]),
  },
  {
    id: 4,
    nombre: "Pollo Brasa Campus",
    direccion: "Av. Bolívar # 20-10",
    metros: 600,
    precio: 14500,
    plato: "Cuarto de pollo, papas, bebida",
    horario: "12:00 m. - 8:00 p.m.",
    tel: "300 000 0004",
    votos: sembrar(31, 4.1, 0.4),
  },
  {
    id: 5,
    nombre: "Veggie Aula",
    direccion: "Cl. 12 # 16-40",
    metros: 350,
    precio: 11000,
    plato: "Crema, plato vegetariano, jugo",
    horario: "11:30 a.m. - 2:30 p.m.",
    tel: "300 000 0005",
    votos: sembrar(6, 4.5, 0.3, ["Opción distinta y rica"]),
  },
  {
    id: 6,
    nombre: "Empanadas y Algo Más",
    direccion: "Cra. 14 # 11-18",
    metros: 90,
    precio: 5000,
    plato: "3 empanadas, gaseosa pequeña",
    horario: "8:00 a.m. - 6:00 p.m.",
    tel: "300 000 0006",
    votos: sembrar(2, 5, 0.5),
  },
  {
    id: 7,
    nombre: "Asadero Don Chucho",
    direccion: "Cl. 15 # 19-12",
    metros: 700,
    precio: 16000,
    plato: "Churrasco, papa criolla, ensalada",
    horario: "12:00 m. - 9:00 p.m.",
    tel: "300 000 0007",
    votos: sembrar(18, 4.3, 0.75, ["Porción generosa"]),
  },
];

const MIN_VOTOS = 3; // mínimo de calificaciones para rankear por estrellas

const ORDENES = [
  { id: "valor", etiqueta: "Mejor relación calidad-precio" },
  { id: "precio", etiqueta: "Menor costo" },
  { id: "calificacion", etiqueta: "Mejor referenciado" },
  { id: "porcion", etiqueta: "Mayor cantidad de comida" },
];

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function estadisticas(r) {
  const n = r.votos.length;
  const cal = n ? r.votos.reduce((s, v) => s + v.e, 0) / n : 0;
  const porcion = n ? r.votos.filter((v) => v.a).length / n : 0;
  return { n, cal, porcion };
}

function Estrellas({ valor, onChange }) {
  return (
    <span className="estrellas" aria-label={`${valor.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= Math.round(valor) ? "on" : "off"}
          onClick={onChange ? () => onChange(i) : undefined}
          style={onChange ? { cursor: "pointer", fontSize: 26 } : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function EstudiHambre() {
  const [restaurantes, setRestaurantes] = useState(DATOS_INICIALES);
  const [orden, setOrden] = useState("valor");
  const [busqueda, setBusqueda] = useState("");
  const [precioMax, setPrecioMax] = useState(20000);
  const [abierto, setAbierto] = useState(null);

  // Puntaje de valor: 40% calificación, 30% porción, 30% precio bajo.
  const lista = useMemo(() => {
    const precios = restaurantes.map((r) => r.precio);
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    const conDatos = restaurantes
      .map((r) => {
        const s = estadisticas(r);
        const barato = max === min ? 1 : 1 - (r.precio - min) / (max - min);
        const valor = 0.4 * (s.cal / 5) + 0.3 * s.porcion + 0.3 * barato;
        return { ...r, ...s, valor, pocas: s.n < MIN_VOTOS };
      })
      .filter(
        (r) =>
          r.precio <= precioMax &&
          r.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      );

    const comparar = {
      valor: (a, b) => b.valor - a.valor,
      precio: (a, b) => a.precio - b.precio,
      porcion: (a, b) => b.porcion - a.porcion,
      calificacion: (a, b) =>
        a.pocas !== b.pocas ? (a.pocas ? 1 : -1) : b.cal - a.cal,
    }[orden];
    return conDatos.sort(comparar);
  }, [restaurantes, orden, busqueda, precioMax]);

  const seleccionado = lista.find((r) => r.id === abierto) ||
    restaurantes.map((r) => ({ ...r, ...estadisticas(r) })).find((r) => r.id === abierto);

  function agregarVoto(id, voto) {
    setRestaurantes((rs) =>
      rs.map((r) => (r.id === id ? { ...r, votos: [...r.votos, voto] } : r))
    );
  }

  return (
    <div className="eh">
      <style>{CSS}</style>

      <header className="top">
        <div>
          <h1>
            Estudi<span>Hambre</span>
          </h1>
          <p>Compara dónde comer cerca del campus de la Universidad del Quindío</p>
        </div>
        <span className="chip">Prototipo · datos de ejemplo</span>
      </header>

      <section className="controles">
        <input
          type="search"
          placeholder="Buscar restaurante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="orden">
          {ORDENES.map((o) => (
            <button
              key={o.id}
              className={orden === o.id ? "activo" : ""}
              onClick={() => setOrden(o.id)}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
        <label className="rango">
          Precio máximo: <b>{cop.format(precioMax)}</b>
          <input
            type="range"
            min="5000"
            max="20000"
            step="500"
            value={precioMax}
            onChange={(e) => setPrecioMax(Number(e.target.value))}
          />
        </label>
      </section>

      <p className="resumen">
        {lista.length} {lista.length === 1 ? "resultado" : "resultados"}
        {orden === "calificacion" &&
          ` · los que tienen menos de ${MIN_VOTOS} calificaciones aparecen al final`}
      </p>

      <main className="rejilla">
        {lista.map((r, i) => (
          <article key={r.id} className="tarjeta" onClick={() => setAbierto(r.id)}>
            {orden === "valor" && i === 0 && <span className="insignia">Mejor valor</span>}
            <h2>{r.nombre}</h2>
            <p className="plato">{r.plato}</p>
            <p className="precio">{cop.format(r.precio)}</p>
            <div className="fila">
              <Estrellas valor={r.cal} />
              <small>
                {r.n ? r.cal.toFixed(1) : "—"} ({r.n})
              </small>
            </div>
            <div className="porcion">
              <small>Porción abundante según estudiantes</small>
              <div className="barra">
                <div style={{ width: `${Math.round(r.porcion * 100)}%` }} />
              </div>
              <small>{Math.round(r.porcion * 100)} %</small>
            </div>
            <p className="meta">A {r.metros} m del campus</p>
            {r.pocas && <span className="aviso">Pocas calificaciones</span>}
          </article>
        ))}
        {lista.length === 0 && (
          <p className="vacio">Ningún restaurante cumple esos filtros.</p>
        )}
      </main>

      {seleccionado && (
        <Detalle
          r={seleccionado}
          onCerrar={() => setAbierto(null)}
          onVotar={(v) => agregarVoto(seleccionado.id, v)}
        />
      )}

      <footer>
        Las calificaciones y los restaurantes mostrados son datos simulados para
        demostrar el funcionamiento del prototipo.
      </footer>
    </div>
  );
}

function Detalle({ r, onCerrar, onVotar }) {
  const [estrellas, setEstrellas] = useState(0);
  const [abundante, setAbundante] = useState(null);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  const comentarios = r.votos.filter((v) => v.c).slice(-3).reverse();
  const listo = estrellas > 0 && abundante !== null;

  function enviar() {
    onVotar({ e: estrellas, a: abundante, c: comentario.trim() });
    setEnviado(true);
  }

  return (
    <div className="fondo" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        <h2>{r.nombre}</h2>
        <p className="precio">{cop.format(r.precio)} · menú del día</p>
        <p>{r.plato}</p>
        <ul className="datos">
          <li>📍 {r.direccion} ({r.metros} m del campus)</li>
          <li>🕒 {r.horario}</li>
          <li>📞 {r.tel}</li>
        </ul>

        <h3>Lo que dicen los estudiantes</h3>
        {comentarios.length === 0 && <p className="meta">Aún no hay comentarios.</p>}
        {comentarios.map((v, i) => (
          <blockquote key={i}>
            <Estrellas valor={v.e} /> {v.c}
          </blockquote>
        ))}

        <h3>Califica tu experiencia</h3>
        {enviado ? (
          <p className="ok">¡Gracias! Tu calificación quedó registrada.</p>
        ) : (
          <>
            <Estrellas valor={estrellas} onChange={setEstrellas} />
            <p className="pregunta">¿La porción fue abundante?</p>
            <div className="si-no">
              <button className={abundante === true ? "activo" : ""} onClick={() => setAbundante(true)}>
                Sí
              </button>
              <button className={abundante === false ? "activo" : ""} onClick={() => setAbundante(false)}>
                No
              </button>
            </div>
            <textarea
              rows="2"
              maxLength="140"
              placeholder="Comentario corto (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <button className="enviar" disabled={!listo} onClick={enviar}>
              Enviar calificación
            </button>
            <p className="meta">
              En la versión real se pedirá iniciar sesión con el correo institucional
              (una calificación por usuario y restaurante).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.eh{--verde:#1f7a4d;--verde-osc:#14573a;--fondo:#f5f7f4;--tarjeta:#fff;--texto:#1d2a22;--suave:#5d6b62;--borde:#dfe5e0;
 font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--texto);background:var(--fondo);min-height:100vh;padding:20px 16px 40px;box-sizing:border-box}
.eh *{box-sizing:border-box}
.eh>*{max-width:1040px;margin-left:auto;margin-right:auto}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.top h1{margin:0;font-size:30px;letter-spacing:-.5px}
.top h1 span{color:var(--verde)}
.top p{margin:4px 0 0;color:var(--suave)}
.chip{background:#fff3cd;color:#7a5b00;border:1px solid #f0dc9a;border-radius:999px;padding:4px 12px;font-size:12px}
.controles{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;padding:14px;display:grid;gap:12px}
.controles input[type=search]{width:100%;padding:10px 12px;border:1px solid var(--borde);border-radius:10px;font-size:15px}
.orden{display:flex;flex-wrap:wrap;gap:8px}
.orden button,.si-no button{border:1px solid var(--borde);background:#fff;border-radius:999px;padding:7px 14px;font-size:14px;cursor:pointer;color:var(--texto)}
.orden button.activo,.si-no button.activo{background:var(--verde);border-color:var(--verde);color:#fff}
.rango{font-size:14px;color:var(--suave);display:grid;gap:6px}
.rango input{width:100%;accent-color:var(--verde)}
.resumen{color:var(--suave);font-size:14px;margin:14px auto 8px}
.rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.tarjeta{position:relative;background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;padding:16px;cursor:pointer;transition:box-shadow .15s,transform .15s}
.tarjeta:hover{box-shadow:0 6px 18px rgba(20,60,40,.12);transform:translateY(-2px)}
.tarjeta h2{margin:0 0 2px;font-size:18px}
.plato{margin:0 0 8px;color:var(--suave);font-size:14px}
.precio{margin:0 0 8px;font-weight:700;font-size:20px;color:var(--verde-osc)}
.fila{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.estrellas .on{color:#f2a900}.estrellas .off{color:#ccd3ce}
.porcion{display:grid;gap:3px;margin-bottom:8px}
.barra{height:8px;background:#e8eee9;border-radius:99px;overflow:hidden}
.barra div{height:100%;background:var(--verde)}
.meta{margin:0;color:var(--suave);font-size:13px}
small{color:var(--suave)}
.insignia{position:absolute;top:-10px;right:12px;background:var(--verde);color:#fff;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}
.aviso{display:inline-block;margin-top:8px;background:#eef1ee;color:var(--suave);border-radius:6px;padding:2px 8px;font-size:12px}
.vacio{grid-column:1/-1;text-align:center;color:var(--suave);padding:30px 0}
.fondo{position:fixed;inset:0;background:rgba(15,30,22,.5);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10}
.modal{position:relative;background:#fff;border-radius:16px;padding:22px;width:100%;max-width:460px;max-height:90vh;overflow:auto}
.modal h2{margin:0 0 4px}
.modal h3{margin:18px 0 8px;font-size:15px}
.cerrar{position:absolute;top:10px;right:12px;border:0;background:none;font-size:28px;cursor:pointer;color:var(--suave)}
.datos{list-style:none;padding:0;margin:8px 0;display:grid;gap:4px;font-size:14px}
blockquote{margin:0 0 8px;padding:8px 10px;background:var(--fondo);border-radius:8px;font-size:14px}
.pregunta{margin:10px 0 6px;font-size:14px}
.si-no{display:flex;gap:8px;margin-bottom:10px}
textarea{width:100%;border:1px solid var(--borde);border-radius:10px;padding:8px;font:inherit;resize:vertical}
.enviar{margin:10px 0;width:100%;border:0;background:var(--verde);color:#fff;border-radius:10px;padding:11px;font-size:15px;cursor:pointer}
.enviar:disabled{background:#b9c7be;cursor:not-allowed}
.ok{background:#e6f4ec;color:var(--verde-osc);padding:10px;border-radius:10px}
footer{margin-top:28px;text-align:center;color:var(--suave);font-size:12px}
`;
