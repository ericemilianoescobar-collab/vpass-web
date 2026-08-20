'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoEvento() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [capacidad, setCapacidad] = useState(100);
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const COSTO_EVENTO = 200; // Costo por evento
  const router = useRouter();

  useEffect(() => {
    verificarUsuario();
  }, []);

  const verificarUsuario = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    const user = session.user;

    let { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!perfil) {
      perfil = { id: user.id, email: user.email, monedas: 200 };
    }

    setUsuario(perfil);
  };

  const handleCrearEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const monedasActuales = usuario?.monedas ?? 0;

    if (monedasActuales < COSTO_EVENTO) {
      setErrorMsg(`Saldo insuficiente. Necesitas ${COSTO_EVENTO} monedas para publicar un evento (tienes ${monedasActuales}).`);
      return;
    }

    setCargando(true);

    try {
      const { data: eventoCreado, error: errEvento } = await supabase
        .from('eventos')
        .insert([
          {
            usuario_id: usuario.id,
            nombre,
            fecha,
            hora: hora || '20:00',
            capacidad: Number(capacidad),
          },
        ])
        .select()
        .single();

      if (errEvento) {
        throw new Error(errEvento.message);
      }

      const nuevoSaldo = monedasActuales - COSTO_EVENTO;
      await supabase
        .from('perfiles')
        .update({ monedas: nuevoSaldo })
        .eq('id', usuario.id);

      router.replace('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al intentar publicar el evento.');
      setCargando(false);
    }
  };

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold text-xs">
        Cargando formulario V-PASS...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-extrabold text-white">Crear Nuevo Evento</h1>
            <p className="text-xs text-slate-400">Publica tu flyer y genera tus accesos QR</p>
          </div>
          <div className="bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400">
            🪙 {usuario?.monedas ?? 0}
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCrearEvento} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Nombre del Evento / Fiesta</label>
            <input
              type="text"
              required
              placeholder="Ej: Neon Party VIP"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hora de inicio</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Capacidad Estimada (Pases VIP)</label>
            <input
              type="number"
              min="10"
              required
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
            <p className="text-slate-400">Costo de publicación:</p>
            <p className="text-base font-extrabold text-amber-400">🪙 {COSTO_EVENTO} Monedas V-PASS</p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            {cargando ? 'Publicando Evento...' : 'Confirmar y Publicar Evento'}
          </button>
        </form>

        <div className="text-center pt-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ← Cancelar y volver al Panel
          </button>
        </div>

      </div>
    </div>
  );
}