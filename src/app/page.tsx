// Home page. Renders the main dashboard inside a Suspense boundary
// so the spinner shows while the dashboard's client-side data loads.

import { Suspense } from 'react'
import ModernDashboard from '@/components/ModernDashboard'

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ModernDashboard />
    </Suspense>
  )
}
