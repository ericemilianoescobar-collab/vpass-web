'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function ValidarQR() {
  const router = useRouter();

  // Estado de Login de Puerta
  const [autenticado, setAutenticado] = useState(false);
  const [usuarioValidador, setUsuarioValidador] = useState('');
  const [passwordValidador, setPasswordValidador] = useState('');
  const [loginError, setLoginError] = useState('');
  const [infoPuerta, setInfoPuerta] = useState<any>(null);

  // Estados del Escáner
  const [codigoManual, setCodigoManual] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error' | 'usado' | 'anticipado'; texto: string } | null>(null);

  // Inicializar Escáner cuando el validador inicia sesión
  useEffect(() => {
    if (!autenticado) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        validarTicket(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch((err) => console.error('Error al limpiar el escáner:', err));
    };
  }, [autenticado]);

  // LOGIN PARA EL PERSONAL DE PUERTA
  const handleLoginValidador = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const { data: validador, error } = await supabase
      .from('validadores')
      .select('*')
      .eq('usuario', usuarioValidador.toLowerCase().trim())
      .eq('password', passwordValidador.trim())
      .maybeSingle();

    if (error || !validador) {
      setLoginError('Usuario o contraseña de puerta incorrectos.');
      return;
    }

    setInfoPuerta(validador);
    setAutenticado(true);
  };

  // LÓGICA DE VALIDACIÓN DE TICKETS
  const validarTicket = async (codigo: string) => {
    setLoading(true);
    setMensaje(null);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, eventos(nombre, fecha, hora)')
      .eq('codigo_qr', codigo.trim().toUpperCase())
      .single();

    if (error || !ticket) {
      setMensaje({ tipo: 'error', texto: 'Entrada no válida o código inexistente.' });
      setTicketData(null);
      setLoading(false);
      return;
    }

    setTicketData(ticket);

    const ahora = new Date();
    const fechaEventoStr = `${ticket.eventos?.fecha}T${ticket.eventos?.hora || '00:00:00'}`;
    const fechaHoraEvento = new Date(fechaEventoStr);

    if (ahora < fechaHoraEvento) {
      setMensaje({
        tipo: 'anticipado',
        texto: `ACCESO BLOQUEADO. El evento inicia el ${ticket.eventos?.fecha} a las ${ticket.eventos?.hora}.`,
      });
      setLoading(false);
      return;
    }

    if (ticket.ingresado) {
      setMensaje({
        tipo: 'usado',
        texto: `¡ADVERTENCIA! Entrada escaneada previamente el ${new Date(ticket.fecha_ingreso).toLocaleTimeString()}.`,
      });
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        ingresado: true,
        fecha_ingreso: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    if (!updateError) {
      setMensaje({
        tipo: 'exito',
        texto: '¡ACCESO CONCEDIDO! Bienvenido(a).',
      });
    } else {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el estado del ticket.' });
    }

    setLoading(false);
  };

  const handleValidarManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoManual.trim()) {
      validarTicket(codigoManual);
    }
  };

  // VISTA 1: FORMULARIO DE ACCESO DE PUERTA
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center mx-auto shadow-inner">
              <span className="text-base font-black text-emerald-400">VP</span>
            </div>
            <h2 className="text-base font-black text-white">Acceso a Validador de Puerta</h2>
            <p className="text-xs text-slate-400">Ingresa tus credenciales asignadas por el organizador.</p>
          </div>

          <form onSubmit={handleLoginValidador} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Usuario</label>
              <input
                type="text"
                required
                value={usuarioValidador}
                onChange={(e) => setUsuarioValidador(e.target.value)}
                placeholder="Ej: puerta1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                value={passwordValidador}
                onChange={(e) => setPasswordValidador(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 font-bold text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Iniciar Escáner
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ← Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // VISTA 2: CÁMARA Y ESCÁNER QR
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center font-sans">
      <header className="w-full max-w-md flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div>
          <span className="font-extrabold text-base text-white tracking-wider block">V-PASS VALIDATOR</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase">Punto: {infoPuerta?.nombre_puerta || 'Puerta'}</span>
        </div>
        <button 
          onClick={() => setAutenticado(false)} 
          className="text-slate-400 hover:text-rose-400 font-bold text-xs transition"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="w-full max-w-md space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-center">
          <h2 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Escáner de Cámara</h2>
          <div id="reader" className="overflow-hidden rounded-xl bg-slate-950"></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Validación Manual por Código</h2>
          <form onSubmit={handleValidarManual} className="flex gap-2">
            <input 
              type="text"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
              placeholder="Ej: VPASS-A1B2"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
            />
            <button 
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition"
            >
              Validar
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl text-center text-emerald-400 font-semibold text-sm animate-pulse">
            Verificando pase en la base de datos...
          </div>
        )}

        {mensaje && (
          <div
            className={`p-6 rounded-2xl border text-center transition shadow-2xl ${
              mensaje.tipo === 'exito'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                : mensaje.tipo === 'usado' || mensaje.tipo === 'anticipado'
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
            }`}
          >
            <div className="text-4xl mb-2">
              {mensaje.tipo === 'exito' ? '✅' : mensaje.tipo === 'error' ? '❌' : '⚠️'}
            </div>
            <h3 className="font-black text-base uppercase tracking-wide">{mensaje.texto}</h3>

            {ticketData && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-left text-xs space-y-1 text-slate-300">
                <p><span className="font-semibold text-slate-400">Asistente:</span> {ticketData.nombre_asistente}</p>
                <p><span className="font-semibold text-slate-400">Evento:</span> {ticketData.eventos?.nombre}</p>
                <p><span className="font-semibold text-slate-400">Código:</span> <span className="font-mono text-emerald-400">{ticketData.codigo_qr}</span></p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}