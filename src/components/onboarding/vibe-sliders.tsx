'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VibeSliderProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (value: number) => void
}

function VibeSlider({ label, leftLabel, rightLabel, value, onChange }: VibeSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={0}
        max={100}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

interface VibeSlidersProps {
  tone: number
  expertise: number
  style: number
  onToneChange: (value: number) => void
  onExpertiseChange: (value: number) => void
  onStyleChange: (value: number) => void
}

export function VibeSliders({
  tone,
  expertise,
  style,
  onToneChange,
  onExpertiseChange,
  onStyleChange,
}: VibeSlidersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>L'Ambiance</CardTitle>
        <CardDescription>
          Ajustez ces curseurs pour définir le style de communication de votre marque
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VibeSlider
          label="Tonalité"
          leftLabel="Formel"
          rightLabel="Amical"
          value={tone}
          onChange={onToneChange}
        />
        <VibeSlider
          label="Expertise"
          leftLabel="Vulgarisé"
          rightLabel="Très technique"
          value={expertise}
          onChange={onExpertiseChange}
        />
        <VibeSlider
          label="Style"
          leftLabel="Minimaliste"
          rightLabel="Riche en emojis"
          value={style}
          onChange={onStyleChange}
        />
      </CardContent>
    </Card>
  )
}

