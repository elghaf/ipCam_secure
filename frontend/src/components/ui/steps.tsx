'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

export interface Step {
  title: string
  description?: string
  icon?: React.ReactNode
  optional?: boolean
}

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[]
  currentStep?: number
}

const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ steps, currentStep = 1, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div className="relative after:absolute after:inset-x-0 after:top-1/2 after:block after:h-0.5 after:-translate-y-1/2 after:rounded-lg after:bg-muted">
          <div className="relative z-10 flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-center text-sm font-semibold",
                    currentStep > index + 1 && "border-primary bg-primary text-primary-foreground",
                    currentStep === index + 1 && "border-primary bg-background text-foreground",
                    currentStep < index + 1 && "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {step.icon ? step.icon : index + 1}
                </div>
                <div className="space-y-1 text-center">
                  <div className="text-sm font-semibold">
                    {step.title}
                    {step.optional && (
                      <span className="text-xs font-normal text-muted-foreground"> (Optional)</span>
                    )}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)
Steps.displayName = "Steps"

export { Steps }      // Export the Steps component
