'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NuevoEvento() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [planSeleccionado, setPlanSeleccionado] = useState<'basico' | 'estandar' | 'premium'>('basico');
  const [perfil, setPerfil] = useState<any>(null);
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

      const { data: userPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userPerfil) {
        setPerfil(userPerfil);
        if (userPerfil.plan_basico_cant > 0) setPlanSeleccionado('basico');
        else if (userPerfil.plan_estandar_cant > 0) setPlanSeleccionado('estandar');
        else if (userPerfil.plan_premium_cant > 0) setPlanSeleccionado('premium');
      }
      setCargando(false);
    };

    cargarPerfil();
  }, [router]);

  const limitesPlan = {
    basico: { capacidad: 150, validadores: 1, label: 'Plan Básico' },
    estandar: { capacidad: 300, validadores: 2, label: 'Plan Estándar' },
    premium: { capacidad: 500, validadores: 5, label: 'Plan Premium' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const campoCant = `plan_${planSeleccionado}_cant`;
    if (!perfil || (perfil[campoCant] ?? 0) <= 0) {
      alert(`No tienes saldo disponible en el ${limitesPlan[planSeleccionado].label}.`);
      return;
    }

    setGuardando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const limiteActual = limitesPlan[planSeleccionado];

      // 1. Insertar Evento
      const { error: errEv } = await supabase.from('eventos').insert([
        {
          usuario_id: session.user.id,
          nombre,
          fecha,
          hora,
          capacidad: limiteActual.capacidad,
          plan_utilizado: limiteActual.label,
          validadores_permitidos: limiteActual.validadores
        },
      ]);

      if (errEv) throw errEv;

      // 2. Descontar plan de la cuenta
      const nuevoSaldo = perfil[campoCant] - 1;
      const { error: errPerfil } = await supabase
        .from('perfiles')
        .update({ [campoCant]: nuevoSaldo })
        .eq('id', session.user.id);

      if (errPerfil) throw errPerfil;

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error al guardar evento.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 text-xs font-bold">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <span className="text-[10px] font-bold text-cyan-400">VP</span>
              </div>
              <h1 className="text-lg font-bold text-white">Configurar Nuevo Evento</h1>
            </div>
            <p className="text-xs text-slate-400">Ingresa la información básica de tu fiesta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Selección del Plan a Consumir */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Seleccionar Plan a Consumir</label>
            <select
              value={planSeleccionado}
              onChange={(e) => setPlanSeleccionado(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="basico">Plan Básico ({perfil?.plan_basico_cant ?? 0} disp. - Max 150 pases / 1 Validador)</option>
              <option value="estandar">Plan Estándar ({perfil?.plan_estandar_cant ?? 0} disp. - Max 300 pases / 2 Validadores)</option>
              <option value="premium">Plan Premium ({perfil?.plan_premium_cant ?? 0} disp. - Max 500 pases / 5 Validadores)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Evento</label>
            <input
              type="text"
              required
              placeholder="Ej: Neon Party VIP"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Hora de inicio</label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Límites del evento</p>
            <p className="text-xs font-extrabold text-cyan-400">
              {limitesPlan[planSeleccionado].capacidad} Entradas | {limitesPlan[planSeleccionado].validadores} Acceso(s) Validador
            </p>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
          >
            {guardando ? 'Guardando...' : 'Publicar Evento'}
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