'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'registro';

  const [isRegistro, setIsRegistro] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg('');

    try {
      if (isRegistro) {
        // Registro
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          setErrorMsg(error.message);
          setCargando(false);
          return;
        }

        if (data?.user) {
          // Intentar crear perfil básico
          await supabase.from('perfiles').upsert([
            { id: data.user.id, email: data.user.email, monedas: 50 }
          ]).catch(() => {});

          router.replace('/dashboard');
        }
      } else {
        // Inicio de sesión
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setErrorMsg('Error de acceso: ' + error.message);
          setCargando(false);
          return;
        }

        if (data?.session) {
          // Navegación forzada al Dashboard
          router.replace('/dashboard');
        } else {
          setErrorMsg('No se pudo establecer la sesión. Intenta nuevamente.');
          setCargando(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.');
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center font-black text-slate-950 text-xl mx-auto shadow-lg shadow-amber-500/20">
          VP
        </div>
        <h1 className="text-xl font-extrabold text-white tracking-wider">Acceso a V-PASS</h1>
        <p className="text-xs text-slate-400">Plataforma Oficial de Pases VIP y Entradas QR</p>
      </div>

      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => { setIsRegistro(false); setErrorMsg(''); }}
          className={`flex-1 py-2.5 rounded-lg transition ${
            !isRegistro ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => { setIsRegistro(true); setErrorMsg(''); }}
          className={`flex-1 py-2.5 rounded-lg transition ${
            isRegistro ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Crear Cuenta
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/10 disabled:opacity-50"
        >
          {cargando ? 'Ingresando a V-PASS...' : isRegistro ? 'Registrarse en V-PASS' : 'Ingresar a V-PASS'}
        </button>
      </form>

      <div className="text-center pt-2">
        <button
          onClick={() => router.push('/')}
          className="text-xs text-slate-500 hover:text-amber-400 transition"
        >
          ← Volver a la portada
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-amber-400 text-xs font-bold">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}