import { createClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/clients/client-form'
import { notFound } from 'next/navigation'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le client</h1>
        <p className="text-muted-foreground">
          Mettez à jour les informations du client
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  )
}
