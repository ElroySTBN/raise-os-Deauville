import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajouter un nouveau client</h1>
        <p className="text-muted-foreground">
          Créez un nouvel enregistrement client dans la base de données
        </p>
      </div>
      <ClientForm />
    </div>
  )
}
