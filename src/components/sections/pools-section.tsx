import { BlurFade } from "@/components/ui/blur-fade"
import { PoolCard } from "@/components/ui/pool-card"

export function PoolsSection() {
  const pools = [
    {
      title: "Clean Water Initiative",
      description: "Providing clean water access to communities in need",
      amount: "$45,000",
      progress: 68,
    },
    {
      title: "Education for All",
      description: "Supporting education in underserved regions",
      amount: "$32,500",
      progress: 42,
    },
    {
      title: "Medical Supplies",
      description: "Delivering essential medical supplies to rural clinics",
      amount: "$78,200",
      progress: 91,
    },
    {
      title: "Disaster Relief",
      description: "Emergency support for natural disaster victims",
      amount: "$54,800",
      progress: 76,
    },
  ]

  return (
    <section className="w-full py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        <BlurFade delay={0.1}>
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Active Donation Pools
          </h2>
          <p className="mb-8 text-gray-500 dark:text-gray-400">
            Join these community-driven initiatives and track your impact in real-time
          </p>
        </BlurFade>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pools.map((pool, index) => (
            <PoolCard
              key={pool.title}
              title={pool.title}
              description={pool.description}
              amount={pool.amount}
              progress={pool.progress}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 