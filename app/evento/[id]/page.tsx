'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdministrarEvento() {
  const params = useParams();
  const router = useRouter();
  
  // Captura 'id' o 'eventoId' según el nombre de la carpeta
  const eventoId = params?.id || params?.eventoId;

  const [evento, setEvento] = useState<any>(null);
  const [validadores, setValidadores] = useState<any[]>([]);
  const [invitados, setInvitados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestanaPrincipal, setPestanaPrincipal] = useState<'evento' | 'validadores'>('evento');

  // Formulario Datos Evento
  const [formEvento, setFormEvento] = useState({
    nombre: '',
    fecha: '',
    hora: '',
    lugar: '',
    flyer_url: '',
  });

  // Ajustes Posición QR
  const [posX, setPosX] = useState<number>(50);
  const [posY, setPosY] = useState<number>(80);
  const [tamanoQr, setTamanoQr] = useState<number>(100);

  // Formulario Validador
  const [nombrePuerta, setNombrePuerta] = useState('');
  const [usuarioVal, setUsuarioVal] = useState('');
  const [passwordVal, setPasswordVal] = useState('');

  // Formulario Invitado
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [contactoInvitado, setContactoInvitado] = useState('');

  // Modal QR Invitado
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

  // GUARDAR DATOS DEL EVENTO + POSICIÓN QR
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
      alert('¡Información del evento y posición QR guardadas!');
      cargarDatos();
    } else {
      alert('Error al guardar datos: ' + error.message);
    }
  };

  // AGREGAR VALIDADOR
  const handleCrearValidador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioVal.trim() || !passwordVal.trim()) return;

    const { error } = await supabase.from('validadores').insert([
      {
        evento_id: eventoId,
        nombre_puerta: nombrePuerta || 'Puerta Principal',
        usuario: usuarioVal.toLowerCase().trim(),
        password: passwordVal.trim(),
      },
    ]);

    if (!error) {
      setNombrePuerta('');
      setUsuarioVal('');
      setPasswordVal('');
      cargarDatos();
    } else {
      alert('Error al crear validador: ' + error.message);
    }
  };

  const handleEliminarValidador = async (id: number) => {
    if (!confirm('¿Eliminar esta credencial de validador?')) return;
    await supabase.from('validadores').delete().eq('id', id);
    cargarDatos();
  };

  // AGREGAR INVITADO
  const handleCrearInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInvitado.trim()) return;

    const codigoGenerado = `VPASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { error } = await supabase.from('tickets').insert([
      {
        evento_id: eventoId,
        nombre_asistente: nombreInvitado.trim(),
        contacto: contactoInvitado.trim(),
        codigo_qr: codigoGenerado,
        ingresado: false,
      },
    ]);

    if (!error) {
      setNombreInvitado('');
      setContactoInvitado('');
      cargarDatos();
    } else {
      alert('Error al registrar invitado: ' + error.message);
    }
  };

  const handleEliminarInvitado = async (id: number) => {
    if (!confirm('¿Eliminar a este invitado?')) return;
    await supabase.from('tickets').delete().eq('id', id);
    cargarDatos();
  };

  // DESCARGAR FLYER + QR INDIVIDUAL
  const descargarQrInvitado = (invitado: any) => {
    if (!evento?.flyer_url) {
      alert('Ingresa una URL de flyer válida primero para generar la imagen.');
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

          // Fondo blanco redondeado para el QR
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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-xs font-bold">
        Cargando gestión de evento...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CABECERA GENERAL */}
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

        {/* NAVEGACIÓN ÚNICA: 2 PESTAÑAS */}
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

        {/* PESTAÑA 1: TODO LO REFERENTE AL EVENTO EN UNA SOLA VISTA */}
        {pestanaPrincipal === 'evento' && (
          <div className="space-y-8">

            {/* SECCIÓN 1: FORMULARIO EDITAR EVENTO */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">1. Información del Evento</h2>
              </div>

              <form onSubmit={handleGuardarEvento} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Evento</label>
                    <input
                      type="text"
                      required
                      value={formEvento.nombre}
                      onChange={(e) => setFormEvento({ ...formEvento, nombre: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lugar / Ubicación</label>
                    <input
                      type="text"
                      value={formEvento.lugar}
                      onChange={(e) => setFormEvento({ ...formEvento, lugar: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formEvento.fecha}
                      onChange={(e) => setFormEvento({ ...formEvento, fecha: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora</label>
                    <input
                      type="time"
                      value={formEvento.hora}
                      onChange={(e) => setFormEvento({ ...formEvento, hora: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">URL del Flyer (Imagen)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formEvento.flyer_url}
                    onChange={(e) => setFormEvento({ ...formEvento, flyer_url: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* SECCIÓN 2: DISEÑADOR QR E INTEGRADO AQUÍ MISMO */}
                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">2. Ubicación del QR sobre el Flyer</h3>
                  
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
                          <p className="text-xs text-slate-500 text-center p-4">Sube la URL de la imagen del flyer arriba</p>
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
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  💾 Guardar Todos los Cambios del Evento
                </button>
              </form>
            </div>

            {/* SECCIÓN 3: GESTIÓN DE INVITADOS EN LA MISMA PÁGINA */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
              <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">3. Registro y Control de Invitados</h2>

              <form onSubmit={handleCrearInvitado} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido del Invitado"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Teléfono / Email (Opcional)"
                  value={contactoInvitado}
                  onChange={(e) => setContactoInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  + Registrar Invitado
                </button>
              </form>

              {/* LISTA DE INVITADOS CON BOTONES DE DESCARGA INDIVIDUAL */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase">Lista de Invitados ({invitados.length})</h3>

                {invitados.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No hay invitados registrados todavía.</p>
                ) : (
                  <div className="space-y-2">
                    {invitados.map((inv) => (
                      <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl gap-3 text-xs">
                        <div>
                          <span className="font-bold text-white text-sm block">{inv.nombre_asistente}</span>
                          <span className="text-slate-400 text-[10px]">
                            Código QR: <strong className="text-emerald-400 font-mono">{inv.codigo_qr}</strong> | 
                            Estado: {inv.ingresado ? '🔴 INGRESÓ' : '🟢 PENDIENTE'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => descargarQrInvitado(inv)}
                            className="flex-1 sm:flex-none bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/50 px-3 py-1.5 rounded-lg font-bold text-[11px] transition"
                          >
                            📥 Descargar Pase PNG
                          </button>
                          <button
                            onClick={() => setInvitadoSeleccionado(inv)}
                            className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg font-bold text-[11px] transition"
                          >
                            👁️ Ver QR
                          </button>
                          <button
                            onClick={() => handleEliminarInvitado(inv.id)}
                            className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 px-3 py-1.5 rounded-lg font-bold text-[11px] transition"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* PESTAÑA 2: VALIDADORES DE PUERTA */}
        {pestanaPrincipal === 'validadores' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">Crear Credencial para Validador de Puerta</h2>
              
              <form onSubmit={handleCrearValidador} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre Puerta (Ej: VIP / Puerta 1)"
                  value={nombrePuerta}
                  onChange={(e) => setNombrePuerta(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Usuario (Ej: puerta1)"
                  value={usuarioVal}
                  onChange={(e) => setUsuarioVal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Contraseña"
                  value={passwordVal}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Guardar Validador
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lista de Validadores Activos</h3>
              {validadores.length === 0 ? (
                <p className="text-xs text-slate-500">No se han registrado validadores aún.</p>
              ) : (
                <div className="space-y-2">
                  {validadores.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-white block text-sm">{v.nombre_puerta}</span>
                        <span className="text-slate-400 text-[11px]">
                          Usuario: <strong className="text-emerald-400">{v.usuario}</strong> | Contraseña: <strong>{v.password}</strong>
                        </span>
                      </div>
                      <button
                        onClick={() => handleEliminarValidador(v.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40"
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

      {/* MODAL VER QR INVIDUAL */}
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
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs"
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