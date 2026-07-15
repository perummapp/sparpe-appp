'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
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
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm card-surface rounded-2xl p-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
        <p className="text-sm text-muted mb-6">Únete al registro oficial de SparPe</p>

        <form onSubmit={handleRegistro}>
          <label className="text-sm text-muted mb-1 block">Nombre y apellido</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
            className="w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-4" />

          <label className="text-sm text-muted mb-1 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-4" />

          <label className="text-sm text-muted mb-1 block">Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-6" />

          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.09 }}
            type="submit" disabled={cargando}
            className="btn-primary w-full text-white font-medium rounded-lg py-2.5 disabled:opacity-50"
          >
            {cargando ? 'Creando...' : 'Crear cuenta'}
          </motion.button>
        </form>

        {mensaje && <p className="text-sm text-accent-light mt-4">{mensaje}</p>}
        <p className="text-sm text-muted mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent-light hover:underline">Inicia sesión</Link>
        </p>
      </motion.div>
    </div>
  )
}
