'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  ArrowRight,
  Scan,
  Stethoscope,
  Microscope,
  Database
} from 'lucide-react'

const features = [
  {
    title: 'Cognitive Decline Detection',
    description: 'Clinical-grade analysis of structural MRI to identify patterns of cognitive impairment.',
    icon: Brain,
    color: 'bg-blue-50 text-blue-700',
    href: '/detection'
  },
  {
    title: 'Neurological Analysis',
    description: 'Comprehensive assessment module aiding in progressive condition mapping.',
    icon: Activity,
    color: 'bg-slate-50 text-slate-700',
    href: '/detection'
  },
  {
    title: 'Diagnostic Transparency',
    description: 'Visual diagnostic evidence indicating influential brain regions for clinical review.',
    icon: Eye,
    color: 'bg-indigo-50 text-indigo-700',
    href: '/explainable-ai'
  },
  {
    title: 'Clinical Dashboard',
    description: 'Centralized patient management interface and historical diagnostic records.',
    icon: Users,
    color: 'bg-blue-50 text-blue-700',
    href: '/doctor-dashboard'
  },
  {
    title: 'Patient Portal',
    description: 'Secure access interface for patients to review diagnostic outcomes and documentation.',
    icon: Shield,
    color: 'bg-slate-50 text-slate-700',
    href: '/patient-dashboard'
  },
  {
    title: 'Automated Reporting',
    description: 'Generation of structured clinical reports aligned with diagnostic findings.',
    icon: FileText,
    color: 'bg-indigo-50 text-indigo-700',
    href: '/detection'
  }
]

const steps = [
  {
    number: '01',
    title: 'Data Acquisition',
    description: 'Secure upload of DICOM or standard neuroimaging formats directly into the analysis pipeline.',
    icon: Database
  },
  {
    number: '02',
    title: 'Algorithmic Processing',
    description: 'Automated evaluation using validated neural architectures to identify disease markers.',
    icon: Scan
  },
  {
    number: '03',
    title: 'Clinical Integration',
    description: 'Systematic presentation of findings through detailed, exportable clinical documentation.',
    icon: Stethoscope
  }
]

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
    <div onClick={handleClick} className="cursor-pointer h-full">
      <Card className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-xl">
        <CardHeader className="pb-4">
          <div className="mb-4">
            <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
              <feature.icon className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-slate-900">
            {feature.title}
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2 text-sm leading-relaxed">
            {feature.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-medium text-blue-700 mt-2">
            {isAuthenticated ? 'Access Module' : 'Sign In to Access'}
            <ArrowRight className="ml-1 w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 mb-8 border border-blue-200">
            <Microscope className="w-4 h-4 mr-2" />
            Clinical Research Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8">
            Advanced Neuroimaging <br/> <span className="text-blue-700">Analysis Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            DementiaNext provides computational tools for analyzing brain MRI data, supporting clinical efforts in identifying indicators of cognitive decline and neurodegenerative conditions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/classification">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm">
                Initiate Analysis
              </Button>
            </Link>
            <Link href="/detection">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-1">99.7%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Model Accuracy</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-1">97.5%</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Precision Rate</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-1">10K+</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Scans Processed</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-bold text-slate-900 mb-1">24/7</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Platform Capabilities
            </h2>
            <p className="text-lg text-slate-600">
              Integrated computational modules designed to streamline clinical workflows and enhance diagnostic confidence through quantitative analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} isAuthenticated={isAuthenticated} />
            ))}
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

          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step, index) => (
              <div key={index} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-5xl font-extrabold text-slate-200 mb-6 font-mono">
                  {step.number}
                </div>
                <div className="mb-4">
                  <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-blue-700 shadow-sm">
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white tracking-tight">
                DementiaNext
              </span>
            </div>
            <div className="text-sm">
              &copy; {new Date().getFullYear()} DementiaNext Clinical Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
