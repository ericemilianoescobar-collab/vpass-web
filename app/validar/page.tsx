'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ValidadorPage() {
  const [validadorSesion, setValidadorSesion] = useState<any>(null);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [claveInput, setClaveInput] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    const { data, error } = await supabase
      .from('validadores')
      .select('*, eventos(*)')
      .eq('usuario', usuarioInput.trim().toLowerCase())
      .eq('clave', claveInput.trim())
      .maybeSingle();

    if (error || !data) {
      setMensaje({ tipo: 'error', texto: 'Usuario o contraseña incorrectos.' });
      return;
    }

    setValidadorSesion(data);
    setMensaje({ tipo: 'exito', texto: `¡Bienvenido ${data.nombre_puerta}!` });
  };

  const procesarEntrada = async (codigo: string) => {
    if (!validadorSesion) return;

    setMensaje({ tipo: 'info', texto: 'Verificando ticket...' });

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('evento_id', validadorSesion.evento_id)
      .eq('codigo_qr', codigo.trim())
      .maybeSingle();

    if (error || !ticket) {
      setMensaje({ tipo: 'error', texto: '❌ TICKET INVÁLIDO O NO EXISTE.' });
      return;
    }

    if (ticket.ingresado) {
      setMensaje({ tipo: 'error', texto: `⚠️ TICKET YA USADO por ${ticket.nombre_asistente}` });
      return;
    }

    const { error: updateErr } = await supabase
      .from('tickets')
      .update({
        ingresado: true,
        fecha_ingreso: new Date().toISOString()
      })
      .eq('id', ticket.id);

    if (!updateErr) {
      setMensaje({ tipo: 'exito', texto: `✅ INGRESO PERMITIDO: ${ticket.nombre_asistente}` });
      setCodigoManual('');
    } else {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar ticket.' });
    }
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
              className="w-full bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs"
            >
              Iniciar Sesión
            </button>
          </form>

          {mensaje && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center ${
              mensaje.tipo === 'error' ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
            }`}>
              {mensaje.texto}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-md w-full space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">{validadorSesion.nombre_puerta}</span>
              <h2 className="text-sm font-bold">{validadorSesion.eventos?.nombre || 'Evento'}</h2>
            </div>
            <button
              onClick={() => setValidadorSesion(null)}
              className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400"
            >
              Cerrar Sesión
            </button>
          </div>

          {mensaje && (
            <div className={`p-4 rounded-2xl text-xs font-black text-center shadow-lg ${
              mensaje.tipo === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
            }`}>
              {mensaje.texto}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase text-center">Escanear con Cámara</h3>
            <div id="reader" className="overflow-hidden rounded-xl bg-slate-950 border border-slate-800"></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Validación Manual</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código (Ej: VPASS-ABC123)"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
              />
              <button
                onClick={() => procesarEntrada(codigoManual)}
                className="bg-emerald-500 text-slate-950 font-bold px-4 rounded-xl text-xs"
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