import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode
  className?: string
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[18rem] grid-cols-1 gap-4 md:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { BentoGrid }
