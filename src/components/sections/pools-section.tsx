import { BlurFade } from "@/components/ui/blur-fade"

interface PoolCardProps {
  title: string
  description: string
  currentAmount: string
  targetAmount: string
  progress: number
  investors: number
  daysLeft?: number
  delay?: number
}

function PoolCard({ 
  title, 
  description, 
  currentAmount, 
  targetAmount, 
  progress, 
  investors,
  daysLeft,
  delay = 0 
}: PoolCardProps) {
  return (
    <BlurFade delay={delay} className="w-full">
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        
        <div className="mb-4">
          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div 
              className="h-full rounded-full bg-indigo-600 transition-all duration-500 dark:bg-indigo-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-base font-bold text-indigo-700 dark:text-indigo-400">{currentAmount} <span className="font-medium">({progress}%)</span></div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">RAISED</div>
            </div>
            {daysLeft && (
              <div className="text-right">
                <div className="text-base font-semibold text-gray-800 dark:text-gray-200">{daysLeft} days left</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">MIN. TARGET</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-200">{targetAmount}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">INVESTORS</div>
            <div className="text-base font-bold text-gray-800 dark:text-gray-200">{investors}</div>
          </div>
        </div>
      </div>
    </BlurFade>
  )
}

export function PoolsSection() {
  const pools = [
    {
      title: "Clean Water Initiative",
      description: "Providing clean water access to communities in need",
      currentAmount: "RM 364,000",
      targetAmount: "RM 1.6M",
      progress: 23,
      investors: 10,
      daysLeft: 7,
    },
    {
      title: "Education for All",
      description: "Supporting education in underserved regions",
      currentAmount: "RM 250,500",
      targetAmount: "RM 800K",
      progress: 31,
      investors: 24,
      daysLeft: 12,
    },
    {
      title: "Medical Supplies",
      description: "Delivering essential medical supplies to rural clinics",
      currentAmount: "RM 712,000",
      targetAmount: "RM 1.2M",
      progress: 59,
      investors: 42,
      daysLeft: 5,
    },
    {
      title: "Disaster Relief",
      description: "Emergency support for natural disaster victims",
      currentAmount: "RM 428,300",
      targetAmount: "RM 750K",
      progress: 57,
      investors: 31,
      daysLeft: 9,
    },
  ]

  return (
    <section className="w-full py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        <BlurFade delay={0.1}>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Active Donation Pools
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            Join these community-driven initiatives and track your impact in real-time
          </p>
        </BlurFade>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pools.map((pool, index) => (
            <PoolCard
              key={pool.title}
              title={pool.title}
              description={pool.description}
              currentAmount={pool.currentAmount}
              targetAmount={pool.targetAmount}
              progress={pool.progress}
              investors={pool.investors}
              daysLeft={pool.daysLeft}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 