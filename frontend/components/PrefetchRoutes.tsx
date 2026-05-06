'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const ROUTES_TO_PREFETCH = [
  '/login',
  '/signup',
  '/patient-dashboard',
  '/doctor-dashboard',
  '/detection',
  '/companion',
  '/companion/life-story',
  '/explainable-ai',
]

export default function PrefetchRoutes() {
  const router = useRouter()
  const hasWarmed = useRef(false)

  useEffect(() => {
    if (hasWarmed.current) return
    hasWarmed.current = true

    const warmUp = async () => {
      for (const route of ROUTES_TO_PREFETCH) {
        router.prefetch(route)
      }
      for (const route of ROUTES_TO_PREFETCH) {
        try {
          await fetch(route, { priority: 'low' as RequestPriority })
        } catch {}
        await new Promise(r => setTimeout(r, 200))
      }
    }

    const timer = setTimeout(warmUp, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return null
}
