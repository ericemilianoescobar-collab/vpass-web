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

  // --- CONTROLES QR Y FLYER ---
  const [posX, setPosX] = useState<number>(50);
  const [posY, setPosY] = useState<number>(80);
  const [tamanoQr, setTamanoQr] = useState<number>(100);
  const [codigoMuestra, setCodigoMuestra] = useState('VPASS-DEMO');

  useEffect(() => {
    if (!eventoId) return;

    const cargarDatos = async () => {
      const { data: dataEvento } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .maybeSingle();

      if (dataEvento) {
        setEvento(dataEvento);
      }
      setCargando(false);
    };

    cargarDatos();
  }, [eventoId]);

  const descargarPdfA5 = () => {
    window.print();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 text-xs font-bold">
        Cargando evento...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
      
      <div className="max-w-5xl mx-auto space-y-6 print:hidden">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-sm font-black text-amber-400">VP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50 uppercase">
                {evento?.plan_utilizado || 'Plan Activo'}
              </span>
              <h1 className="text-lg font-black text-white">{evento?.nombre || 'Mi Evento'}</h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-amber-400 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* CONTROLES Y PREVISUALIZACIÓN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase">Ajustes de Posición (Ejes X / Y)</h3>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Posición Horizontal (X: {posX}%)</label>
              <input
                type="range"
                min="10"
                max="90"
                value={posX}
                onChange={(e) => setPosX(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Posición Vertical (Y: {posY}%)</label>
              <input
                type="range"
                min="10"
                max="90"
                value={posY}
                onChange={(e) => setPosY(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tamaño del QR ({tamanoQr}px)</label>
              <input
                type="range"
                min="60"
                max="160"
                value={tamanoQr}
                onChange={(e) => setTamanoQr(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={descargarPdfA5}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
              >
                📄 Imprimir / Exportar PDF A5
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Lienzo Flyer Oficial (A5)</span>

            <div
              className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-[1/1.414] w-full max-w-sm flex items-center justify-center"
            >
              {evento?.flyer_url ? (
                <img src={evento.flyer_url} alt="Flyer Evento" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-amber-400 font-bold text-xs">
                    VP
                  </div>
                  <p className="text-xs text-slate-500">Flyer de Muestra</p>
                </div>
              )}

              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-2xl"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  width: tamanoQr,
                  height: tamanoQr,
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=${encodeURIComponent(
                    codigoMuestra
                  )}`}
                  alt="QR Muestra"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PLANTILLA DE IMPRESIÓN A5 */}
      <div className="hidden print:block print:w-[148mm] print:h-[210mm] print:m-auto print:relative">
        {evento?.flyer_url && (
          <img src={evento.flyer_url} alt="Flyer A5" className="w-full h-full object-cover" />
        )}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-2xl"
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
            width: tamanoQr,
            height: tamanoQr,
          }}
        >
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=${encodeURIComponent(
              codigoMuestra
            )}`}
            alt="QR A5"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}