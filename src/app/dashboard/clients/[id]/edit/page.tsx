import { createClient } from '@/lib/supabase/server'
import { ClientForm } from '@/components/clients/client-form'
import { notFound } from 'next/navigation'

export default async function EditClientPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="text-muted-foreground">
          Update client information
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  )
}
