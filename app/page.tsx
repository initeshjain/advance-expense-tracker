'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/Dashboard'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return <Dashboard />
}