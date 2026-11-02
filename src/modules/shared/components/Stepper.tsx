/**
 * Stepper — Atomic UI Component
 * Multi-step form navigation for the "Ficha Técnica" workflow.
 * Pure visual component — no form state management.
 */
"use client";

interface StepInfo {
    label: string;
    description?: string;
}

interface StepperProps {
    steps: StepInfo[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
    return (
        <nav aria-label="Progress" className="w-full" id="stepper-nav">
            <ol className="flex items-center justify-between gap-2">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = onStepClick && index <= currentStep;

                    return (
                        <li key={step.label} className="flex flex-1 items-center">
                            {/* Step Indicator */}
                            <button
                                type="button"
                                disabled={!isClickable}
                                onClick={() => isClickable && onStepClick(index)}
                                className={`flex w-full flex-col items-center gap-2 transition-colors duration-[--art-transition-base] ${isClickable ? "cursor-pointer" : "cursor-default"
                                    }`}
                                aria-current={isCurrent ? "step" : undefined}
                            >
                                {/* Circle */}
                                <span
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-[--art-transition-base] ${isCompleted
                                            ? "border-art-accent-gold bg-art-accent-gold text-white"
                                            : isCurrent
                                                ? "border-art-accent-gold text-art-accent-gold"
                                                : "border-art-border text-art-fg-muted"
                                        }`}
                                >
                                    {isCompleted ? (
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </span>
                                {/* Label */}
                                <span
                                    className={`text-xs font-medium text-center leading-tight ${isCurrent
                                            ? "text-art-fg-primary"
                                            : isCompleted
                                                ? "text-art-accent-gold"
                                                : "text-art-fg-muted"
                                        }`}
                                >
                                    {step.label}
                                </span>
                            </button>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`mx-2 mt-[-1.5rem] h-0.5 flex-1 transition-colors duration-[--art-transition-base] ${isCompleted ? "bg-art-accent-gold" : "bg-art-border"
                                        }`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
