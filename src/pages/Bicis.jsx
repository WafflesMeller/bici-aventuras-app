import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import {
  Bike,
  Trash2,
  AlertCircle,
  PlayCircle,
  Plus,
  CheckCircle2,
  User,
  X,
  PauseCircle,
  CircleX,
  CirclePlay,
  BikeIcon,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { showSuccess } from "../components/Notifications";
import { supabase } from "../supabase/client";

const BICIS_ORIGINALES = [
  "Consentida",
  "Mini Gaby",
  "Gaby",
  "#1",
  "#2",
  "#3",
  "#4",
  "#5",
  "#6",
  "#7",
  "#8",
  "#9",
  "#10",
  "#11",
  "#12",
  "#13",
];

// --- UTILIDAD DE SONIDO CASIO (Tu versión ajustada) ---
const playCasioBurst = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const playSingleBeep = (time) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "square";
    osc.frequency.setValueAtTime(2800, time);
    filter.type = "highpass";
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(2.0, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  };

  const playBurst = (startTime) => {
    const gap = 0.08;
    playSingleBeep(startTime);
    playSingleBeep(startTime + gap);
    playSingleBeep(startTime + gap * 2);
    playSingleBeep(startTime + gap * 3);
    return startTime + gap * 3 + 0.05;
  };

  const pauseBetweenGroups = 0.15;
  let nextStart = playBurst(now);
  nextStart = playBurst(nextStart + pauseBetweenGroups);
};

