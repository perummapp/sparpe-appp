'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type SparringRealizado = {
  id: string
  solicitante_id: string
  solicitante_nombre: string
  receptor_id: string
  receptor_nombre: string
  fecha_propuesta: string
  gimnasio_propuesto: string
  realizado_en: string
}

export default function MisSparringPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
  const [historial, setHistorial] = useState<SparringRealizado[]>([])
  const router = useRouter()

  useEffect(() => {
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/login'); return }
      setUserId(userData.user.id)

      const { data } = await supabase
        .from('solicitudes_sparring')
        .select('id, solicitante_id, solicitante_nombre, receptor_id, receptor_nombre, fecha_propuesta, gimnasio_propuesto, realizado_en')
        .not('realizado_en', 'is', null)
        .or(`solicitante_id.eq.${userData.user.id},receptor_id.eq.${userData.user.id}`)
        .order('realizado_en', { ascending: false })

      setHistorial(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [router])

  if (cargando) {
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Mis sparring</h1>
          <Link href="/inicio" className="text-sm text-[#e29b9b] hover:underline">← Inicio</Link>
        </div>
        <p className="text-sm text-[#9a9a9a] mb-5">
          Historial de sparring confirmados por ambas partes. El sparring es entrenamiento: aquí no hay ganador ni perdedor.
        </p>

        {historial.length === 0 && (
          <p className="text-sm text-[#9a9a9a]">
            Todavía no tienes sparring confirmados. Cuando ambos confirmen uno desde{' '}
            <Link href="/solicitudes" className="text-[#e29b9b] hover:underline">Solicitudes</Link>, va a aparecer aquí.
          </p>
        )}

        <div className="space-y-3">
          {historial.map((h) => {
            const soyElSolicitante = h.solicitante_id === userId
            const nombreRival = soyElSolicitante ? h.receptor_nombre : h.solicitante_nombre
            const fecha = new Date(h.realizado_en)
            const fechaLegible = fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <div key={h.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
                <p className="text-white font-medium">vs. {nombreRival}</p>
                <p className="text-sm text-[#9a9a9a] mt-1">
                  {h.fecha_propuesta || 'Sin fecha propuesta'} · {h.gimnasio_propuesto || 'Lugar sin registrar'}
                </p>
                <p className="text-xs text-[#6b6b6b] mt-1">Confirmado el {fechaLegible}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}