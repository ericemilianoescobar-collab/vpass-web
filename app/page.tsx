'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PerfilUsuario {
  id: string;
  email: string | undefined;
  monedas: number;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  hora?: string;
  capacidad: number;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const comprobarYSincronizar = async () => {
      try {
        // 1. Verificar sesión activa
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        const user = session.user;

        // 2. Cargar perfil del usuario
        let { data: perfil } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!perfil) {
          perfil = { id: user.id, email: user.email, monedas: 50 };
        }

        if (isMounted) {
          setUsuario(perfil);
        }

        // 3. Cargar eventos asociados
        const { data: evs } = await supabase
          .from('eventos')
          .select('*')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted) {
          setEventos(evs || []);
        }
      } catch (e) {
        console.error('Error al sincronizar el Dashboard:', e);
      } finally {
        if (isMounted) {
          setCargando(false);
        }
      }
    };

    comprobarYSincronizar();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const solicitarRecarga = () => {
    const email = usuario?.email ?? 'usuario';
    const textoMensaje = `¡Hola equipo de V-PASS! 👋\n\nSolicito información para recargar monedas en mi cuenta.\n📌 *Usuario:* ${email}\n\nQuedo a la espera de los métodos de pago. ¡Gracias!`;
    const urlWhatsApp = `https://wa.me/51921543755?text=${encodeURIComponent(textoMensaje)}`;
    window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
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
        
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20">
                VP
              </div>
              <h1 className="text-lg font-bold text-white">Panel de Control V-PASS</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">Usuario: <span className="text-slate-300 font-medium">{usuario?.email}</span></p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-amber-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-amber-400 font-extrabold text-sm">🪙 {usuario?.monedas ?? 50}</span>
              <span className="text-xs text-slate-400">Monedas</span>
            </div>

            <button
              onClick={solicitarRecarga}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1 shadow-md shadow-emerald-500/10"
            >
              💬 Recargar
            </button>

            <button
              onClick={cerrarSesion}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition border border-slate-700"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Sección de Eventos */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Mis Eventos Activos</h2>
          <button
            onClick={() => router.push('/nuevo-evento')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/10"
          >
            + Crear Evento
          </button>
        </div>

        {/* Listado o Estado Vacío */}
        {eventos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3 shadow-inner">
            <p className="text-xs text-slate-400">Aún no has creado ningún evento en V-PASS.</p>
            <button
              onClick={() => router.push('/nuevo-evento')}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs border border-amber-500/20 transition"
            >
              Crear tu primer evento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos.map((ev) => (
              <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
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