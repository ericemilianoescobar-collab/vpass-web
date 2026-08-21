'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMensaje(error.message);
      setCargando(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl mx-auto flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="Logo V-PASS" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-sm font-bold text-cyan-400">VP</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Iniciar Sesión en V-PASS</h1>
          <p className="text-xs text-slate-400">Accede a tu panel de eventos VIP</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {mensaje && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-medium">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow-lg shadow-cyan-500/20"
          >
            {cargando ? 'Ingresando...' : 'Entrar a mi Cuenta'}
          </button>
        </form>

      </div>
    </div>
  );
}