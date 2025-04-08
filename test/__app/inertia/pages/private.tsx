import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'

import PrivateController from '#controllers/private_controller'

export default function PrivatePage({ user }: InferPageProps<PrivateController, 'index'>) {
  return (
    <>
      <Head title="Private Page" />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-blue-600 font-bold text-xl">Private Page</h1>
        <h2 className="text-gray-700 text-lg mt-2">Hi {user.email}!</h2>
        <p className="italic mt-2">This page is only accessible to authenticated users.</p>
      </div>
    </>
  )
}
