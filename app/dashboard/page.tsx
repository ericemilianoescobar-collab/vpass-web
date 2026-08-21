'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface PerfilUsuario {
  id: string;
  email: string | undefined;
  plan_basico_cant: number;
  plan_estandar_cant: number;
  plan_premium_cant: number;
}

interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  hora?: string;
  capacidad: number;
  plan_utilizado?: string;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<PerfilUsuario | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const cargarDatos = async () => {
      try {
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
          perfil = {
            id: user.id,
            email: user.email,
            plan_basico_cant: 0,
            plan_estandar_cant: 0,
            plan_premium_cant: 0,
          };
        }

        if (isMounted) {
          setUsuario({
            id: perfil.id,
            email: perfil.email,
            plan_basico_cant: perfil.plan_basico_cant ?? 0,
            plan_estandar_cant: perfil.plan_estandar_cant ?? 0,
            plan_premium_cant: perfil.plan_premium_cant ?? 0,
          });
        }

        const { data: evs } = await supabase
          .from('eventos')
          .select('*')
          .eq('usuario_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted) {
          setEventos(evs || []);
        }
      } catch (e) {
        console.error('Error cargando Dashboard:', e);
      } finally {
        if (isMounted) setCargando(false);
      }
    };

    cargarDatos();
    return () => { isMounted = false; };
  }, [router]);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const solicitarPlan = () => {
    const email = usuario?.email ?? 'usuario';
    const textoMensaje = `¡Hola equipo de V-PASS! 👋\n\nQuiero contratar/renovar un plan.\n📌 *Usuario:* ${email}`;
    window.open(`https://wa.me/51921543755?text=${encodeURIComponent(textoMensaje)}`, '_blank');
  };

  const tienePlanesActivos = 
    (usuario?.plan_basico_cant ?? 0) > 0 ||
    (usuario?.plan_estandar_cant ?? 0) > 0 ||
    (usuario?.plan_premium_cant ?? 0) > 0;

  const handleCrearEvento = () => {
    if (!tienePlanesActivos) {
      alert('No tienes planes disponibles actualmente (Básico: 0, Estándar: 0, Premium: 0). Adquiere un plan por WhatsApp para publicar tu evento.');
      solicitarPlan();
      return;
    }
    router.push('/nuevo-evento');
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-100">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-cyan-400">Cargando Panel V-PASS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 gap-6 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo.png" 
                  alt="Logo V-PASS" 
                  className="w-full h-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="text-xs font-bold text-cyan-400">VP</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-wide">Panel de Control V-PASS</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Usuario: <span className="text-slate-300 font-medium">{usuario?.email}</span>
            </p>
          </div>

          {/* Marcadores de Planes Específicos */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-4">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Básico (150 pases)</p>
                <p className={`text-xs font-extrabold ${usuario?.plan_basico_cant ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {usuario?.plan_basico_cant} disponible(s)
                </p>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Estándar (300 pases)</p>
                <p className={`text-xs font-extrabold ${usuario?.plan_estandar_cant ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {usuario?.plan_estandar_cant} disponible(s)
                </p>
              </div>
              <div className="h-6 w-px bg-slate-800"></div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Premium (500 pases)</p>
                <p className={`text-xs font-extrabold ${usuario?.plan_premium_cant ? 'text-amber-400' : 'text-slate-500'}`}>
                  {usuario?.plan_premium_cant} disponible(s)
                </p>
              </div>
            </div>

            <button
              onClick={solicitarPlan}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-500/10"
            >
              💬 Adquirir Plan
            </button>

            <button
              onClick={cerrarSesion}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition border border-slate-700"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Sección Eventos */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Mis Eventos Creados</h2>
          <button
            onClick={handleCrearEvento}
            className={`font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg ${
              tienePlanesActivos
                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            + Crear Evento
          </button>
        </div>

        {/* Listado de Eventos */}
        {eventos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-inner">
            <p className="text-xs text-slate-400">Aún no has creado ningún evento en V-PASS.</p>
            {!tienePlanesActivos && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Actualmente tienes <span className="text-rose-400 font-bold">0 planes activos</span>. Adquiere un paquete para publicar.
                </p>
                <button
                  onClick={solicitarPlan}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md"
                >
                  💬 Solicitar Activación por WhatsApp
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventos.map((ev) => (
              <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
                <div>
                  <h3 className="font-bold text-white text-sm">{ev.nombre}</h3>
                  <p className="text-xs text-slate-400 mt-1">📅 {ev.fecha} — ⏰ {ev.hora || '20:00'}</p>
                  <p className="text-xs text-slate-400">🎟️ Capacidad: {ev.capacidad} pases VIP</p>
                </div>
                <button
                  onClick={() => router.push(`/evento/${ev.id}`)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold py-2 rounded-xl text-xs border border-slate-700 transition text-center"
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