// --- COMPONENTE MODAL (Sin cambios) ---
const ModalSeleccionCliente = ({ isOpen, onClose, onConfirm, bikeName }) => {
  const [ventasDisponibles, setVentasDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchVentasConCupos();
  }, [isOpen]);

  const fetchVentasConCupos = async () => {
    setLoading(true);
    const now = new Date();
    const hace12h = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();

    const { data: ventas } = await supabase
      .from("ventas-biciaventuras")
      .select(
        "id, nombre_cliente, tiempo_alquiler, created_at, cantidad_bicicletas"
      )
      .eq("pagado", true)
      .gte("created_at", hace12h)
      .order("created_at", { ascending: false });

    if (!ventas) {
      setVentasDisponibles([]);
      setLoading(false);
      return;
    }

    const ventasIds = ventas.map((v) => v.id);
    const { data: usos } = await supabase
      .from("pista_biciaventuras")
      .select("venta_id")
      .in("venta_id", ventasIds);

    const ventasFiltradas = ventas
      .map((venta) => {
        const totalComprados = venta.cantidad_bicicletas || 1;
        const totalUsados = usos
          ? usos.filter((u) => u.venta_id === venta.id).length
          : 0;
        return { ...venta, cupos_restantes: totalComprados - totalUsados };
      })
      .filter((v) => v.cupos_restantes > 0);

    setVentasDisponibles(ventasFiltradas);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">
            Configurar {bikeName}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center text-primary py-4">
              Buscando cupos...
            </div>
          ) : ventasDisponibles.length === 0 ? (
            <div className="text-center text-white/30 py-4">
              Sin clientes con cupos
            </div>
          ) : (
            ventasDisponibles.map((venta) => (
              <button
                key={venta.id}
                onClick={() => onConfirm(venta.tiempo_alquiler, venta)}
                className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/50 p-3 rounded-xl transition-all group"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white group-hover:text-primary">
                    {venta.nombre_cliente}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">
                      {venta.tiempo_alquiler}
                    </span>
                    <span className="text-[10px] text-green-400 font-bold mt-1">
                      {venta.cupos_restantes} cupo(s)
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 grid grid-cols-2 gap-2">
          <button
            onClick={() => onConfirm("10 min", null)}
            className="py-2 bg-white/5 hover:bg-primary hover:text-black rounded-lg text-xs font-bold border border-white/10 transition-colors"
          >
            10 Min (Libre)
          </button>
          <button
            onClick={() => onConfirm("20 min", null)}
            className="py-2 bg-white/5 hover:bg-primary hover:text-black rounded-lg text-xs font-bold border border-white/10 transition-colors"
          >
            20 Min (Libre)
          </button>
        </div>
      </div>
    </div>
  );
};

// --- TARJETA INTELIGENTE ---
const BiciCard = ({
  bici,
  info,
  preData,
  now,
  onAbrirModal,
  onIniciarReal,
  onCancelarPre,
  onTerminar,
  onAgregar,
  onTogglePausa,
}) => {
  const ocupada = !!info;
  const preseleccionada = !!preData;
  const pausada = info?.estado === "pausado";

  const fechaFin = ocupada ? new Date(info.fin).getTime() : 0;
  const fechaInicio = ocupada ? new Date(info.inicio).getTime() : 0;

  const tiempoRestanteMs = pausada ? info.pausa_restante : fechaFin - now;
  const tiempoAgotado = ocupada && !pausada && tiempoRestanteMs <= 0;

  // Alarma CASIO
  useEffect(() => {
    let intervalId = null;
    if (tiempoAgotado) {
      playCasioBurst();
      intervalId = setInterval(() => {
        playCasioBurst();
      }, 2500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tiempoAgotado]);

  const formatoTiempo = (ms) => {
    if (ms <= 0) return "00:00";
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const progreso =
    ocupada && !tiempoAgotado && !pausada
      ? Math.max(0, (now - fechaInicio) / (fechaFin - fechaInicio))
      : 0;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 backdrop-blur-xl
      ${
        preseleccionada
          ? "bg-primary/5 border border-primary"
          : !ocupada
          ? "bg-white/5 border border-white/10"
          : pausada
          ? "bg-yellow-500/10 border border-yellow-500/50"
          : tiempoAgotado
          ? "bg-red-950/80 border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"
          : "border border-primary shadow-[0_0_10px_rgba(0,255,127,0.15)]"
      }`}
    >
      {/* Barra de Progreso */}
      {ocupada && !tiempoAgotado && !pausada && (
        <div
          className="absolute inset-0 bg-primary/20 z-0 origin-left transition-transform duration-1000 ease-linear pointer-events-none"
          style={{ transform: `scaleX(${progreso})` }}
        />
      )}

      <div className="relative z-10 p-2.5">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-full ${
                ocupada
                  ? tiempoAgotado
                    ? "bg-red-500 text-black"
                    : pausada
                    ? "bg-yellow-500 text-black"
                    : "bg-primary text-black"
                  : preseleccionada
                  ? "bg-primary text-black"
                  : "bg-white/15 text-white/50"
              }`}
            >
              {tiempoAgotado ? (
                <AlertCircle size={14} strokeWidth={3} />
              ) : (
                <Bike size={14} strokeWidth={2.5} />
              )}
            </div>
            <div>
              <span
                className={`block font-black text-base uppercase leading-none ${
                  ocupada || preseleccionada ? "text-white" : "text-white/80"
                }`}
              >
                {bici}
              </span>
              {(info?.cliente_nombre || preData?.cliente_nombre) && (
                <span className="text-[10px] text-white/70 flex items-center gap-1 mt-0.5">
                  <User size={8} />{" "}
                  {info?.cliente_nombre || preData?.cliente_nombre}
                </span>
              )}
            </div>
          </div>

          {ocupada && !tiempoAgotado && (
            <button
              onClick={() => onTerminar(info.id)}
              className="p-2 -mr-1 -mt-1 text-white/80 hover:text-white hover:bg-red-500/60 bg-white/20 rounded-full transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* BODY */}
        <div>
          {/* CASO 1: LIBRE */}
          {!ocupada && !preseleccionada && (
            <button
              onClick={() => onAbrirModal(bici)}
              className="w-full py-3 mt-2 bg-white/5 hover:bg-primary/15 active:bg-primary active:text-black rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-xl"
            >
              <CheckCircle2 size={16} /> SELECCIONAR
            </button>
          )}

          {/* CASO 2: PRE-SELECCIONADA */}
          {preseleccionada && (
            <div className="mt-2 animate-fade-in">
              <div className="text-center mb-2">
                <span className="text-3xl font-mono font-black text-primary/50 capitalize">
                  {preData.tiempoTexto}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onIniciarReal(bici)}
                  className="flex-2 py-2 bg-primary text-black rounded-2xl text-xs font-bold hover:brightness-110 flex items-center justify-center gap-1"
                >
                  <CirclePlay size={14} /> INICIAR
                </button>

                <button
                  onClick={() => onCancelarPre(bici)}
                  className="flex-2 flex items-center justify-center py-2 gap-1 bg-red-500/20 text-red-500 rounded-2xl text-xs font-bold hover:bg-red-500/30"
                >
                  <CircleX size={14} /> CANCELAR
                </button>
              </div>
            </div>
          )}

          {/* CASO 3: OCUPADA */}
          {ocupada && (
            <div className="text-center pt-1">
              {tiempoAgotado ? (
                // 1. SI EL TIEMPO FINALIZÓ: Mostramos tu mensaje
                <div className="text-red-400 text-sm font-bold uppercase tracking-widest mb-2 animate-pulse">
                  ¡TIEMPO FINALIZADO!
                </div>
              ) : (
                // 2. SI AÚN HAY TIEMPO: Mostramos el reloj normal
                <div
                  className={`text-3xl font-mono font-black tracking-tighter mb-2 drop-shadow-md transition-colors 
                  ${pausada ? "text-yellow-400" : "text-white"}`}
                >
                  {pausada ? "PAUSA" : formatoTiempo(tiempoRestanteMs)}
                </div>
              )}

              {pausada && (
                <div className="text-xs text-yellow-400/70 font-mono mb-2">
                  Restan: {formatoTiempo(tiempoRestanteMs)}
                </div>
              )}

              {tiempoAgotado ? (
                <div className="space-y-2 animate-fade-in">
                  <button
                    onClick={() => onTerminar(info.id)}
                    className="w-full py-2 bg-red-500 hover:bg-red-400 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all transform duration-300 flex items-center justify-center gap-2"
                  >
                    <BikeIcon size={16} /> RECIBIR BICI
                  </button>
                  <button
                    onClick={() => onAgregar(info.id, fechaFin, 5)}
                    className="w-full py-2 bg-black/40 text-white/50 hover:text-white rounded-2xl text-[10px] font-bold flex justify-center items-center gap-1"
                  >
                    <Plus size={10} /> 5 min
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onTogglePausa(info)}
                    className={`flex-2 py-2 rounded-2xl text-[10px] font-bold flex justify-center items-center gap-1 border transition-all
                        ${
                          pausada
                            ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                        }`}
                  >
                    {pausada ? (
                      <>
                        <PlayCircle size={12} /> REANUDAR
                      </>
                    ) : (
                      <>
                        <PauseCircle size={12} /> PAUSAR
                      </>
                    )}
                  </button>

                  {!pausada && (
                    <button
                      onClick={() => onAgregar(info.id, fechaFin, 5)}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl text-[10px] font-bold flex justify-center items-center gap-1 border border-white/5"
                    >
                      <Plus size={10} /> 5 min
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function BicisPage() {
  const [pistaData, setPistaData] = useState([]);
  const [preSelecciones, setPreSelecciones] = useState({});
  const [now, setNow] = useState(Date.now());

  const [modalOpen, setModalOpen] = useState(false);
  const [biciEnModal, setBiciEnModal] = useState(null);

  // --- CARGA DE DATOS & REALTIME ---
  const fetchPista = async () => {
    const { data } = await supabase
      .from("pista_biciaventuras")
      .select("*")
      .in("estado", ["en_curso", "pausado"]);
    if (data) setPistaData(data);
  };

  useEffect(() => {
    // 1. Carga inicial
    fetchPista();

    // 2. Reloj local (para actualizar el contador cada segundo)
    const interval = setInterval(() => setNow(Date.now()), 1000);

    // 3. Suscripción a Realtime
    const channel = supabase
      .channel("pista-realtime-sub") // Nombre único para el canal
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar TODO: INSERT, UPDATE, DELETE
          schema: "public",
          table: "pista_biciaventuras",
        },
        (payload) => {
          console.log("Cambio en Bicis detectado:", payload);
          // Cuando algo cambie, recargamos los datos para estar sincronizados
          fetchPista();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("🟢 Realtime conectado a pista_biciaventuras");
        }
      });

    // Limpieza al desmontar
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);
  // ---------------------------------

  const parseDuracion = (texto) => {
    if (!texto) return 0;
    const numero = parseInt(texto.match(/\d+/)?.[0] || 0);
    if (texto.toLowerCase().includes("hora")) return numero * 60;
    return numero;
  };

  const handleAbrirModal = (biciNombre) => {
    setBiciEnModal(biciNombre);
    setModalOpen(true);
  };

  const handlePreseleccionar = (tiempoTexto, ventaObj) => {
    setModalOpen(false);
    setPreSelecciones((prev) => ({
      ...prev,
      [biciEnModal]: {
        tiempoTexto,
        minutos: parseDuracion(tiempoTexto),
        ventaObj,
        cliente_nombre: ventaObj ? ventaObj.nombre_cliente : "Cliente Casual",
      },
    }));
  };

  const handleCancelarPre = (bici) => {
    setPreSelecciones((prev) => {
      const copy = { ...prev };
      delete copy[bici];
      return copy;
    });
  };

  const handleIniciarReal = async (bici) => {
    const preData = preSelecciones[bici];
    if (!preData) return;

    const inicio = new Date();
    const fin = new Date(inicio.getTime() + preData.minutos * 60 * 1000);

    const nuevaEntradaOptimista = {
      id: `temp-${Date.now()}`,
      bicicleta: bici,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: "en_curso",
      venta_id: preData.ventaObj ? preData.ventaObj.id : null,
      cliente_nombre: preData.cliente_nombre,
    };

    setPreSelecciones((prev) => {
      const copy = { ...prev };
      delete copy[bici];
      return copy;
    });

    // Actualizamos UI inmediatamente (Optimista)
    // Cuando el Realtime detecte el INSERT, esto se reemplazará con el dato real del servidor
    setPistaData((prev) => [...prev, nuevaEntradaOptimista]);

    showSuccess(`${bici} iniciada`, "success");

    const { error } = await supabase.from("pista_biciaventuras").insert([
      {
        bicicleta: nuevaEntradaOptimista.bicicleta,
        inicio: nuevaEntradaOptimista.inicio,
        fin: nuevaEntradaOptimista.fin,
        estado: nuevaEntradaOptimista.estado,
        venta_id: nuevaEntradaOptimista.venta_id,
        cliente_nombre: nuevaEntradaOptimista.cliente_nombre,
      },
    ]);

    if (error) {
      console.error(error);
      fetchPista(); // Si falla, recargamos para borrar el optimista
    }
  };

  const handleTogglePausa = async (info) => {
    if (info.estado === "en_curso") {
      const fin = new Date(info.fin).getTime();
      const restante = fin - Date.now();

      // Optimista
      setPistaData((prev) =>
        prev.map((item) =>
          item.id === info.id
            ? { ...item, estado: "pausado", pausa_restante: restante }
            : item
        )
      );

      await supabase
        .from("pista_biciaventuras")
        .update({
          estado: "pausado",
          pausa_restante: restante,
        })
        .eq("id", info.id);
    } else {
      const restante = info.pausa_restante || 0;
      const nuevoFin = new Date(Date.now() + restante).toISOString();

      // Optimista
      setPistaData((prev) =>
        prev.map((item) =>
          item.id === info.id
            ? {
                ...item,
                estado: "en_curso",
                fin: nuevoFin,
                pausa_restante: null,
              }
            : item
        )
      );

      await supabase
        .from("pista_biciaventuras")
        .update({
          estado: "en_curso",
          fin: nuevoFin,
          pausa_restante: null,
        })
        .eq("id", info.id);
    }
  };

  const handleTerminar = async (idRegistro) => {
    // Optimista: quitamos de pantalla
    setPistaData((prev) => prev.filter((item) => item.id !== idRegistro));
    showSuccess("Bicicleta liberada", "info");
    await supabase
      .from("pista_biciaventuras")
      .update({ estado: "finalizado" })
      .eq("id", idRegistro);
  };

  const handleAgregarTiempo = async (
    idRegistro,
    fechaFinActual,
    minutosExtra
  ) => {
    const nuevoFinMs = fechaFinActual + minutosExtra * 60 * 1000;
    const nuevoFinISO = new Date(nuevoFinMs).toISOString();

    setPistaData((prev) =>
      prev.map((item) =>
        item.id === idRegistro ? { ...item, fin: nuevoFinISO } : item
      )
    );
    showSuccess(`+${minutosExtra} min`, "success");
    await supabase
      .from("pista_biciaventuras")
      .update({ fin: nuevoFinISO })
      .eq("id", idRegistro);
  };

  const { enPista, disponibles } = useMemo(() => {
    const activeMap = {};
    pistaData.forEach((item) => {
      activeMap[item.bicicleta] = item;
    });

    const pista = [];
    const disp = [];

    BICIS_ORIGINALES.forEach((bici) => {
      if (activeMap[bici]) {
        pista.push({ nombre: bici, data: activeMap[bici], preData: null });
      } else if (preSelecciones[bici]) {
        pista.push({ nombre: bici, data: null, preData: preSelecciones[bici] });
      } else {
        disp.push(bici);
      }
    });

    pista.sort((a, b) => {
      if (a.data && !b.data) return -1;
      if (!a.data && b.data) return 1;
      if (a.data && b.data) return new Date(a.data.fin) - new Date(b.data.fin);
      return 0;
    });

    return { enPista: pista, disponibles: disp };
  }, [pistaData, preSelecciones]);

  return (
    <div className="min-h-screen text-white pb-5">
      <Navbar />
      <Toaster position="top-center" />
      <ModalSeleccionCliente
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handlePreseleccionar}
        bikeName={biciEnModal}
      />

      <div className="pt-20 sticky top-0 z-40 backdrop-blur-xl ">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-xl font-black text-primary uppercase italic tracking-tighter">
            Alquiler
          </h1>
        </div>
      </div>

      <div className="px-4 max-w-7xl mx-auto space-y-8 pt-5">
        {enPista.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 py-3 px-6 -mx-4 text-primary border border-white/10 bg-white/5 backdrop-blur-xl">
              <PlayCircle size={16} />
              <h2 className="text-xs font-black uppercase tracking-widest">
                En la Pista #{enPista.length}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {enPista.map((item) => (
                <BiciCard
                  key={item.nombre}
                  bici={item.nombre}
                  info={item.data}
                  preData={item.preData}
                  now={now}
                  onTerminar={handleTerminar}
                  onAgregar={handleAgregarTiempo}
                  onTogglePausa={handleTogglePausa}
                  onIniciarReal={handleIniciarReal}
                  onCancelarPre={handleCancelarPre}
                  onAbrirModal={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 animate-fade-in">
          {/* BARRA DIVISORIA FULL WIDTH */}
          <div className="flex items-center gap-2 py-3 px-6 -mx-4 text-white/80 border border-white/10 bg-white/5 backdrop-blur-xl">
            <CheckCircle2 size={16} />
            <h2 className="text-sm font-black uppercase tracking-widest">
              Disponibles #{disponibles.length}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disponibles.map((bici) => (
              <BiciCard
                key={bici}
                bici={bici}
                info={null}
                preData={null}
                now={now}
                onAbrirModal={handleAbrirModal}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
