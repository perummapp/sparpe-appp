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
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Hero de fondo. Reemplaza la ruta por tu propia imagen en /public
          (ej. /public/hero-login.jpg -> src="/hero-login.jpg"). Mientras
          no exista el archivo, el degradado de abajo se ve solo, sin romper
          nada — no hace falta la imagen para que esta pantalla funcione. */}
      <div className="absolute inset-0 -z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-login.jpg"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>

      {/* Degradado radial oscuro, siempre presente (funciona como fondo
          base y como overlay sobre la foto para que el texto no pierda
          contraste). */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.85) 55%, #0d0d0d 100%), linear-gradient(180deg, #0d0d0d 0%, #0d0d0d 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm card-surface rounded-2xl p-8 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(22,22,22,0.85)' }}
      >
        {/* Energía viva: halo que respira detrás del título, cada 6s,
            igual patrón que "disponible" en /sparring — no es el Energy
            Sweep (ese queda reservado para acciones puntuales, como pide
            la guía de motion). */}
        <div className="relative mb-1 inline-block">
          <div className="absolute -inset-3 rounded-full halo-pulse pointer-events-none" />
          <h1 className="relative text-2xl font-bold text-white">Iniciar sesión</h1>
        </div>
        <p className="text-sm text-muted mb-6">Entra con tu cuenta</p>

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
