'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } },
    })

    if (error) {
      setCargando(false)
      setMensaje('Error: ' + error.message)
      return
    }

    if (!data.session || !data.user) {
      setCargando(false)
      setMensaje('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.')
      return
    }

    await supabase.from('perfiles').upsert({
      id: data.user.id,
      nombre,
    })

    router.push('/inicio')
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[#161616] border border-[#262626] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
        <p className="text-sm text-[#9a9a9a] mb-6">Únete al registro oficial de SparPe</p>

        <form onSubmit={handleRegistro}>
          <label className="text-sm text-[#9a9a9a] mb-1 block">Nombre y apellido</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4" />

          <label className="text-sm text-[#9a9a9a] mb-1 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-4" />

          <label className="text-sm text-[#9a9a9a] mb-1 block">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#a32d2d] mb-6" />

          <button type="submit" disabled={cargando}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white font-medium rounded-lg py-2.5 transition disabled:opacity-50">
            {cargando ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        {mensaje && <p className="text-sm text-[#e29b9b] mt-4">{mensaje}</p>}
        <p className="text-sm text-[#9a9a9a] mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#e29b9b] hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}