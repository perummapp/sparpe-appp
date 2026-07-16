'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabaseClient'

type Resultado = {
  id: string; peleador_id: string; rival_id: string | null; rival_nombre: string
  fecha: string; disciplina: string; categoria_peso: string; resultado: string; contexto: string; estado: string
}

export default function ResultadosPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [esProfesional, setEsProfesional] = useState(false)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  const cargarResultados = async (uid: string) => {
    const { data } = await supabase.from('resultados').select('*')
      .or(`peleador_id.eq.${uid},rival_id.eq.${uid}`).order('fecha', { ascending: false })
    setResultados(data ?? [])
  }

  useEffect(() => {
    const iniciar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('es_profesional')
        .eq('id', userData.user.id)
        .single()

      const profesional = perfil?.es_profesional ?? false
      setEsProfesional(profesional)

      if (profesional) {
        await cargarResultados(userData.user.id)
      }

      setCargando(false)
    }
    iniciar()
  }, [router])

  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    setMensaje('')
    const { error } = await supabase.from('resultados').update({ estado: nuevoEstado }).eq('id', id)
    if (error) setMensaje('Error: ' + error.message)
    else await cargarResultados(userId)
  }

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-muted flex items-center justify-center">Cargando...</p>
  }

  if (!esProfesional) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm card-surface rounded-2xl p-8 text-center"
        >
          <h1 className="text-xl font-bold text-white mb-3">Mis resultados</h1>
          <p className="text-sm text-muted mb-6">
            Esta sección es solo para peleadores con trayectoria profesional o amateur verificada — un historial oficial de peleas reales, distinto de tus sparrings informales.
          </p>
          <Link
            href="/resultados/solicitar-profesional"
            className="btn-primary block w-full text-center text-white text-sm font-medium rounded-lg py-2.5"
          >
            Solicitar acceso
          </Link>
          <Link href="/inicio" className="text-sm text-accent-light hover:underline block mt-5">← Inicio</Link>
        </motion.div>
      </div>
    )
  }

  const estadoColor = (estado: string) =>
    estado === 'verificado' ? 'text-green-400' : estado === 'disputado' ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mis resultados</h1>
          <Link href="/resultados/nuevo" className="text-sm text-accent-light hover:underline">+ Nuevo</Link>
        </div>

        {mensaje && <p className="text-sm text-accent-light mb-4">{mensaje}</p>}
        {resultados.length === 0 && <p className="text-sm text-muted">Todavía no tienes resultados cargados.</p>}

        <div className="space-y-3">
          {resultados.map((r, index) => {
            const soyElRival = r.rival_id === userId
            const puedoResponder = soyElRival && r.estado === 'pendiente'
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
                className="card-surface rounded-xl p-4"
              >
                <p className="text-white font-medium">{r.peleador_id === userId ? `vs. ${r.rival_nombre}` : 'Cargado por el rival'}</p>
                <p className="text-sm text-muted mt-1">{r.fecha} · {r.disciplina} · {r.categoria_peso} · {r.contexto}</p>
                <p className="text-sm text-muted mt-1">Resultado (según quien cargó): <span className="text-white">{r.resultado}</span></p>
                <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(r.estado)}`}>{r.estado}</span></p>
                {puedoResponder && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => actualizarEstado(r.id, 'verificado')}
                      className="btn-primary text-white text-sm rounded-lg px-3 py-1.5">Confirmar</button>
                    <button onClick={() => actualizarEstado(r.id, 'disputado')}
                      className="btn-secondary text-accent-light text-sm rounded-lg px-3 py-1.5">Disputar</button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
