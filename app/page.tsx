'use client';

import Link from 'next/link';

export default function Home() {
  const planes = [
    {
      nombre: 'Plan Básico',
      precio: 'S/ 99',
      entradas: '150 Entradas VIP',
      validadores: '1 Validador (QR / Manual)',
      descripcion: 'Perfecto para fiestas privadas y eventos íntimos.',
      popular: false,
    },
    {
      nombre: 'Plan Estándar',
      precio: 'S/ 150',
      entradas: '300 Entradas VIP',
      validadores: '2 Validadores en Simultáneo',
      descripcion: 'Ideal para discotecas, clubes y eventos medianos.',
      popular: true,
    },
    {
      nombre: 'Plan Premium',
      precio: 'S/ 200',
      entradas: '500 Entradas VIP',
      validadores: '5 Validadores en Simultáneo',
      descripcion: 'Para grandes producciones, festivales y recintos masivos.',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Cabecera / Navegación */}
      <header className="max-w-7xl mx-auto w-full p-6 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-cyan-500/5">
            <img 
              src="/logo.png" 
              alt="V-PASS Logo" 
              className="w-full h-full object-contain" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-xs font-bold text-cyan-400">VP</span>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-wider block leading-none">V-PASS</span>
            <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">Access Systems</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-5 py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20"
          >
            Comenzar Ahora
          </Link>
        </div>
      </header>

      {/* Hero Principal */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-bold px-4 py-1.5 rounded-full shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Plataforma Profesional de Control de Accesos y Entradas QR
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Seguridad y Elegancia para tus Eventos VIP
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Elimina la duplicación de pases, controla los accesos en tiempo real con escáner QR y genera reportes detallados en Excel al finalizar.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs md:text-sm px-8 py-3.5 rounded-xl transition shadow-xl shadow-cyan-500/20"
            >
              Probar Sistema V-PASS
            </Link>
            <a
              href="#planes"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs md:text-sm px-8 py-3.5 rounded-xl border border-slate-800 transition"
            >
              Ver Planes y Precios
            </a>
          </div>
        </div>

        {/* Sección de Garantía y Confianza */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-2">
            <span className="text-2xl">🔒</span>
            <h3 className="font-bold text-white text-sm">QR Único Antifraude</h3>
            <p className="text-xs text-slate-400">Cada entrada cuenta con firma digital. Un pase escaneado no puede volver a ser reutilizado.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-2">
            <span className="text-2xl">⚡</span>
            <h3 className="font-bold text-white text-sm">Validación Ultra Rápida</h3>
            <p className="text-xs text-slate-400">Validación fluida mediante cámara móvil o digitación manual de código por parte de tus validadores.</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-2">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-white text-sm">Reportes en Excel</h3>
            <p className="text-xs text-slate-400">Descarga la lista de asistentes con nombre, fecha y hora exacta de registro directamente a Excel.</p>
          </div>
        </div>

        {/* Sección de Planes */}
        <section id="planes" className="space-y-10 pt-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white">Planes Comerciales</h2>
            <p className="text-xs md:text-sm text-slate-400">Selecciona el paquete adecuado para la escala de tu evento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-slate-900 border ${
                  plan.popular ? 'border-cyan-400 shadow-2xl shadow-cyan-500/10' : 'border-slate-800'
                } rounded-2xl p-7 flex flex-col justify-between space-y-6 transition hover:border-slate-700`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 bg-cyan-400 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
                    Recomendado
                  </span>
                )}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">{plan.nombre}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-cyan-400">{plan.precio}</span>
                    <span className="text-xs text-slate-500 font-semibold">/ por evento</span>
                  </div>
                  <p className="text-xs text-slate-400">{plan.descripcion}</p>
                  
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold">✓</span> {plan.entradas}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold">✓</span> {plan.validadores}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-200">
                      <span className="text-cyan-400 font-bold">✓</span> Exportación a Excel
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/51921543755?text=${encodeURIComponent(`¡Hola V-PASS! 👋 Deseo adquirir el ${plan.nombre} (${plan.precio}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition shadow-lg shadow-emerald-500/10 block"
                >
                  💬 Solicitar Plan vía WhatsApp
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} V-PASS Access Systems. Todos los derechos reservados.
      </footer>
    </div>
  );
}