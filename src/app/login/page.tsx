'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setCargando(false)

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      router.push('/inicio')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h1>
        <p className="text-sm text-[#9a9a9a] mb-6">Entra con tu cuenta de SparPe</p>

        <form onSubmit={handleLogin}>
          <label className="text-sm text-[#9a9a9a] mb-1 block">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4"
          />
          <label className="text-sm text-[#9a9a9a] mb-1 block">Contraseña</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-6"
          />
          <button type="submit" disabled={cargando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
        <p className="text-sm text-[#9a9a9a] mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-[#e29b9b] hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}