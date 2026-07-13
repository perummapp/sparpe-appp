export type RangoPeso = {
  value: string
  label: string
  min: number
  max: number | null
}

export const RANGOS_PESO: RangoPeso[] = [
  { value: 'menos-45', label: 'Menos de 45 kg', min: 0, max: 45 },
  { value: '45-50', label: '45 - 50 kg', min: 45, max: 50 },
  { value: '50-55', label: '50 - 55 kg', min: 50, max: 55 },
  { value: '55-60', label: '55 - 60 kg', min: 55, max: 60 },
  { value: '60-65', label: '60 - 65 kg', min: 60, max: 65 },
  { value: '65-70', label: '65 - 70 kg', min: 65, max: 70 },
  { value: '70-75', label: '70 - 75 kg', min: 70, max: 75 },
  { value: '75-80', label: '75 - 80 kg', min: 75, max: 80 },
  { value: '80-85', label: '80 - 85 kg', min: 80, max: 85 },
  { value: '85-90', label: '85 - 90 kg', min: 85, max: 90 },
  { value: '90-95', label: '90 - 95 kg', min: 90, max: 95 },
  { value: '95-100', label: '95 - 100 kg', min: 95, max: 100 },
  { value: '100-105', label: '100 - 105 kg', min: 100, max: 105 },
  { value: '105-110', label: '105 - 110 kg', min: 105, max: 110 },
  { value: '110-115', label: '110 - 115 kg', min: 110, max: 115 },
  { value: '115-120', label: '115 - 120 kg', min: 115, max: 120 },
  { value: '120-mas', label: '120+ kg', min: 120, max: null },
]

export function etiquetaPeso(kg: number | null | undefined): string {
  if (kg === null || kg === undefined) return 'Sin registrar'
  const rango = RANGOS_PESO.find((r) => kg >= r.min && (r.max === null || kg < r.max))
  return rango ? rango.label : 'Sin registrar'
}

export function pesoEnRango(kg: number | null | undefined, rangoValue: string): boolean {
  if (kg === null || kg === undefined) return false
  const rango = RANGOS_PESO.find((r) => r.value === rangoValue)
  if (!rango) return false
  return kg >= rango.min && (rango.max === null || kg < rango.max)
}