'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const diasCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatoLegible(fechaISO: string) {
  if (!fechaISO) return ''
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return `${diasCorto[fecha.getDay()]} ${dia} ${meses[mes - 1].slice(0, 3)}`
}

function aISO(anio: number, mes: number, dia: number) {
  const mm = String(mes + 1).padStart(2, '0')
  const dd = String(dia).padStart(2, '0')
  return `${anio}-${mm}-${dd}`
}

export default function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const hoy = new Date()
  const [abierto, setAbierto] = useState(false)
  const [mesVisible, setMesVisible] = useState(() => {
    if (value) {
      const [anio, mes] = value.split('-').map(Number)
      return new Date(anio, mes - 1, 1)
    }
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  })

  const anio = mesVisible.getFullYear()
  const mes = mesVisible.getMonth()

  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const hoyISO = aISO(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const cambiarMes = (delta: number) => setMesVisible(new Date(anio, mes + delta, 1))

  const seleccionar = (dia: number) => {
    onChange(aISO(anio, mes, dia))
    setAbierto(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none focus:border-[#a32d2d]"
      >
        <span className={value ? 'text-white' : 'text-[#6b6b6b]'}>
          {value ? formatoLegible(value) : (placeholder || 'Selecciona una fecha')}
        </span>
        <CalendarIcon size={16} className="text-[#9a9a9a]" />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute z-50 mt-2 w-64 bg-[#161616] border border-[#262626] rounded-xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => cambiarMes(-1)} className="p-1 text-[#9a9a9a] hover:text-white">
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm text-white font-medium">{meses[mes]} {anio}</p>
              <button type="button" onClick={() => cambiarMes(1)} className="p-1 text-[#9a9a9a] hover:text-white">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {diasSemana.map((d) => (
                <div key={d} className="text-center text-[10px] text-[#6b6b6b] font-medium py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {celdas.map((dia, i) => {
                if (dia === null) return <div key={`vacio-${i}`} />
                const iso = aISO(anio, mes, dia)
                const esSeleccionado = iso === value
                const esHoy = iso === hoyISO
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => seleccionar(dia)}
                    className={`aspect-square rounded-lg text-xs flex items-center justify-center transition
                      ${esSeleccionado ? 'bg-[#a32d2d] text-white font-medium' : 'text-[#d8d8d8] hover:bg-[#262626]'}
                      ${esHoy && !esSeleccionado ? 'border border-[#a32d2d]' : ''}`}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}