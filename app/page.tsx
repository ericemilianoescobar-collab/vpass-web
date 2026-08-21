'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* NAVEGACIÓN */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
              <span className="text-xs font-black text-amber-400">VP</span>
            </div>
            <span className="text-base font-black tracking-tight text-white">VPass</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón que apunta directamente a /validar */}
            <button
              onClick={() => router.push('/validar')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/50 border border-amber-800/60 px-3.5 py-2 rounded-xl transition"
            >
              🔑 Validador Puerta
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 transition"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-6 my-12 max-w-4xl mx-auto space-y-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full">
          Plataforma Profesional de Entradas & Control de Acceso
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Gestión inteligente de eventos, emisión de tickets y validación segura.
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Crea tu evento en segundos, posiciona tu QR sobre el flyer oficial, exporta en PDF A5 y otorga credenciales únicas a tu equipo de puerta con total control.
        </p>
      </section>

      {/* SECCIÓN DE PLANES Y PRECIOS */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-2xl font-black text-white">Planes a tu medida</h2>
          <p className="text-xs text-slate-400 mt-1">Selecciona el plan ideal para la escala de tu evento</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PLAN BÁSICO */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Plan Básico</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">S/ 99</span>
                <span className="text-xs text-slate-500">/ evento</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Ideal para eventos pequeños o fiestas privadas.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Hasta 300 Entradas / QRs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Diseñador QR sobre Flyer
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Exportación PDF A5
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Hasta 2 Validadores de Puerta
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Seleccionar Básico
            </button>
          </div>

          {/* PLAN ESTÁNDAR (RECOMENDADO) */}
          <div className="bg-slate-900 border-2 border-amber-500/80 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-2xl shadow-amber-950/50">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-slate-950 bg-amber-400 px-3 py-0.5 rounded-full">
              Más Popular
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Plan Estándar</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">S/ 150</span>
                <span className="text-xs text-slate-500">/ evento</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Perfecto para clubes, discotecas y conciertos medianos.</p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Hasta 1,000 Entradas / QRs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Diseñador QR con Logo Personalizado
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Exportación PDF A5 de Alta Calidad
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Hasta 5 Validadores de Puerta
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Reportes de Asistencia en Tiempo Real
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
            >
              Seleccionar Estándar
            </button>
          </div>

          {/* PLAN PREMIUM */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Plan Premium</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">S/ 200</span>
                <span className="text-xs text-slate-500">/ evento</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Para festivales y eventos masivos sin límites.</p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Entradas / QRs Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Personalización Completa de Marca
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Validadores de Puerta Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Soporte Prioritario 24/7
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span> Análisis Avanzado de Accesos
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Seleccionar Premium
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} VPass. Todos los derechos reservados.
      </footer>
    </div>
  );
}