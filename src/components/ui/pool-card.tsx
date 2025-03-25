"use client"

import { BlurFade } from "@/components/ui/blur-fade"

interface PoolCardProps {
  title: string
  description: string
  amount: string
  progress: number
  delay?: number
}

export function PoolCard({ title, description, amount, progress, delay = 0 }: PoolCardProps) {
  return (
    <BlurFade delay={delay} className="w-full">
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{amount}</span>
        </div>
        
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div 
            className="h-full rounded-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{progress}% funded</span>
          <div className="flex items-center gap-1 font-medium text-blue-500 transition-all group-hover:gap-2">
            View details <span className="ml-1 text-xs">→</span>
          </div>
        </div>
      </div>
    </BlurFade>
  )
} 