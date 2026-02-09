'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { verifyOwnerPin, setRole, getRole } from '../../lib/auth'
import { ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [pin, setPin] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const role = getRole()
    if (role === 'owner') {
      router.replace('/')
    }
  }, [router])

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (verifyOwnerPin(pin)) {
      setRole('owner')
      router.replace('/')
    } else {
      setError('Invalid PIN')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <ShieldCheck className="w-6 h-6 text-primary-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Owner Access</h1>
        </div>
        <div className="max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Enter owner PIN to unlock owner pages.</p>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
              placeholder="Owner PIN"
              required
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
