'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Copy } from 'lucide-react'

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const

type DayKey = typeof DAYS[number]['key']

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  split_hours?: {
    morning_open: string
    morning_close: string
    afternoon_open: string
    afternoon_close: string
  }
}

interface ScheduleBuilderProps {
  schedule: Record<string, DaySchedule>
  onChange: (schedule: Record<string, DaySchedule>) => void
}

export function ScheduleBuilder({ schedule, onChange }: ScheduleBuilderProps) {
  const [splitHoursEnabled, setSplitHoursEnabled] = useState<Record<string, boolean>>({})

  const updateDay = (day: DayKey, updates: Partial<DaySchedule>) => {
    const current = schedule[day] || { open: '09:00', close: '18:00', closed: false }
    onChange({
      ...schedule,
      [day]: { ...current, ...updates },
    })
  }

  const copyMondayToAll = () => {
    const monday = schedule.monday || { open: '09:00', close: '18:00', closed: false }
    const newSchedule: Record<string, DaySchedule> = {}
    DAYS.forEach((day) => {
      newSchedule[day.key] = { ...monday }
    })
    onChange(newSchedule)
  }

  const toggleSplitHours = (day: DayKey) => {
    const enabled = !splitHoursEnabled[day]
    setSplitHoursEnabled({ ...splitHoursEnabled, [day]: enabled })
    
    if (enabled) {
      const current = schedule[day] || { open: '09:00', close: '18:00', closed: false }
      updateDay(day, {
        split_hours: {
          morning_open: current.open || '09:00',
          morning_close: '12:00',
          afternoon_open: '14:00',
          afternoon_close: current.close || '18:00',
        },
      })
    } else {
      updateDay(day, { split_hours: undefined })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Horaires d'ouverture</CardTitle>
            <CardDescription>Définissez votre planning hebdomadaire</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyMondayToAll}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copier le lundi sur tous les jours
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const daySchedule = schedule[day.key] || { open: '09:00', close: '18:00', closed: false }
          const hasSplitHours = splitHoursEnabled[day.key] || !!daySchedule.split_hours

          return (
            <div key={day.key} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{day.label}</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${day.key}-closed`}
                    checked={daySchedule.closed}
                    onCheckedChange={(checked) =>
                      updateDay(day.key, { closed: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`${day.key}-closed`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Fermé
                  </Label>
                </div>
              </div>

              {!daySchedule.closed && (
                <>
                  {!hasSplitHours ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Ouverture</Label>
                        <Input
                          type="time"
                          value={daySchedule.open || '09:00'}
                          onChange={(e) => updateDay(day.key, { open: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fermeture</Label>
                        <Input
                          type="time"
                          value={daySchedule.close || '18:00'}
                          onChange={(e) => updateDay(day.key, { close: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Horaires décalés (Fermé pour le déjeuner)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSplitHours(day.key)}
                        >
                          Désactiver
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Ouverture matin</Label>
                          <Input
                            type="time"
                            value={daySchedule.split_hours?.morning_open || '09:00'}
                            onChange={(e) =>
                              updateDay(day.key, {
                                split_hours: {
                                  ...daySchedule.split_hours!,
                                  morning_open: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Fermeture matin</Label>
                          <Input
                            type="time"
                            value={daySchedule.split_hours?.morning_close || '12:00'}
                            onChange={(e) =>
                              updateDay(day.key, {
                                split_hours: {
                                  ...daySchedule.split_hours!,
                                  morning_close: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Ouverture après-midi</Label>
                          <Input
                            type="time"
                            value={daySchedule.split_hours?.afternoon_open || '14:00'}
                            onChange={(e) =>
                              updateDay(day.key, {
                                split_hours: {
                                  ...daySchedule.split_hours!,
                                  afternoon_open: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Fermeture après-midi</Label>
                          <Input
                            type="time"
                            value={daySchedule.split_hours?.afternoon_close || '18:00'}
                            onChange={(e) =>
                              updateDay(day.key, {
                                split_hours: {
                                  ...daySchedule.split_hours!,
                                  afternoon_close: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasSplitHours && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSplitHours(day.key)}
                      className="w-full"
                    >
                      Activer les horaires décalés (Fermé pour le déjeuner)
                    </Button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

