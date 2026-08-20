'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

export default function ValidarQR() {
  const [codigoManual, setCodigoManual] = useState('');
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error' | 'usado' | 'anticipado'; texto: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
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
  }, []);

  const validarTicket = async (codigo: string) => {
    setLoading(true);
    setMensaje(null);

    // 1. Buscar ticket y la info de fecha/hora de su evento
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

    // 2. Control estricto de Horario
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

    // 3. Control de Reingreso (Ya usado)
    if (ticket.ingresado) {
      setMensaje({
        tipo: 'usado',
        texto: `¡ADVERTENCIA! Entrada escaneada previamente el ${new Date(ticket.fecha_ingreso).toLocaleTimeString()}.`,
      });
      setLoading(false);
      return;
    }

    // 4. Marcar como ingresado oficialmente
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-md flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="text-amber-400 hover:text-amber-300 font-bold text-xs"
        >
          ← Volver al Panel
        </button>
        <span className="font-extrabold text-base text-white tracking-wider">V-PASS VALIDATOR</span>
      </header>

      <main className="w-full max-w-md space-y-6">
        {/* Lector de Cámara */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-center">
          <h2 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Escáner de Cámara</h2>
          <div id="reader" className="overflow-hidden rounded-xl bg-slate-950"></div>
        </div>

        {/* Búsqueda Manual por Código */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Validación Manual por Código</h2>
          <form onSubmit={handleValidarManual} className="flex gap-2">
            <input 
              type="text"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
              placeholder="Ej: VPASS-A1B2"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-500"
            />
            <button 
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition"
            >
              Validar
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl text-center text-amber-400 font-semibold text-sm">
            Verificando pase en la base de datos...
          </div>
        )}

        {/* Resultado de la Verificación */}
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
                <p><span className="font-semibold text-slate-400">Código:</span> <span className="font-mono text-amber-400">{ticketData.codigo_qr}</span></p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}