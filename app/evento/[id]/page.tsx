'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdministrarEvento() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params?.id;

  const [evento, setEvento] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!eventoId) return;

    const cargarEvento = async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error cargando evento:', error);
      } else {
        setEvento(data);
      }
      setCargando(false);
    };

    cargarEvento();
  }, [eventoId]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 text-xs font-bold">
        Cargando administración del evento...
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <p className="text-sm text-slate-400">Evento no encontrado o sin acceso.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          ← Volver al Panel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabecera con Logo VP y Navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-base font-extrabold text-cyan-400 tracking-wider">VP</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/50 uppercase">
                  {evento.plan_utilizado || 'Plan Activo'}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">
                {evento.nombre}
              </h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* Resumen de Métricas del Evento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aforo y Entradas</p>
            <p className="text-2xl font-black text-white">
              {evento.capacidad || 100} <span className="text-xs font-bold text-slate-400">pases máximos</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accesos de Validador</p>
            <p className="text-2xl font-black text-cyan-400">
              {evento.validadores_permitidos || 1} <span className="text-xs font-bold text-slate-400">permitido(s)</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1 shadow-lg">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</p>
            <p className="text-sm font-bold text-white">
              {evento.fecha || 'Sin fecha'} {evento.hora ? `• ${evento.hora}` : ''}
            </p>
          </div>
        </div>

        {/* Sección Principal: Flyer y Gestión */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visualización del Flyer y Botones de Descarga */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl flex flex-col items-center text-center">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider w-full text-left">
              Flyer Oficial del Evento
            </h3>

            <div className="w-full aspect-[3/4] bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden group">
              {evento.flyer_url ? (
                <img
                  src={evento.flyer_url}
                  alt="Flyer del evento"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mx-auto text-cyan-400 font-bold text-xs">
                    VP
                  </div>
                  <p className="text-xs font-bold text-slate-400">Sin Flyer Cargado</p>
                </div>
              )}
            </div>

            {evento.flyer_url && (
              <a
                href={evento.flyer_url}
                download
                target="_blank"
                rel="noreferrer"
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20 block"
              >
                Descargar Flyer
              </a>
            )}
          </div>

          {/* Panel de Control e Insumos */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">Herramientas de Administración</h3>
              <p className="text-xs text-slate-400 mt-1">Gestiona los pases y accesos a la puerta del evento.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => router.push(`/evento/${evento.id}/validar`)}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-xl text-left transition group space-y-1"
              >
                <p className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  Escanear / Validar Accesos →
                </p>
                <p className="text-[11px] text-slate-500">Abre la cámara para escanear tickets en la entrada.</p>
              </button>

              <button
                onClick={() => alert('Función de invitar accesos próximamente.')}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-4 rounded-xl text-left transition group space-y-1"
              >
                <p className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  Emitir Nuevos Pases →
                </p>
                <p className="text-[11px] text-slate-500">Genera enlaces QR para enviar a tus invitados.</p>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}