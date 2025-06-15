'use client'

import { Loader2 } from 'lucide-react'

export default function Loader() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
}