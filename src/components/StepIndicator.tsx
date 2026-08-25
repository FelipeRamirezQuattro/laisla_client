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
                  ${isCompleted ? 'bg-island-dark text-white' : isActive ? 'bg-island-blue text-white shadow-lg' : 'bg-sand text-island-dark/70 border-2 border-island-blue/20'}
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
                  isActive ? 'text-island-blue font-medium' : 'text-island-dark/70'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mx-1 transition-all duration-300 ${
                  isCompleted ? 'bg-island-dark' : 'bg-island-blue/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
