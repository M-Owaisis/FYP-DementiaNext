'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Brain, 
  Activity, 
  Users, 
  Eye,
  FileText,
  ChevronRight,
  Shield,
  Sparkles,
  ArrowRight,
  Scan,
  Stethoscope,
  Microscope,
  Heart,
  Database
} from 'lucide-react'

const features = [
  {
    title: 'MCI/AD Detection',
    description: 'Advanced AI analysis of brain scans to detect Mild Cognitive Impairment and Alzheimer\'s Disease',
    icon: Brain,
    color: 'from-blue-500 to-blue-600',
    href: '/detection',
    emoji: '🧠',
    medicalIcon: Scan
  },
  {
    title: 'Parkinson\'s Analysis',
    description: 'Comprehensive evaluation of neurological patterns for Parkinson\'s Dementia classification',
    icon: Activity,
    color: 'from-teal-500 to-teal-600',
    href: '/detection',
    emoji: '⚡',
    medicalIcon: Stethoscope
  },
  {
    title: 'Explainable AI',
    description: 'Transparent AI insights showing brain regions and biomarkers affecting diagnosis',
    icon: Eye,
    color: 'from-green-500 to-green-600',
    href: '/explainable-ai',
    emoji: '👁️',
    medicalIcon: Microscope
  },
  {
    title: 'Doctor Analytics',
    description: 'Comprehensive dashboard for healthcare professionals to monitor patient progress',
    icon: Users,
    color: 'from-blue-600 to-cyan-600',
    href: '/doctor-dashboard',
    emoji: '👨‍⚕️',
    medicalIcon: Heart
  },
  {
    title: 'Patient Portal',
    description: 'Personalized reports and AI voice assistant for patient engagement',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    href: '/patient-dashboard',
    emoji: '💚',
    medicalIcon: Heart
  },
  {
    title: 'Report Generation',
    description: 'Comprehensive medical reports with AI insights and recommendations',
    icon: FileText,
    color: 'from-gray-600 to-gray-700',
    href: '/detection',
    emoji: '📄',
    medicalIcon: FileText
  }
]

const steps = [
  {
    number: '01',
    title: 'Upload Medical Data',
    description: 'Upload MRI scans, CT images, and patient data. Our AI supports DICOM and standard medical imaging formats.',
    icon: Scan,
    emoji: '📤',
    medicalFocus: 'Medical Imaging'
  },
  {
    number: '02',
    title: 'AI Analysis & Diagnosis',
    description: 'Advanced neural networks analyze brain patterns, providing detailed classification and confidence scores.',
    icon: Brain,
    emoji: '🔍',
    medicalFocus: 'AI Diagnosis'
  },
  {
    number: '03',
    title: 'Clinical Reports & Monitoring',
    description: 'Generate comprehensive medical reports and track patient progress with continuous monitoring.',
    icon: FileText,
    emoji: '📊',
    medicalFocus: 'Clinical Care'
  }
]

// Feature card component with auth check
function FeatureCard({ feature, isAuthenticated }: { feature: typeof features[0], isAuthenticated: boolean }) {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      router.push(feature.href)
    }
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Card className="h-full hover:shadow-2xl transition-all duration-300 group border-2 hover:border-blue-400 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader>
          <div className="relative mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
              <feature.icon className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 text-4xl">{feature.emoji}</div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <feature.medicalIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors text-gray-800">
            {feature.title}
          </CardTitle>
          <CardDescription className="text-base leading-relaxed text-gray-600">
            {feature.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
            {isAuthenticated ? 'Access Now' : 'Sign up to access'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8">
            Advanced Neuroimaging <br/> <span className="text-blue-700">Analysis Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            DementiaNext provides computational tools for analyzing brain MRI data, supporting clinical efforts in identifying indicators of cognitive decline and neurodegenerative conditions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/classification">
              <Button className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                <Scan className="mr-3 w-6 h-6" />
                Classification
                <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/detection">
              <Button variant="outline" className="text-xl px-12 py-8 border-4 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <Shield className="mr-3 w-6 h-6" />
                Detection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Operational Workflow
            </h2>
            <p className="text-lg text-slate-600">
              A standardized protocol ensuring secure data handling and systematic evaluation.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full">
              <div className="text-5xl font-extrabold text-slate-200 mb-6 font-mono">01</div>
              <div className="mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-700 shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Data Acquisition</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
                Upload DICOM folders or NIfTI files. Automatic conversion from ZIP to standardized formats.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full">
              <div className="text-5xl font-extrabold text-slate-200 mb-6 font-mono">02</div>
              <div className="mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-700 shadow-sm">
                  <Microscope className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">GPU Preprocessing</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
                Cloud-based Phase 2 processing: HD-BET skull stripping, bias field correction, and intensity normalization.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full">
              <div className="text-5xl font-extrabold text-slate-200 mb-6 font-mono">03</div>
              <div className="mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-700 shadow-sm">
                  <Scan className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analysis Engine</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
                Classification via dual PyTorch models (Alzheimer's Binary vs. Subtype Classifiers) on structured sequences.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col h-full">
              <div className="text-5xl font-extrabold text-slate-200 mb-6 font-mono">04</div>
              <div className="mb-4">
                <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-700 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Reporting & XAI</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-grow">
                Generate clinical metrics, Grad-CAM transparent insights, and printable evaluation summaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  DementiaNext
                </span>
                <p className="text-sm text-blue-300 mt-1">Advanced Neurological AI Platform</p>
              </div>
            </div>
            <div className="text-blue-300 text-center md:text-right">
              <p className="text-lg">© 2025 DementiaNext. All rights reserved.</p>
              <p className="text-sm mt-2 text-cyan-400">Advancing neurological care with AI 🧠</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
