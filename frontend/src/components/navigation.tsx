'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationProps {
  showBackButton?: boolean
  showHomeButton?: boolean
  title?: string
}

export function Navigation({ showBackButton = false, showHomeButton = false, title }: NavigationProps) {
  const router = useRouter()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            )}
            
            {showHomeButton && (
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  首页
                </Button>
              </Link>
            )}

            {title && (
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            )}
          </div>

          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">智研</span>
              </div>
              <span className="font-semibold text-gray-900">智问数研</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
