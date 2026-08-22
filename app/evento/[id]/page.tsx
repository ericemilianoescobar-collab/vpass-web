'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdministrarEvento() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params?.id;

  const [evento, setEvento] = useState<any>(null);
  const [validadores, setValidadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<'diseno' | 'validadores'>('diseno');

  // Ajustes de Diseñador QR
  const [posX, setPosX] = useState<number>(50);
  const [posY, setPosY] = useState<number>(80);
  const [tamanoQr, setTamanoQr] = useState<number>(100);
  const [codigoMuestra, setCodigoMuestra] = useState('VPASS-DEMO');

  // Formulario de Nuevo Validador
  const [nombrePuerta, setNombrePuerta] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const cargarDatos = async () => {
    if (!eventoId) return;

    const { data: dataEvento } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', eventoId)
      .maybeSingle();

    if (dataEvento) {
      setEvento(dataEvento);

      const { data: dataValidadores } = await supabase
        .from('validadores')
        .select('*')
        .eq('evento_id', eventoId);

      setValidadores(dataValidadores || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [eventoId]);

  const handleCrearValidador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) return;

    const { error } = await supabase.from('validadores').insert([
      {
        evento_id: eventoId,
        nombre_puerta: nombrePuerta || 'Puerta Principal',
        usuario: usuario.toLowerCase().trim(),
        password: password.trim(),
      },
    ]);

    if (!error) {
      setNombrePuerta('');
      setUsuario('');
      setPassword('');
      cargarDatos();
      alert('¡Validador agregado con éxito!');
    } else {
      alert('Error al agregar el validador.');
    }
  };

  const handleEliminarValidador = async (id: number) => {
    await supabase.from('validadores').delete().eq('id', id);
    cargarDatos();
  };

  const descargarPdfA5 = () => {
    window.print();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-xs font-bold">
        Cargando datos del evento...
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
              <span className="text-sm font-black text-emerald-400">VP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase">
                {evento?.plan_utilizado || 'Plan Activo'}
              </span>
              <h1 className="text-lg font-black text-white">{evento?.nombre || 'Mi Evento'}</h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPestana('diseno')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'diseno' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎨 Diseñador QR sobre Flyer (PDF A5)
          </button>
          <button
            onClick={() => setPestana('validadores')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'validadores' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 Gestor de Validadores ({validadores.length})
          </button>
        </div>

        {/* PESTAÑA 1: DISEÑO */}
        {pestana === 'diseno' && (
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
                  className="w-full accent-emerald-500 cursor-pointer"
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
                  className="w-full accent-emerald-500 cursor-pointer"
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
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={descargarPdfA5}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  📄 Imprimir / Exportar PDF A5
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Lienzo Flyer Oficial (A5)</span>

              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-[1/1.414] w-full max-w-sm flex items-center justify-center">
                {evento?.flyer_url ? (
                  <img src={evento.flyer_url} alt="Flyer Evento" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto text-emerald-400 font-bold text-xs">
                      VP
                    </div>
                    <p className="text-xs text-slate-500">Flyer Oficial</p>
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
        )}

        {/* PESTAÑA 2: GESTIÓN DE VALIDADORES */}
        {pestana === 'validadores' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Registrar Nuevo Validador de Puerta</h3>
              
              <form onSubmit={handleCrearValidador} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Apodo/Puerta (Ej: Puerta VIP)"
                  value={nombrePuerta}
                  onChange={(e) => setNombrePuerta(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Usuario (Ej: puerta1)"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Guardar Credencial de Puerta
                </button>
              </form>
            </div>

            {/* LISTA DE VALIDADORES */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validadores Registrados</h3>
              {validadores.length === 0 ? (
                <p className="text-xs text-slate-500">No hay validadores creados para este evento.</p>
              ) : (
                <div className="space-y-2">
                  {validadores.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">{v.nombre_puerta}</span>
                        <span className="text-slate-400 text-[10px]">Usuario: <strong className="text-emerald-400">{v.usuario}</strong> | Pass: {v.password}</span>
                      </div>
                      <button
                        onClick={() => handleEliminarValidador(v.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* PLANTILLA PDF A5 IMPRESIÓN */}
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