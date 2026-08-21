'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoEvento() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [capacidad, setCapacidad] = useState(150);
  const [eventosDisponibles, setEventosDisponibles] = useState<number>(0);
  const [planNombre, setPlanNombre] = useState<string>('Sin Plan Activo');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('eventos_disponibles, plan_nombre')
        .eq('id', session.user.id)
        .maybeSingle();

      if (perfil) {
        setEventosDisponibles(perfil.eventos_disponibles ?? 0);
        setPlanNombre(perfil.plan_nombre || 'Sin Plan Activo');
      }
      setCargando(false);
    };

    cargarPerfil();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (eventosDisponibles <= 0) {
      alert('No tienes eventos disponibles en tu plan. Por favor adquiere un plan por WhatsApp.');
      return;
    }

    setGuardando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Crear el evento
      const { error: errorEvento } = await supabase.from('eventos').insert([
        {
          usuario_id: session.user.id,
          nombre,
          fecha,
          hora,
          capacidad,
        },
      ]);

      if (errorEvento) throw errorEvento;

      // 2. Descontar 1 evento disponible del usuario
      const { error: errorPerfil } = await supabase
        .from('perfiles')
        .update({ eventos_disponibles: eventosDisponibles - 1 })
        .eq('id', session.user.id);

      if (errorPerfil) throw errorPerfil;

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al crear el evento.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 text-xs font-bold">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        
        {/* Cabecera con Logo e Indicador de Plan */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="V-PASS Logo" className="w-7 h-7 object-contain" />
              <h1 className="text-xl font-bold text-white">Crear Nuevo Evento</h1>
            </div>
            <p className="text-xs text-slate-400">Publica tu flyer y genera tus accesos QR</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <p className="text-[9px] text-slate-500 font-bold uppercase">Plan: {planNombre}</p>
            <p className={`text-xs font-black ${eventosDisponibles > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              {eventosDisponibles} Disponible(s)
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Evento / Fiesta</label>
            <input
              type="text"
              required
              placeholder="Ej: Neon Party VIP"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Hora de inicio</label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Capacidad Estimada (Pases VIP)</label>
            <input
              type="number"
              required
              value={capacidad}
              onChange={(e) => setCapacidad(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-1">
            <p className="text-xs text-slate-400">Consumo al publicar:</p>
            <p className="text-sm font-extrabold text-amber-400">1 Crédito de Evento</p>
          </div>

          <button
            type="submit"
            disabled={guardando || eventosDisponibles <= 0}
            className={`w-full py-3 rounded-xl font-extrabold text-xs transition ${
              eventosDisponibles > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {guardando ? 'Publicando...' : 'Confirmar y Publicar Evento'}
          </button>
        </form>

        <div className="text-center">
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