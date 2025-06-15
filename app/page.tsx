'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/Dashboard'
import Loader from '@/components/Loader'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Loader />
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return <Dashboard />
}