'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdministrarEvento() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params?.id || params?.eventoId;

  const [evento, setEvento] = useState<any>(null);
  const [validadores, setValidadores] = useState<any[]>([]);
  const [invitados, setInvitados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestanaPrincipal, setPestanaPrincipal] = useState<'evento' | 'validadores'>('evento');

  const [formEvento, setFormEvento] = useState({
    nombre: '',
    fecha: '',
    hora: '',
    lugar: '',
    flyer_url: '',
  });

  const [posX, setPosX] = useState<number>(50);
  const [posY, setPosY] = useState<number>(80);
  const [tamanoQr, setTamanoQr] = useState<number>(100);

  // Campos para validador (coincide con la columna 'clave' de tu Supabase)
  const [nombrePuerta, setNombrePuerta] = useState('');
  const [usuarioVal, setUsuarioVal] = useState('');
  const [claveVal, setClaveVal] = useState('');

  // Campos para invitado
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [contactoInvitado, setContactoInvitado] = useState('');

  const [invitadoSeleccionado, setInvitadoSeleccionado] = useState<any>(null);

  const cargarDatos = async () => {
    if (!eventoId) return;

    const { data: dataEvento } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', eventoId)
      .maybeSingle();

    if (dataEvento) {
      setEvento(dataEvento);
      setFormEvento({
        nombre: dataEvento.nombre || '',
        fecha: dataEvento.fecha || '',
        hora: dataEvento.hora || '',
        lugar: dataEvento.lugar || '',
        flyer_url: dataEvento.flyer_url || '',
      });

      if (dataEvento.pos_x) setPosX(Number(dataEvento.pos_x));
      if (dataEvento.pos_y) setPosY(Number(dataEvento.pos_y));
      if (dataEvento.tamano_qr) setTamanoQr(Number(dataEvento.tamano_qr));

      const { data: dataValidadores } = await supabase
        .from('validadores')
        .select('*')
        .eq('evento_id', eventoId)
        .order('id', { ascending: false });

      const { data: dataTickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('evento_id', eventoId)
        .order('id', { ascending: false });

      setValidadores(dataValidadores || []);
      setInvitados(dataTickets || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [eventoId]);

  const handleGuardarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formEvento,
      pos_x: posX,
      pos_y: posY,
      tamano_qr: tamanoQr,
    };

    const { error } = await supabase
      .from('eventos')
      .update(payload)
      .eq('id', eventoId);

    if (!error) {
      alert('¡Evento guardado correctamente!');
      cargarDatos();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleCrearValidador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioVal.trim() || !claveVal.trim()) return;

    // Guarda en la columna 'clave' de tu DB
    const { error } = await supabase.from('validadores').insert([
      {
        evento_id: eventoId,
        nombre_puerta: nombrePuerta || 'Puerta Principal',
        usuario: usuarioVal.toLowerCase().trim(),
        clave: claveVal.trim(),
      },
    ]);

    if (!error) {
      setNombrePuerta('');
      setUsuarioVal('');
      setClaveVal('');
      cargarDatos();
    } else {
      alert('Error al crear validador: ' + error.message);
    }
  };

  const handleEliminarValidador = async (id: any) => {
    if (!confirm('¿Eliminar validador?')) return;
    await supabase.from('validadores').delete().eq('id', id);
    cargarDatos();
  };

  const handleCrearInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInvitado.trim()) return;

    const codigoGenerado = `VPASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase.from('tickets').insert([
      {
        evento_id: eventoId,
        nombre_asistente: nombreInvitado.trim(),
        contacto: contactoInvitado.trim() || null,
        codigo_qr: codigoGenerado,
        ingresado: false,
      },
    ]);

    if (!error) {
      setNombreInvitado('');
      setContactoInvitado('');
      cargarDatos();
    } else {
      alert('Error al crear invitado: ' + error.message);
    }
  };

  const handleEliminarInvitado = async (id: any) => {
    if (!confirm('¿Eliminar invitado?')) return;
    await supabase.from('tickets').delete().eq('id', id);
    cargarDatos();
  };

  const descargarQrInvitado = (invitado: any) => {
    if (!evento?.flyer_url) {
      alert('Primero debes guardar la URL de un flyer.');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgFlyer = new Image();
    imgFlyer.crossOrigin = 'anonymous';
    imgFlyer.src = evento.flyer_url;

    imgFlyer.onload = () => {
      canvas.width = imgFlyer.width;
      canvas.height = imgFlyer.height;

      if (ctx) {
        ctx.drawImage(imgFlyer, 0, 0);

        const imgQr = new Image();
        imgQr.crossOrigin = 'anonymous';
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr * 2}x${tamanoQr * 2}&data=${invitado.codigo_qr}`;

        imgQr.onload = () => {
          const qrX = (canvas.width * posX) / 100 - tamanoQr / 2;
          const qrY = (canvas.height * posY) / 100 - tamanoQr / 2;

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(qrX - 10, qrY - 10, tamanoQr + 20, tamanoQr + 20, 16);
          ctx.fill();

          ctx.drawImage(imgQr, qrX, qrY, tamanoQr, tamanoQr);

          const link = document.createElement('a');
          link.download = `Pase-${invitado.nombre_asistente.replace(/\s+/g, '_')}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
      }
    };
  };

  if (cargando) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-xs font-bold">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-sm font-black text-emerald-400">VP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase">
                Panel del Evento
              </span>
              <h1 className="text-lg font-black text-white">{evento?.nombre || 'Mi Evento'}</h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition"
          >
            ← Volver al Panel Principal
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPestanaPrincipal('evento')}
            className={`py-3 rounded-xl text-xs font-bold transition ${
              pestanaPrincipal === 'evento' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎉 Evento, Flyer & Invitados
          </button>
          <button
            onClick={() => setPestanaPrincipal('validadores')}
            className={`py-3 rounded-xl text-xs font-bold transition ${
              pestanaPrincipal === 'validadores' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 Validadores / Personal de Puerta ({validadores.length})
          </button>
        </div>

        {pestanaPrincipal === 'evento' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">1. Información del Evento</h2>
              <form onSubmit={handleGuardarEvento} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={formEvento.nombre}
                      onChange={(e) => setFormEvento({ ...formEvento, nombre: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lugar</label>
                    <input
                      type="text"
                      value={formEvento.lugar}
                      onChange={(e) => setFormEvento({ ...formEvento, lugar: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formEvento.fecha}
                      onChange={(e) => setFormEvento({ ...formEvento, fecha: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora</label>
                    <input
                      type="time"
                      value={formEvento.hora}
                      onChange={(e) => setFormEvento({ ...formEvento, hora: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">URL del Flyer</label>
                  <input
                    type="text"
                    value={formEvento.flyer_url}
                    onChange={(e) => setFormEvento({ ...formEvento, flyer_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">2. Posición del QR en Flyer</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Posición X ({posX}%)</label>
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
                        <label className="block text-[11px] text-slate-400 mb-1">Posición Y ({posY}%)</label>
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
                        <label className="block text-[11px] text-slate-400 mb-1">Tamaño ({tamanoQr}px)</label>
                        <input
                          type="range"
                          min="60"
                          max="160"
                          value={tamanoQr}
                          onChange={(e) => setTamanoQr(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2 flex justify-center">
                      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-[1/1.414] w-full max-w-xs flex items-center justify-center">
                        {formEvento.flyer_url ? (
                          <img src={formEvento.flyer_url} alt="Flyer" className="w-full h-full object-cover" />
                        ) : (
                          <p className="text-xs text-slate-500 text-center p-4">Ingresa la URL del flyer arriba</p>
                        )}
                        <div
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-2xl shadow-2xl"
                          style={{
                            left: `${posX}%`,
                            top: `${posY}%`,
                            width: tamanoQr,
                            height: tamanoQr,
                          }}
                        >
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=VPASS-MUESTRA`}
                            alt="QR Muestra"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition"
                >
                  💾 Guardar Cambios
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">3. Control de Invitados</h2>

              <form onSubmit={handleCrearInvitado} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Teléfono / Email (Opcional)"
                  value={contactoInvitado}
                  onChange={(e) => setContactoInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  + Registrar Invitado
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase">Invitados ({invitados.length})</h3>
                {invitados.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white text-sm block">{inv.nombre_asistente}</span>
                      <span className="text-slate-400 text-[10px]">
                        Código: <strong className="text-emerald-400 font-mono">{inv.codigo_qr}</strong> | 
                        Estado: {inv.ingresado ? '🔴 INGRESÓ' : '🟢 PENDIENTE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => descargarQrInvitado(inv)}
                        className="flex-1 sm:flex-none bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                      >
                        📥 Descargar Pase PNG
                      </button>
                      <button
                        onClick={() => setInvitadoSeleccionado(inv)}
                        className="flex-1 sm:flex-none bg-slate-900 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                      >
                        👁️ Ver QR
                      </button>
                      <button
                        onClick={() => handleEliminarInvitado(inv.id)}
                        className="bg-rose-950/40 text-rose-400 border border-rose-800/40 px-3 py-1.5 rounded-lg font-bold text-[11px]"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {pestanaPrincipal === 'validadores' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Crear Credencial de Validador</h2>
              <form onSubmit={handleCrearValidador} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre Puerta (Ej: Puerta Principal)"
                  value={nombrePuerta}
                  onChange={(e) => setNombrePuerta(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Usuario"
                  value={usuarioVal}
                  onChange={(e) => setUsuarioVal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Contraseña"
                  value={claveVal}
                  onChange={(e) => setClaveVal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  Guardar Validador
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Validadores Activos</h3>
              {validadores.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-white block text-sm">{v.nombre_puerta}</span>
                    <span className="text-slate-400 text-[11px]">
                      Usuario: <strong className="text-emerald-400">{v.usuario}</strong> | Contraseña: <strong>{v.clave}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => handleEliminarValidador(v.id)}
                    className="text-xs text-rose-400 font-bold px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {invitadoSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
            <h3 className="text-sm font-bold text-white">{invitadoSeleccionado.nombre_asistente}</h3>
            <p className="text-[11px] text-slate-400 font-mono">{invitadoSeleccionado.codigo_qr}</p>
            <div className="bg-white p-4 rounded-xl inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${invitadoSeleccionado.codigo_qr}`}
                alt="QR"
                className="w-48 h-48 mx-auto"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => descargarQrInvitado(invitadoSeleccionado)}
                className="flex-1 bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs"
              >
                📥 Descargar PNG
              </button>
              <button
                onClick={() => setInvitadoSeleccionado(null)}
                className="bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}