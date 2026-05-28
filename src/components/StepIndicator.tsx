import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full mb-8">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium font-body transition-all duration-300
                  ${isCompleted ? 'bg-espresso text-cream' : isActive ? 'bg-terracotta text-cream shadow-lg' : 'bg-surface-tint text-stone border-2 border-rule border-opacity-30'}
                `}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-body hidden sm:block ${
                  isActive ? 'text-terracotta font-medium' : 'text-stone'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mx-1 transition-all duration-300 ${
                  isCompleted ? 'bg-espresso' : 'bg-rule'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
