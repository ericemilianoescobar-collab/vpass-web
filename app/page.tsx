'use client';

import Link from 'next/link';

export default function Home() {
  const planes = [
    {
      nombre: 'Plan Básico',
      precio: 'S/ 99',
      descripcion: 'Perfecto para eventos pequeños y pruebas.',
      detalles: ['🎟️ Hasta 150 Entradas', '📱 1 Acceso para Validador'],
      link: `https://wa.me/51921543755?text=${encodeURIComponent('¡Hola V-PASS! 👋 Quisiera adquirir el Plan Básico de S/ 99.')}`,
      popular: false,
    },
    {
      nombre: 'Plan Estándar',
      precio: 'S/ 150',
      descripcion: 'Ideal para eventos medianos.',
      detalles: ['🎟️ Hasta 300 Entradas', '📱 2 Accesos para Validadores en simultáneo'],
      link: `https://wa.me/51921543755?text=${encodeURIComponent('¡Hola V-PASS! 👋 Quisiera adquirir el Plan Estándar de S/ 150.')}`,
      popular: true,
    },
    {
      nombre: 'Plan Premium',
      precio: 'S/ 200',
      descripcion: 'Para grandes producciones y recintos masivos.',
      detalles: ['🎟️ Hasta 500 Entradas', '📱 5 Accesos para Validadores en simultáneo'],
      link: `https://wa.me/51921543755?text=${encodeURIComponent('¡Hola V-PASS! 👋 Quisiera adquirir el Plan Premium de S/ 200.')}`,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Navegación */}
      <header className="max-w-6xl mx-auto w-full p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-amber-500/20">
            VP
          </div>
          <span className="text-xl font-black text-white tracking-wider">V-PASS</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 px-4 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10"
          >
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero Principal */}
      <main className="max-w-6xl mx-auto w-full px-6 py-12 space-y-16 text-center">
        <div className="space-y-4 max-w-3xl mx-auto">
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Sistema Inteligente de Control de Acceso y Tickets QR
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
            Crea flyers dinámicos y gestiona tus eventos VIP
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Diseña pases personalizados, valida accesos en tiempo real sin duplicaciones y gestiona tus eventos de forma simple con V-PASS.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition shadow-xl shadow-amber-500/20"
            >
              Ingresar a V-PASS
            </Link>
            <a
              href="#planes"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm px-6 py-3 rounded-xl border border-slate-800 transition"
            >
              Ver Planes Disponibles
            </a>
          </div>
        </div>

        {/* Sección de Planes */}
        <section id="planes" className="space-y-8 pt-8">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Planes V-PASS</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Selecciona el plan que mejor se adapte a tu evento y actívalo al instante por WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {planes.map((pkg, idx) => (
              <div
                key={idx}
                className={`relative bg-slate-900 border ${
                  pkg.popular ? 'border-amber-500 shadow-xl shadow-amber-500/10' : 'border-slate-800'
                } rounded-2xl p-6 flex flex-col justify-between space-y-6 transition hover:border-slate-700`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 right-6 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full">
                    Más Popular
                  </span>
                )}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">{pkg.nombre}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-400">{pkg.precio}</span>
                    <span className="text-xs font-semibold text-slate-400">/ evento</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{pkg.descripcion}</p>
                  
                  <ul className="space-y-2 pt-2 border-t border-slate-800">
                    {pkg.detalles.map((detalle, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 font-medium flex items-center gap-1.5 font-sans">
                        {detalle}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={pkg.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition shadow-md shadow-emerald-500/10 block"
                >
                  💬 Solicitar Plan por WhatsApp
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} V-PASS. Todos los derechos reservados.
      </footer>
    </div>
  );
}