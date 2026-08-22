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
  const [invitados, setInvitados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<'detalles' | 'invitados' | 'validadores' | 'diseno'>('detalles');

  // Formulario Editar Evento
  const [formEvento, setFormEvento] = useState({
    nombre: '',
    fecha: '',
    hora: '',
    lugar: '',
    flyer_url: '',
  });

  // Ajustes Diseñador QR
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

      const { data: dataValidadores } = await supabase
        .from('validadores')
        .select('*')
        .eq('evento_id', eventoId);

      const { data: dataTickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('evento_id', eventoId);

      setValidadores(dataValidadores || []);
      setInvitados(dataTickets || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [eventoId]);

  // ACTUALIZAR DATOS DEL EVENTO
  const handleGuardarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('eventos')
      .update(formEvento)
      .eq('id', eventoId);

    if (!error) {
      alert('¡Datos del evento actualizados con éxito!');
      cargarDatos();
    } else {
      alert('Error al actualizar el evento.');
    }
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
    }
  };

  const handleEliminarValidador = async (id: number) => {
    await supabase.from('validadores').delete().eq('id', id);
    cargarDatos();
  };

  const handleEliminarInvitado = async (id: number) => {
    await supabase.from('tickets').delete().eq('id', id);
    cargarDatos();
  };

  // DESCARGAR COMO IMAGEN (PNG LIMPIO)
  const descargarComoImagen = () => {
    if (!evento?.flyer_url) {
      alert('Sube un flyer primero para poder descargar la imagen.');
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
        imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr * 2}x${tamanoQr * 2}&data=VPASS-DEMO`;

        imgQr.onload = () => {
          const qrX = (canvas.width * posX) / 100 - tamanoQr / 2;
          const qrY = (canvas.height * posY) / 100 - tamanoQr / 2;

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(qrX - 10, qrY - 10, tamanoQr + 20, tamanoQr + 20, 16);
          ctx.fill();

          ctx.drawImage(imgQr, qrX, qrY, tamanoQr, tamanoQr);

          const link = document.createElement('a');
          link.download = `Flyer-${evento?.nombre || 'Evento'}.png`;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto space-y-6 print:hidden">
        
        {/* CABECERA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-sm font-black text-emerald-400">VP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase">
                Administración Activa
              </span>
              <h1 className="text-lg font-black text-white">{evento?.nombre || 'Evento'}</h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPestana('detalles')}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'detalles' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ✏️ Editar Evento
          </button>
          <button
            onClick={() => setPestana('invitados')}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'invitados' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 Invitados ({invitados.length})
          </button>
          <button
            onClick={() => setPestana('validadores')}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'validadores' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 Validadores ({validadores.length})
          </button>
          <button
            onClick={() => setPestana('diseno')}
            className={`py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'diseno' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎨 Diseñador QR
          </button>
        </div>

        {/* PESTAÑA 1: EDITAR DETALLES DEL EVENTO */}
        {pestana === 'detalles' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Modificar Información General</h3>
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora de Inicio</label>
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

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
              >
                Guardar Cambios del Evento
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA 2: INVITADOS */}
        {pestana === 'invitados' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Agregar Invitado</h3>
              <form onSubmit={handleCrearInvitado} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={nombreInvitado}
                  onChange={(e) => setNombreInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Teléfono / Contacto"
                  value={contactoInvitado}
                  onChange={(e) => setContactoInvitado(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Registrar & Crear QR
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lista de Invitados Registrados</h3>
              {invitados.length === 0 ? (
                <p className="text-xs text-slate-500">Aún no se han agregado invitados.</p>
              ) : (
                <div className="space-y-2">
                  {invitados.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-white block">{inv.nombre_asistente}</span>
                        <span className="text-slate-400 text-[10px]">QR: <strong className="text-emerald-400 font-mono">{inv.codigo_qr}</strong> | Estado: {inv.ingresado ? '🔴 Ingresó' : '🟢 Pendiente'}</span>
                      </div>
                      <button onClick={() => handleEliminarInvitado(inv.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: VALIDADORES */}
        {pestana === 'validadores' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Registrar Validador de Puerta</h3>
              <form onSubmit={handleCrearValidador} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre Puerta (Ej:VIP)"
                  value={nombrePuerta}
                  onChange={(e) => setNombrePuerta(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Usuario"
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
                  Guardar Credencial
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo con Acceso a Escáner</h3>
              {validadores.length === 0 ? (
                <p className="text-xs text-slate-500">No se han registrado validadores.</p>
              ) : (
                <div className="space-y-2">
                  {validadores.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs">
                      <div>
                        <span className="font-bold text-white block">{v.nombre_puerta}</span>
                        <span className="text-slate-400 text-[10px]">Usuario: <strong className="text-emerald-400">{v.usuario}</strong> | Pass: {v.password}</span>
                      </div>
                      <button onClick={() => handleEliminarValidador(v.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40">
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: DISEÑADOR QR Y DESCARGAS */}
        {pestana === 'diseno' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Ajustes de Posición</h3>

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

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={descargarComoImagen}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  🖼️ Descargar Imagen (PNG)
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  📄 Descargar PDF A5
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Lienzo Final Con Borde Estilo Tarjeta</span>

              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl aspect-[1/1.414] w-full max-w-sm flex items-center justify-center">
                {evento?.flyer_url ? (
                  <img src={evento.flyer_url} alt="Flyer" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <p className="text-xs text-slate-500">Ingresa la URL del flyer en "Editar Evento"</p>
                  </div>
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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=VPASS-DEMO`}
                    alt="QR Muestra"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* RENDERIZADO IMPRESIÓN PDF A5 LIMPISIMO */}
      <div className="hidden print:block print:w-[148mm] print:h-[210mm] print:m-auto print:relative">
        {evento?.flyer_url && (
          <img src={evento.flyer_url} alt="Flyer A5" className="w-full h-full object-cover" />
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
            src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=VPASS-DEMO`}
            alt="QR A5"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}