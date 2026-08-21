'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function AdministrarEvento() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params?.id;

  const [evento, setEvento] = useState<any>(null);
  const [validadores, setValidadores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<'diseno' | 'validadores' | 'escaner'>('diseno');

  // --- ESTADOS DE DISEÑO Y QR ---
  const [tamanoQr, setTamanoQr] = useState<number>(200);
  const [logoQr, setLogoQr] = useState<string | null>(null);
  const [textoPreview, setTextoPreview] = useState('VP-TICKET-PROMO');

  // --- ESTADOS DE VALIDADORES (MÁX 5) ---
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [nombrePuerta, setNombrePuerta] = useState('Puerta 1');
  const [creandoValidador, setCreandoValidador] = useState(false);

  // --- ESTADOS DE ESCÁNER Y LOGIN ---
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [validadorSesion, setValidadorSesion] = useState<any>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [resultadoScaneo, setResultadoScaneo] = useState<{ tipo: 'exito' | 'error' | null; msg: string; fecha?: string }>({ tipo: null, msg: '' });

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
        const { data: dataValidadores } = await supabase
          .from('validadores')
          .select('*')
          .eq('evento_id', eventoId);

        setValidadores(dataValidadores || []);
      }
      setCargando(false);
    };

    cargarDatos();
  }, [eventoId]);

  // Reproductor de efectos de sonido (Web Audio API)
  const reproducirSonido = (tipo: 'exito' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === 'exito') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('Audio no soportado o bloqueado por el navegador', e);
    }
  };

  // Carga de Logo para el QR
  const handleCargarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoQr(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Crear Validador (Límite 5)
  const handleCrearValidador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validadores.length >= 5) {
      alert('Has alcanzado el límite máximo de 5 validadores para este evento.');
      return;
    }

    setCreandoValidador(true);
    const { data, error } = await supabase
      .from('validadores')
      .insert([
        {
          evento_id: eventoId,
          usuario: nuevoUsuario.toLowerCase().trim(),
          clave: nuevaClave.trim(),
          nombre_puerta: nombrePuerta,
        },
      ])
      .select();

    if (error) {
      alert(`Error al crear validador: ${error.message}`);
    } else if (data) {
      setValidadores([...validadores, ...data]);
      setNuevoUsuario('');
      setNuevaClave('');
      alert('¡Validador de puerta creado con éxito!');
    }
    setCreandoValidador(false);
  };

  // Eliminar Validador
  const handleEliminarValidador = async (id: string) => {
    if (!confirm('¿Deseas borrar esta credencial de puerta?')) return;
    const { error } = await supabase.from('validadores').delete().eq('id', id);
    if (!error) {
      setValidadores(validadores.filter((v) => v.id !== id));
    }
  };

  // Login para Puerta/Escáner
  const handleLoginValidador = (e: React.FormEvent) => {
    e.preventDefault();
    const vEncontrado = validadores.find(
      (v) => v.usuario === loginUser.toLowerCase().trim() && v.clave === loginPass.trim()
    );

    if (vEncontrado) {
      setValidadorSesion(vEncontrado);
      setResultadoScaneo({ tipo: null, msg: '' });
    } else {
      alert('Credenciales incorrectas de validador.');
    }
  };

  // Procesar código (Manual o Escaneado)
  const procesarCodigoTicket = async (codigo: string) => {
    if (!codigo.trim()) return;

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('codigo', codigo.trim().toUpperCase())
      .maybeSingle();

    if (error || !ticket) {
      reproducirSonido('error');
      setResultadoScaneo({
        tipo: 'error',
        msg: `El código ${codigo.toUpperCase()} NO EXISTE o es inválido.`,
      });
    } else if (ticket.usado) {
      reproducirSonido('error');
      const horaIngreso = new Date(ticket.usado_el || Date.now()).toLocaleTimeString();
      setResultadoScaneo({
        tipo: 'error',
        msg: `¡TICKET DUPLICADO! Ya fue escaneado anteriormente a las ${horaIngreso}.`,
      });
    } else {
      await supabase
        .from('tickets')
        .update({ usado: true, usado_el: new Date().toISOString() })
        .eq('id', ticket.id);

      reproducirSonido('exito');
      setResultadoScaneo({
        tipo: 'exito',
        msg: `¡ACCESO PERMITIDO! Ticket Válido.`,
        fecha: new Date().toLocaleTimeString(),
      });
      setCodigoManual('');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 text-xs font-bold">
        Cargando administración del evento...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* CABECERA CORPORATIVA */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-sm font-extrabold text-cyan-400">VP</span>
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 uppercase">
                {evento?.plan_utilizado || 'Plan Activo'}
              </span>
              <h1 className="text-lg font-black text-white">{evento?.nombre}</h1>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl"
          >
            ← Volver al Panel
          </button>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPestana('diseno')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'diseno' ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎨 Edición QR y Diseñador
          </button>
          <button
            onClick={() => setPestana('validadores')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'validadores' ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            🔑 Crear Validadores ({validadores.length}/5)
          </button>
          <button
            onClick={() => setPestana('escaner')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
              pestana === 'escaner' ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            📷 Validador de Puerta
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: EDITOR DE QR */}
        {pestana === 'diseno' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase">Personalizar Formato QR</h3>
              
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Código o Texto del Pase</label>
                <input
                  type="text"
                  value={textoPreview}
                  onChange={(e) => setTextoPreview(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tamaño del QR ({tamanoQr}px)</label>
                <input
                  type="range"
                  min="140"
                  max="280"
                  value={tamanoQr}
                  onChange={(e) => setTamanoQr(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Logo Central (PNG / JPG)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCargarLogo}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 min-h-[320px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vista Previa Dinámica</span>
              
              <div
                className="bg-white p-4 rounded-2xl relative shadow-2xl flex items-center justify-center transition-all"
                style={{ width: tamanoQr + 32, height: tamanoQr + 32 }}
              >
                {/* Generador QR Estilo Ilustración */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=${tamanoQr}x${tamanoQr}&data=${encodeURIComponent(
                    textoPreview
                  )}`}
                  alt="QR Evento"
                  style={{ width: tamanoQr, height: tamanoQr }}
                />
                
                {logoQr && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={logoQr}
                      alt="Logo QR"
                      className="w-10 h-10 object-contain bg-white p-1 rounded-lg shadow-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: GESTIÓN DE VALIDADORES (MÁX 5) */}
        {pestana === 'validadores' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white">Crear Usuario de Puerta</h3>
                <p className="text-xs text-slate-400 mt-0.5">Máximo 5 porteros por evento.</p>
              </div>

              <form onSubmit={handleCrearValidador} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Ubicación / Nombre Puerta</label>
                  <input
                    type="text"
                    value={nombrePuerta}
                    onChange={(e) => setNombrePuerta(e.target.value)}
                    placeholder="Ej: Puerta Principal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Usuario</label>
                  <input
                    type="text"
                    required
                    value={nuevoUsuario}
                    onChange={(e) => setNuevoUsuario(e.target.value)}
                    placeholder="Ej: puerta1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Contraseña</label>
                  <input
                    type="text"
                    required
                    value={nuevaClave}
                    onChange={(e) => setNuevaClave(e.target.value)}
                    placeholder="Ej: 123456"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creandoValidador || validadores.length >= 5}
                  className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
                >
                  {creandoValidador ? 'Guardando...' : 'Crear Credencial'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-white">Credenciales Activas ({validadores.length}/5)</h3>

              {validadores.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-8 text-center text-xs text-slate-500">
                  Aún no has creado usuarios para este evento.
                </div>
              ) : (
                <div className="space-y-2">
                  {validadores.map((v) => (
                    <div key={v.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                          {v.nombre_puerta}
                        </span>
                        <p className="text-xs font-mono text-slate-300 mt-1">
                          User: <strong className="text-white">{v.usuario}</strong> | Clave: <strong className="text-white">{v.clave}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarValidador(v.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-900/50 px-3 py-1.5 rounded-lg transition"
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

        {/* CONTENIDO PESTAÑA 3: ESCÁNER / VALIDADOR DE PUERTA */}
        {pestana === 'escaner' && (
          <div>
            {!validadorSesion ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold text-white">Ingreso de Validador de Puerta</h3>
                  <p className="text-xs text-slate-400">Ingresa con un usuario registrado para habilitar el escáner.</p>
                </div>

                <form onSubmit={handleLoginValidador} className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Usuario</label>
                    <input
                      type="text"
                      required
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Contraseña</label>
                    <input
                      type="password"
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
                  >
                    Abrir Terminal de Puerta
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Puerta: {validadorSesion.nombre_puerta}
                    </span>
                    <button
                      onClick={() => setValidadorSesion(null)}
                      className="text-xs text-slate-400 hover:text-rose-400 transition"
                    >
                      Cerrar Sesión
                    </button>
                  </div>

                  {/* Entrada Manual de Ticket */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      procesarCodigoTicket(codigoManual);
                    }}
                    className="space-y-2 pt-2"
                  >
                    <label className="block text-xs font-bold text-slate-300">Validación Manual o Escáner</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribe el código del ticket..."
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition"
                      >
                        Validar
                      </button>
                    </div>
                  </form>
                </div>

                {/* Feedback Audiovisual */}
                <div
                  className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-all min-h-[220px] ${
                    resultadoScaneo.tipo === 'exito'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : resultadoScaneo.tipo === 'error'
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {resultadoScaneo.tipo === 'exito' && (
                    <div className="space-y-2">
                      <div className="text-4xl">✅</div>
                      <h4 className="text-lg font-black text-emerald-400">ENTRADA VÁLIDA</h4>
                      <p className="text-xs">{resultadoScaneo.msg}</p>
                      <p className="text-[10px] font-mono text-emerald-500">Hora: {resultadoScaneo.fecha}</p>
                    </div>
                  )}

                  {resultadoScaneo.tipo === 'error' && (
                    <div className="space-y-2">
                      <div className="text-4xl">❌</div>
                      <h4 className="text-lg font-black text-rose-400">ACCESO DENEGADO</h4>
                      <p className="text-xs">{resultadoScaneo.msg}</p>
                    </div>
                  )}

                  {!resultadoScaneo.tipo && (
                    <div className="space-y-1">
                      <div className="text-3xl text-slate-600">🎟️</div>
                      <p className="text-xs font-bold text-slate-300">Terminal de Entrada Lista</p>
                      <p className="text-[11px] text-slate-500">Ingresa un código para escuchar el timbre de confirmación.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}