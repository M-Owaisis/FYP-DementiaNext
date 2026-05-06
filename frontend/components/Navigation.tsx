'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import { Brain, Activity, LogIn, LogOut, Menu, X, User, LayoutDashboard, MessageCircle, BookOpen, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'

const Navigation = () => {
  const pathname = usePathname()
  const { userRole, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Don't show navigation on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { href: '/', label: 'Home', icon: Brain, show: true },
    { href: '/detection', label: 'Detection', icon: Activity, show: isAuthenticated && userRole === 'doctor' },
    { href: '/companion', label: 'Companion', icon: MessageCircle, show: isAuthenticated && userRole !== 'doctor' },

  ].filter(item => item.show)

  const getDashboardLink = () => {
    if (userRole === 'doctor') return '/doctor-dashboard'
    if (userRole === 'patient') return '/patient-dashboard'
    return '/'
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileDropdownOpen(false)
  }

  // No more dark pages - all use light theme
  const isDarkPage = false

  return (
    <nav className={cn(
      "backdrop-blur-xl border-b sticky top-0 z-50",
      isDarkPage 
        ? "bg-[#171717]/90 border-gray-800" 
        : "bg-white/80 border-gray-200 shadow-lg"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Logo />
            <span className={cn(
              "text-2xl font-bold bg-gradient-to-r from-blue-500 via-teal-500 to-green-500 bg-clip-text text-transparent"
            )}>
              DementiaNext
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Navigation Items */}
            <div className="flex items-center space-x-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    pathname === item.href 
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg" 
                      : isDarkPage
                        ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                        : "text-gray-600 hover:bg-gray-100"
                  )}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Authentication Section */}
            <div className="ml-2">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      isDarkPage
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 shadow-lg"
                    )}
                  >
                    <User className="w-5 h-5" />
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className={cn(
                      "absolute right-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50",
                      isDarkPage 
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    )}>
                      <Link
                        href={getDashboardLink()}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm",
                          isDarkPage ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                      {userRole !== 'doctor' && (
                        <Link
                          href="/companion/life-story"
                          className={cn(
                            "flex items-center px-4 py-2 text-sm",
                            isDarkPage ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                          )}
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <BookOpen className="w-4 h-4 mr-3" />
                          Life Story
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className={cn(
                          "flex items-center w-full px-4 py-2 text-sm",
                          isDarkPage ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    pathname === item.href 
                      ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation