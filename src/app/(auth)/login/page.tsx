'use client'

import { useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Factory, BarChart3, Shield, Zap, ArrowRight, Mail, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email,
        },
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setSuccess('Account created! You can now sign in.')
    setIsSignUp(false)
    setIsLoading(false)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  const features = [
    { icon: Factory, title: 'Production Tracking' },
    { icon: BarChart3, title: 'Analytics Dashboard' },
    { icon: Shield, title: 'Quality Control' },
    { icon: Zap, title: 'Approval Workflows' },
  ]

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Marketing */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />

          {/* Floating orbs with animation */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/25 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl animate-float-slow" />

          {/* Animated rings */}
          <div className="absolute top-20 right-20 w-32 h-32 border border-white/10 rounded-full animate-spin-slow" />
          <div className="absolute top-24 right-24 w-24 h-24 border border-cyan-500/20 rounded-full animate-spin-reverse" />

          {/* Moving particles */}
          <div className="absolute top-1/3 left-10 w-2 h-2 bg-cyan-400/60 rounded-full animate-particle" />
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-particle-delayed" />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-particle-slow" />
          <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-cyan-300/50 rounded-full animate-particle" style={{ animationDelay: '2s' }} />

          {/* Gradient overlay sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Logo & Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl shadow-lg shadow-blue-500/30">
                <Factory className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight">
                ProdLink
              </h1>
            </div>
            <p className="text-lg text-blue-100/70 font-light max-w-md leading-relaxed">
              Intelligent production data collection and analytics for modern factories
            </p>
          </div>

          {/* Features - Horizontal */}
          <div className="flex flex-wrap gap-3 mb-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <feature.icon className="w-4 h-4 text-cyan-300" />
                <span className="text-sm text-white/80 font-medium">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Uptime</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">50k+</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Entries/day</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-xs text-blue-200/50 uppercase tracking-wide">Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[42%] flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-6 lg:p-8">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">ProdLink</h1>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {isSignUp ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Start your production journey' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleEmailLogin} className="space-y-3">
            {isSignUp && (
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50"
                  placeholder="Full name"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                className="w-full ps-10 pe-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50"
                placeholder="Password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccess(null)
              }}
              className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
            >
              {isSignUp ? (
                <>Have an account? <span className="font-semibold text-blue-600">Sign in</span></>
              ) : (
                <>Need an account? <span className="font-semibold text-blue-600">Sign up</span></>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-slate-400">
            First user becomes admin automatically
          </p>
        </div>
      </div>
    </div>
  )
}
