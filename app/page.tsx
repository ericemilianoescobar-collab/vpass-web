'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const TELEFONO_WHATSAPP = '51987654321';

  const comprarMonedasWhatsApp = (monedas: number, precioSoles: number) => {
    const mensaje = encodeURIComponent(
      `¡Hola V-PASS! 👋 Quisiera adquirir el paquete de ${monedas} monedas V-PASS por S/ ${precioSoles} para mis eventos.`
    );
    window.open(`https://wa.me/${TELEFONO_WHATSAPP}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      <nav className="max-w-7xl mx-auto w-full p-6 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm shadow-lg shadow-amber-500/20">
            VP
          </div>
          <span className="font-extrabold text-lg text-white tracking-wider">V-PASS</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => router.push('/login?tab=registro')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-amber-500/10"
          >
            Registrarse
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-block bg-slate-900 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold tracking-wide">
          🎟️ Sistema Inteligente de Control de Acceso y Tickets QR
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
          Crea flyers dinámicos y <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
            gestiona tus eventos VIP
          </span>
        </h1>

        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Diseña pases personalizados con posicionamiento libre de código QR, valida accesos en tiempo real sin duplicaciones y gestiona tus eventos de forma simple con **V-PASS**.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition shadow-xl shadow-amber-500/20"
          >
            Ingresar a V-PASS
          </button>
          <a
            href="#paquetes"
            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm border border-slate-800 transition"
          >
            Ver Paquetes de Monedas
          </a>
        </div>

        <section id="paquetes" className="pt-20 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-white">Adquiere Monedas V-PASS</h2>
            <p className="text-xs text-slate-400 mt-1">Recibe el doble de monedas por cada sol. Recarga al instante por WhatsApp.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">Paquete Inicial</h3>
                <p className="text-xs text-slate-400">Perfecto para tu primer evento</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">🪙 200</span>
                  <span className="text-xs text-slate-400">(S/ 100)</span>
                </div>
              </div>
              <button
                onClick={() => comprarMonedasWhatsApp(200, 100)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs border border-amber-500/20 transition flex items-center justify-center gap-2"
              >
                💬 Recargar por WhatsApp
              </button>
            </div>

            <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-2xl shadow-amber-500/10 relative">
              <span className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Más Popular
              </span>
              <div>
                <h3 className="font-bold text-white text-lg">Paquete Pro</h3>
                <p className="text-xs text-slate-400">Para eventos medianos y recurrentes</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">🪙 300</span>
                  <span className="text-xs text-slate-400">(S/ 150)</span>
                </div>
              </div>
              <button
                onClick={() => comprarMonedasWhatsApp(300, 150)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                💬 Recargar por WhatsApp
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">Paquete Premium</h3>
                <p className="text-xs text-slate-400">Para varias fechas o producciones masivas</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-400">🪙 500</span>
                  <span className="text-xs text-slate-400">(S/ 250)</span>
                </div>
              </div>
              <button
                onClick={() => comprarMonedasWhatsApp(500, 250)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs border border-amber-500/20 transition flex items-center justify-center gap-2"
              >
                💬 Recargar por WhatsApp
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 V-PASS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}