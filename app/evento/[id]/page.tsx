'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const generarCodigoSeguro = () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `VPASS-${hash.slice(0, 4)}-${hash.slice(4)}`;
};

export default function EventoDetalle() {
  const { id } = useParams();
  const router = useRouter();

  const [evento, setEvento] = useState<any>(null);
  const [nombreAsistente, setNombreAsistente] = useState('');
  const [ticketsGenerados, setTicketsGenerados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Subida de Flyer e Interacción del QR
  const [flyerBase64, setFlyerBase64] = useState<string>('');
  const [qrPosX, setQrPosX] = useState<number>(50); // % Horiz
  const [qrPosY, setQrPosY] = useState<number>(60); // % Vert
  const [qrSize, setQrSize] = useState<number>(110); // px

  // Modales
  const [ticketEditando, setTicketEditando] = useState<any>(null);
  const [nuevoNombreEditado, setNuevoNombreEditado] = useState('');

  const [qrActual, setQrActual] = useState('');
  const [nombreActual, setNombreActual] = useState('Asistente VIP');

  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) cargarEventoYTickets();
  }, [id]);

  const cargarEventoYTickets = async () => {
    setLoading(true);

    const { data: eventoData } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();

    if (!eventoData) {
      router.push('/dashboard');
      return;
    }

    setEvento(eventoData);
    if (eventoData.flyer_url) setFlyerBase64(eventoData.flyer_url);

    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*')
      .eq('evento_id', id)
      .order('created_at', { ascending: false });

    if (ticketsData) {
      setTicketsGenerados(ticketsData);
      if (ticketsData.length > 0) {
        setQrActual(ticketsData[0].codigo_qr);
        setNombreActual(ticketsData[0].nombre_asistente);
      }
    }

    setLoading(false);
  };

  // Cargar imagen local desde dispositivo
  const handleSubirFlyer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFlyerBase64(result);
        guardarFlyerEnBD(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarFlyerEnBD = async (base64Image: string) => {
    await supabase.from('eventos').update({ flyer_url: base64Image }).eq('id', id);
  };

  const handleGenerarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreAsistente.trim()) return;

    const capacidadMax = evento?.capacidad || 50;
    if (ticketsGenerados.length >= capacidadMax) {
      alert(`Límite alcanzado de ${capacidadMax} asistentes.`);
      return;
    }

    setGenerando(true);
    const codigoUnico = generarCodigoSeguro();

    const { data, error } = await supabase
      .from('tickets')
      .insert([{ evento_id: id, codigo_qr: codigoUnico, nombre_asistente: nombreAsistente }])
      .select();

    if (!error && data) {
      setTicketsGenerados([data[0], ...ticketsGenerados]);
      setQrActual(codigoUnico);
      setNombreActual(nombreAsistente);
      setNombreAsistente('');
    }

    setGenerando(false);
  };

  const descargarPNG = async () => {
    if (ticketRef.current === null) return;
    const dataUrl = await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `V-PASS_${nombreActual.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  };

  const descargarPDF = async () => {
    if (ticketRef.current === null) return;
    const dataUrl = await toPng(ticketRef.current, { cacheBust: true, pixelRatio: 2 });
    const pdf = new jsPDF('p', 'mm', 'a5');
    pdf.addImage(dataUrl, 'PNG', 14, 15, 120, 180);
    pdf.save(`V-PASS_${nombreActual.replace(/\s+/g, '_')}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-amber-400 font-semibold">Cargando diseñador V-PASS...</p>
      </div>
    );
  }

  const capacidadMax = evento?.capacidad || 50;
  const cuposDisponibles = capacidadMax - ticketsGenerados.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="text-amber-400 hover:text-amber-300 font-bold text-sm flex items-center gap-1"
        >
          ← Volver a Mis Eventos
        </button>
        <div className="text-right">
          <h1 className="text-xl font-bold text-white">{evento?.nombre}</h1>
          <p className="text-xs text-slate-400">📅 {evento?.fecha} | 🕒 {evento?.hora || '20:00'}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lado Izquierdo: Controles del QR, Flyer y Formulario */}
        <div className="space-y-6">
          
          {/* Subir Flyer y Deslizadores de QR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">🎨 Diseño del Flyer y QR Libre</h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Subir Imagen / Flyer (JPG o PNG)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleSubirFlyer}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Posición Horizontal (X)</span>
                  <span>{qrPosX}%</span>
                </div>
                <input 
                  type="range" min="10" max="90" value={qrPosX} 
                  onChange={(e) => setQrPosX(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Posición Vertical (Y)</span>
                  <span>{qrPosY}%</span>
                </div>
                <input 
                  type="range" min="15" max="85" value={qrPosY} 
                  onChange={(e) => setQrPosY(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Tamaño del QR</span>
                  <span>{qrSize}px</span>
                </div>
                <input 
                  type="range" min="70" max="180" value={qrSize} 
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Formulario de Emisión */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Emitir Pase V-PASS</h2>
              <span className="text-xs text-slate-400">Cupos: {ticketsGenerados.length}/{capacidadMax}</span>
            </div>

            <form onSubmit={handleGenerarTicket} className="space-y-3">
              <input 
                type="text" 
                required
                value={nombreAsistente}
                onChange={(e) => setNombreAsistente(e.target.value)}
                placeholder="Nombre completo del asistente"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button 
                type="submit"
                disabled={generando || cuposDisponibles <= 0}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition disabled:opacity-50"
              >
                {generando ? 'Generando...' : cuposDisponibles <= 0 ? 'Sin Cupos' : 'Generar Pase V-PASS'}
              </button>
            </form>
          </div>

          {/* Historial */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Pases Emitidos ({ticketsGenerados.length})</h3>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {ticketsGenerados.map((t) => (
                <div 
                  key={t.id} 
                  className={`flex justify-between items-center p-3 rounded-xl text-xs border transition ${
                    qrActual === t.codigo_qr ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div 
                    onClick={() => {
                      setQrActual(t.codigo_qr);
                      setNombreActual(t.nombre_asistente);
                    }}
                    className="cursor-pointer flex-1"
                  >
                    <p className="font-bold text-white">{t.nombre_asistente}</p>
                    <p className="text-[10px] text-amber-400 font-mono">{t.codigo_qr}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${t.ingresado ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {t.ingresado ? 'Usado' : 'Disponible'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Canvas con Posicionamiento Absoluto Dinámico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
          <h2 className="text-sm font-bold text-white mb-4 self-start uppercase tracking-wider">Vista Previa Interactiva (A5)</h2>

          <div 
            ref={ticketRef} 
            className="w-full max-w-xs bg-slate-950 border-2 border-amber-500 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between text-white"
            style={{
              minHeight: '420px',
              backgroundImage: flyerBase64 ? `url(${flyerBase64})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-slate-950/40 pointer-events-none"></div>

            {/* Encabezado V-PASS */}
            <div className="relative z-10 p-4">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center font-black text-slate-950 text-[10px]">VP</div>
                <span className="font-extrabold text-sm text-white tracking-wider">V-PASS</span>
              </div>
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">{evento?.nombre}</p>
            </div>

            {/* QR en Posición Flotante Libre */}
            <div 
              className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
              style={{
                left: `${qrPosX}%`,
                top: `${qrPosY}%`,
              }}
            >
              <div className="bg-white p-2 rounded-2xl shadow-2xl border-2 border-amber-500 inline-block">
                {qrActual ? (
                  <QRCodeSVG value={qrActual} size={qrSize} />
                ) : (
                  <p className="text-[10px] text-slate-500 p-4">Sin ticket</p>
                )}
              </div>
            </div>

            {/* Pie de Asistente */}
            <div className="relative z-10 m-4 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 text-center">
              <p className="text-xs font-extrabold text-white">{nombreActual}</p>
              <p className="text-[10px] text-amber-400 font-mono font-bold tracking-widest">{qrActual || 'VPASS-XXXX-XXXX'}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full max-w-xs mt-6">
            <button onClick={descargarPNG} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg text-xs border border-slate-700 transition">
              Descargar Imagen
            </button>
            <button onClick={descargarPDF} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition">
              Descargar PDF A5
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}