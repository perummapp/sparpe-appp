'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Resultado = {
  id: string; peleador_id: string; rival_id: string | null; rival_nombre: string
  fecha: string; disciplina: string; categoria_peso: string; resultado: string; contexto: string; estado: string
}

export default function ResultadosPage() {
  const [cargando, setCargando] = useState(true)
  const [userId, setUserId] = useState('')
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
      await cargarResultados(userData.user.id)
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
    return <p className="min-h-screen bg-[#0d0d0d] text-[#9a9a9a] flex items-center justify-center">Cargando...</p>
  }

  const estadoColor = (estado: string) =>
    estado === 'verificado' ? 'text-green-400' : estado === 'disputado' ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mis resultados</h1>
          <Link href="/resultados/nuevo" className="text-sm text-[#e29b9b] hover:underline">+ Nuevo</Link>
        </div>

        {mensaje && <p className="text-sm text-[#e29b9b] mb-4">{mensaje}</p>}
        {resultados.length === 0 && <p className="text-sm text-[#9a9a9a]">Todavía no tienes resultados cargados.</p>}

        <div className="space-y-3">
          {resultados.map((r) => {
            const soyElRival = r.rival_id === userId
            const puedoResponder = soyElRival && r.estado === 'pendiente'
            return (
              <div key={r.id} className="bg-[#161616] border border-[#262626] rounded-xl p-4">
                <p className="text-white font-medium">{r.peleador_id === userId ? `vs. ${r.rival_nombre}` : 'Cargado por el rival'}</p>
                <p className="text-sm text-[#9a9a9a] mt-1">{r.fecha} · {r.disciplina} · {r.categoria_peso} · {r.contexto}</p>
                <p className="text-sm text-[#9a9a9a] mt-1">Resultado (según quien cargó): <span className="text-white">{r.resultado}</span></p>
                <p className="text-sm mt-1">Estado: <span className={`font-medium ${estadoColor(r.estado)}`}>{r.estado}</span></p>
                {puedoResponder && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => actualizarEstado(r.id, 'verificado')}
                      className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm rounded-lg px-3 py-1.5 transition">Confirmar</button>
                    <button onClick={() => actualizarEstado(r.id, 'disputado')}
                      className="border border-[#a32d2d] text-[#e29b9b] text-sm rounded-lg px-3 py-1.5 hover:bg-[#a32d2d] hover:text-white transition">Disputar</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}