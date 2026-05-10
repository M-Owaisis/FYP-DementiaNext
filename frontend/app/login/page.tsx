'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Brain,
  Lock,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const router = useRouter()
  const { login, user, refreshUser } = useAuth()
  const googleBtnRef = useRef<HTMLDivElement>(null)
  const refreshUserRef = useRef(refreshUser)
  refreshUserRef.current = refreshUser

  // Load Google Identity Services
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsGoogleReady(true)
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'patient') {
        router.push('/patient-dashboard')
      } else if (user.role === 'doctor') {
        router.push('/doctor-dashboard')
      }
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      // Redirect based on user role (will be handled by useEffect after user state updates)
    } else {
      setError(result.error || 'Invalid email or password')
    }
    
    setIsLoading(false)
  }

  // Sign in with Google (JWT credential) — same flow as /signup. Avoids
  // google.accounts.oauth2.initTokenClient, which triggers redirect_uri_mismatch
  // unless extra OAuth redirect URIs are registered in Google Cloud Console.
  useEffect(() => {
    if (!isGoogleReady || !window.google || !googleBtnRef.current) {
      return
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      return
    }

    const el = googleBtnRef.current
    el.innerHTML = ''

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        const credential = response.credential
        if (!credential) {
          setError('Google did not return a sign-in credential.')
          return
        }
        setError('')
        setIsLoading(true)
        try {
          const decoded = JSON.parse(atob(credential.split('.')[1])) as {
            email?: string
            name?: string
            sub?: string
          }
          const apiBase = (
            process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
          ).replace(/\/$/, '')
          const res = await fetch(`${apiBase}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: decoded.email,
              name: decoded.name,
              google_id: decoded.sub,
              role: 'patient',
            }),
          })
          const data = await res.json()
          if (res.ok && data.token) {
            localStorage.setItem('authToken', data.token)
            await refreshUserRef.current()
          } else {
            setError(data.error || 'Google login failed')
          }
        } catch {
          setError('Failed to authenticate with Google. Please try again.')
        } finally {
          setIsLoading(false)
        }
      },
    })

    const width = Math.min(400, el.parentElement?.clientWidth || 400)
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width,
    })

    return () => {
      el.innerHTML = ''
    }
  }, [isGoogleReady])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-sm">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          System Access
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Secure clinical portal for DementiaNext
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="pt-8 pb-8 px-4 sm:px-10">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-md text-red-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="pt-0.5">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Institutional Email
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="practitioner@hospital.org"
                    className="pl-10 py-2 w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 py-2 w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Secure Login'
                  )}
                </Button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">SSO Provider</span>
                  </div>
                </div>

                <div className="mt-6 w-full flex justify-center">
                  {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                    <p className="text-center text-xs text-amber-700 w-full mb-2">
                      SSO configuration missing
                    </p>
                  )}
                  <div className="w-full flex justify-center h-12 relative items-center">
                    {!isGoogleReady && (
                      <div className="absolute flex items-center justify-center gap-2 text-sm text-slate-500 z-0">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading SSO...
                      </div>
                    )}
                    <div ref={googleBtnRef} className="z-10 w-full flex justify-center" />
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-slate-600 mt-6 pt-4 border-t border-slate-100">
                <span>Requires access? </span>
                <Link href="/signup" className="text-blue-700 hover:text-blue-800 font-medium">
                  Request an account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}