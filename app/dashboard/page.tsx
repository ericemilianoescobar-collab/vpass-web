'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [usuario, setUsuario] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    comprobarYSincronizar();
  }, []);

  const comprobarYSincronizar = async () => {
    try {
      // 1. Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Si no hay sesión comprobada, redirigir
        router.replace('/login');
        return;
      }

      const user = session.user;

      // 2. Cargar perfil (si falla la BD, usamos los datos del Auth de respaldo para no rebotar)
      let { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!perfil) {
        perfil = { id: user.id, email: user.email, monedas: 50 };
      }

      setUsuario(perfil);

      // 3. Cargar eventos del usuario
      const { data: evs } = await supabase
        .from('eventos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      setEventos(evs || []);
    } catch (e) {
      console.error('Error cargando Dashboard:', e);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-100">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-amber-400">Cargando Panel V-PASS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Cabecera V-PASS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xs">
                VP
              </div>
              <h1 className="text-lg font-bold text-white">Panel de Control V-PASS</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Usuario: {usuario?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-amber-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-amber-400 font-extrabold text-sm">🪙 {usuario?.monedas ?? 50}</span>
              <span className="text-xs text-slate-400">Monedas</span>
            </div>

            <button
              onClick={() => {
                const mensaje = encodeURIComponent(`¡Hola V-PASS! 👋 Mi usuario es ${usuario?.email} y deseo adquirir más monedas.`);
                window.open(`https://wa.me/51987654321?text=${mensaje}`, '_blank');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1"
            >
              💬 Recargar
            </button>

            <button
              onClick={cerrarSesion}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Mis Eventos Activos</h2>
          <button
            onClick={() => router.push('/nuevo-evento')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/10"
          >
            + Crear Evento
          </button>
        </div>

        {/* Lista de Eventos */}
        {eventos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <p className="text-xs text-slate-400">Aún no has creado ningún evento en V-PASS.</p>
            <button
              onClick={() => router.push('/nuevo-evento')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs border border-amber-500/20"
            >
              Crear tu primer evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos.map((ev) => (
              <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{ev.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-1">📅 {ev.fecha} — ⏰ {ev.hora || '20:00'}</p>
                  <p className="text-xs text-slate-400">🎟️ Capacidad: {ev.capacidad} pases</p>
                </div>
                <button
                  onClick={() => router.push(`/evento/${ev.id}`)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2 rounded-xl text-xs border border-slate-700 transition text-center"
                >
                  Administrar Evento →
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}