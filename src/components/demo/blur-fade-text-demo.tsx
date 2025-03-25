import { BlurFade } from "@/components/ui/blur-fade"

export function BlurFadeTextDemo() {
  return (
    <section id="header" className="w-full max-w-5xl px-6 md:px-10 mt-[-40vh]">
      <BlurFade delay={0.25} inView>
        <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl xl:text-6xl/none">
          Transparent Giving : Track Your Donations in Real Time
        </h2>
      </BlurFade>
      <BlurFade delay={0.25 * 2} inView>
        <span className="text-xl text-pretty tracking-tighter sm:text-3xl xl:text-3xl/none">
        🎯 Donate, Track, Deliver. Be Part of the Change
        </span>
      </BlurFade>
    </section>
  )
} 