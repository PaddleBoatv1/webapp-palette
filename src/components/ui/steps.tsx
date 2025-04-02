
import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface StepProps {
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  children?: React.ReactNode;
}

export const Step = ({
  title,
  description,
  isCompleted,
  isActive,
  children
}: StepProps) => {
  return (
    <div className="flex-1">
      <div className="flex items-center">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2",
            isActive && "border-blue-500 bg-blue-50 text-blue-600",
            isCompleted && "border-green-500 bg-green-50 text-green-600",
            !isActive && !isCompleted && "border-gray-300 text-gray-400"
          )}
        >
          {isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <span>{children}</span>
          )}
        </div>
        <div className="ml-4">
          <p className={cn(
            "text-sm font-medium",
            isActive && "text-blue-600",
            isCompleted && "text-green-600",
            !isActive && !isCompleted && "text-gray-500"
          )}>
            {title}
          </p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface StepsProps {
  currentStep: number;
  className?: string;
  children: React.ReactNode;
}

export const Steps = ({ currentStep, className, children }: StepsProps) => {
  const steps = React.Children.toArray(children);
  
  return (
    <div className={cn("flex", className)}>
      {steps.map((step, i) => {
        if (React.isValidElement<StepProps>(step)) {
          // Pass props explicitly to fix TypeScript error
          return React.cloneElement(step, {
            key: i,
            isActive: currentStep === i,
            isCompleted: currentStep > i,
            children: i + 1,
          });
        }
        return null;
      })}
    </div>
  );
};
