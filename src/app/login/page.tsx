'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
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
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm card-surface rounded-2xl p-8"
      >
        <h1 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h1>
        <p className="text-sm text-muted mb-6">Entra con tu cuenta de SparPe</p>

        <form onSubmit={handleLogin}>
          <label className="text-sm text-muted mb-1 block">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-4"
          />
          <label className="text-sm text-muted mb-1 block">Contraseña</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-surface border border-border input-glow rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#6b6b6b] mb-6"
          />
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.09 }}
            type="submit" disabled={cargando}
            className="btn-primary w-full text-white font-medium rounded-lg py-2.5 disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </motion.button>
        </form>

        {mensaje && <p className="text-sm text-accent-light mt-4">{mensaje}</p>}
        <p className="text-sm text-muted mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-accent-light hover:underline">Regístrate</Link>
        </p>
      </motion.div>
    </div>
  )
}
