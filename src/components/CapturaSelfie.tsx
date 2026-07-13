'use client'

import { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Props = {
  userId: string
  onSubida: (url: string) => void
}

const MARCO = 240 // tamaño del círculo en px

export default function CapturaSelfie({ userId, onSubida }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [estado, setEstado] = useState<'inicial' | 'camara' | 'preview' | 'subiendo' | 'error'>('inicial')
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState('')
  const [error, setError] = useState('')

  const detenerCamara = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    return () => detenerCamara()
  }, [])

  // Se ejecuta DESPUÉS de que React monta el <video> (cuando estado pasa a 'camara'),
  // que es el único momento en que videoRef.current existe de verdad.
  // Antes se intentaba asignar el stream antes de que el elemento existiera,
  // por eso la cámara se veía negra en todas las plataformas.
  useEffect(() => {
    if (estado === 'camara' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [estado])

  const abrirCamara = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setEstado('camara')
    } catch {
      setError('No se pudo acceder a la cámara. Revisa que le hayas dado permiso a este sitio en tu navegador.')
      setEstado('error')
    }
  }

  const tomarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      setFotoBlob(blob)
      setFotoPreviewUrl(URL.createObjectURL(blob))
      detenerCamara()
      setEstado('preview')
    }, 'image/jpeg', 0.9)
  }

  const repetir = () => {
    setFotoBlob(null)
    setFotoPreviewUrl('')
    abrirCamara()
  }

  const confirmar = async () => {
    if (!fotoBlob) return
    setEstado('subiendo')
    setError('')

    const path = `${userId}/selfie.jpg`
    const { error: subirError } = await supabase.storage
      .from('selfies')
      .upload(path, fotoBlob, { upsert: true, contentType: 'image/jpeg' })

    if (subirError) {
      setError('No se pudo subir la foto: ' + subirError.message)
      setEstado('error')
      return
    }

    const { data: urlData } = supabase.storage.from('selfies').getPublicUrl(path)
    const urlConCache = `${urlData.publicUrl}?t=${Date.now()}`

    const { error: guardarError } = await supabase.from('perfiles').update({ foto_url: urlConCache }).eq('id', userId)

    if (guardarError) {
      setError('La foto se subió pero no se pudo guardar en tu perfil: ' + guardarError.message)
      setEstado('error')
      return
    }

    onSubida(urlConCache)
    setEstado('inicial')
  }

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
      <p className="text-xs text-[#9a9a9a] mb-3">
        Foto real verificada por cámara — es una capa de confianza, no una verificación de identidad. No se aceptan fotos desde galería.
      </p>

      {estado === 'inicial' && (
        <button type="button" onClick={abrirCamara}
          className="bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg px-4 py-2 transition">
          Abrir cámara
        </button>
      )}

      {estado === 'camara' && (
        <div>
          <div className="mx-auto mb-3 rounded-full overflow-hidden border-2 border-[#a32d2d] bg-black"
            style={{ width: MARCO, height: MARCO }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <button type="button" onClick={tomarFoto}
            className="w-full bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 transition">
            Tomar foto
          </button>
        </div>
      )}

      {estado === 'preview' && fotoPreviewUrl && (
        <div>
          <div className="mx-auto mb-3 rounded-full overflow-hidden border-2 border-[#a32d2d]"
            style={{ width: MARCO, height: MARCO }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPreviewUrl} alt="Selfie capturada" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={confirmar}
              className="flex-1 bg-[#a32d2d] hover:bg-[#8f2626] text-white text-sm font-medium rounded-lg py-2.5 transition">
              Usar esta foto
            </button>
            <button type="button" onClick={repetir}
              className="flex-1 border border-[#333] text-[#9a9a9a] text-sm rounded-lg py-2.5">
              Repetir
            </button>
          </div>
        </div>
      )}

      {estado === 'subiendo' && <p className="text-sm text-[#9a9a9a]">Subiendo foto...</p>}

      {error && <p className="text-sm text-[#e29b9b] mt-3">{error}</p>}
      {estado === 'error' && (
        <button type="button" onClick={abrirCamara} className="text-sm text-[#e29b9b] hover:underline mt-2">
          Intentar de nuevo
        </button>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}