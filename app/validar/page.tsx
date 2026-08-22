'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ValidadorPage() {
  const [validadorSesion, setValidadorSesion] = useState<any>(null);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [claveInput, setClaveInput] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{
    tipo: 'exito' | 'error';
    titulo: string;
    subtitulo: string;
    detalle?: string;
  } | null>(null);

  const procesandoRef = useRef(false);

  // Reproducir sonido + vibración al escanear
  const emitirAlerta = (tipo: 'exito' | 'error') => {
    // 1. VIBRACIÓN
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (tipo === 'exito') {
        // Vibración corta y positiva
        navigator.vibrate(200);
      } else {
        // Patrón de alerta fuerte e intermitente para error/ya usado
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    }

    // 2. AUDIO (Web Audio API)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === 'exito') {
        // Tono agudo y limpio (Verde)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Tono grave de alerta / error (Rojo)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.log('Error reproduciendo audio:', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultado(null);

    const { data, error } = await supabase
      .from('validadores')
      .select('*, eventos(*)')
      .eq('usuario', usuarioInput.trim().toLowerCase())
      .eq('clave', claveInput.trim())
      .maybeSingle();

    if (error || !data) {
      setResultado({
        tipo: 'error',
        titulo: 'ACCESO DENEGADO',
        subtitulo: 'Usuario o contraseña incorrectos.',
      });
      emitirAlerta('error');
      return;
    }

    setValidadorSesion(data);
    setResultado(null);
  };

  const procesarEntrada = async (codigo: string) => {
    if (procesandoRef.current || !validadorSesion) return;

    procesandoRef.current = true;
    setProcesando(true);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('evento_id', validadorSesion.evento_id)
      .eq('codigo_qr', codigo.trim())
      .maybeSingle();

    if (error || !ticket) {
      emitirAlerta('error');
      setResultado({
        tipo: 'error',
        titulo: '⛔ TICKET INVÁLIDO',
        subtitulo: 'El código QR no pertenece a este evento o no existe.',
      });
    } else if (ticket.ingresado) {
      emitirAlerta('error');
      const horaIngreso = ticket.fecha_ingreso 
        ? new Date(ticket.fecha_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Hora desconocida';

      setResultado({
        tipo: 'error',
        titulo: '⚠️ TICKET YA USADO',
        subtitulo: `Asistente: ${ticket.nombre_asistente}`,
        detalle: `Este pase ya ingresó previamente a las ${horaIngreso}.`,
      });
    } else {
      // Registrar ingreso
      const fechaActual = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('tickets')
        .update({
          ingresado: true,
          fecha_ingreso: fechaActual,
        })
        .eq('id', ticket.id);

      if (!updateErr) {
        emitirAlerta('exito');
        setResultado({
          tipo: 'exito',
          titulo: '✅ INGRESO PERMITIDO',
          subtitulo: ticket.nombre_asistente,
          detalle: `Pase validado exitosamente en ${validadorSesion.nombre_puerta}.`,
        });
        setCodigoManual('');
      } else {
        emitirAlerta('error');
        setResultado({
          tipo: 'error',
          titulo: '❌ ERROR DE CONEXIÓN',
          subtitulo: 'No se pudo actualizar el estado del ticket.',
        });
      }
    }

    // Pausa / congelado de 1.5 segundos antes de permitir un nuevo escaneo
    setTimeout(() => {
      setResultado(null);
      setProcesando(false);
      procesandoRef.current = false;
    }, 1500);
  };

  useEffect(() => {
    if (!validadorSesion) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        procesarEntrada(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [validadorSesion]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center justify-center font-sans">
      {!validadorSesion ? (
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-black text-emerald-400">VPASS Validador</h1>
            <p className="text-xs text-slate-400">Acceso exclusivo para personal de puerta</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Usuario</label>
              <input
                type="text"
                required
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={claveInput}
                onChange={(e) => setClaveInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs hover:bg-emerald-400 transition"
            >
              Iniciar Sesión
            </button>
          </form>

          {resultado && (
            <div className="p-3 bg-rose-950 text-rose-300 rounded-xl text-xs font-bold text-center border border-rose-800">
              {resultado.subtitulo}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-md w-full space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                {validadorSesion.nombre_puerta}
              </span>
              <h2 className="text-sm font-bold text-white">{validadorSesion.eventos?.nombre || 'Evento'}</h2>
            </div>
            <button
              onClick={() => setValidadorSesion(null)}
              className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Banner de resultado congelado (1.5s) */}
          {resultado && (
            <div
              className={`p-5 rounded-2xl text-center shadow-2xl transition-all duration-300 ${
                resultado.tipo === 'exito'
                  ? 'bg-emerald-500 text-slate-950 border-2 border-emerald-300'
                  : 'bg-rose-600 text-white border-2 border-rose-400 animate-bounce'
              }`}
            >
              <h3 className="text-base font-black uppercase tracking-wider">{resultado.titulo}</h3>
              <p className="text-sm font-extrabold mt-1">{resultado.subtitulo}</p>
              {resultado.detalle && (
                <p
                  className={`text-xs mt-2 font-medium ${
                    resultado.tipo === 'exito' ? 'text-slate-900' : 'text-rose-100'
                  }`}
                >
                  {resultado.detalle}
                </p>
              )}
            </div>
          )}

          {/* Scanner de Cámara */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 relative overflow-hidden shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase text-center">
              {procesando ? '⏳ Procesando...' : '📷 Escanear con Cámara'}
            </h3>
            <div
              id="reader"
              className={`overflow-hidden rounded-xl bg-slate-950 border border-slate-800 transition-opacity ${
                procesando ? 'opacity-30 pointer-events-none' : 'opacity-100'
              }`}
            ></div>
          </div>

          {/* Opción Manual */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Ingreso Manual de Código</h3>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={procesando}
                placeholder="Código (Ej: VPASS-ABC123)"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase"
              />
              <button
                disabled={procesando || !codigoManual.trim()}
                onClick={() => procesarEntrada(codigoManual)}
                className="bg-emerald-500 text-slate-950 font-bold px-4 rounded-xl text-xs hover:bg-emerald-400 disabled:opacity-50 transition"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}