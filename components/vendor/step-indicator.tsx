"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({
  steps,
  currentStep,
}: StepIndicatorProps) {
  return (
    <div className="flex justify-center pb-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="relative">
              <motion.div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: index === currentStep ? 1.1 : 1,
                  backgroundColor:
                    index <= currentStep ? "var(--primary)" : "transparent",
                }}
                transition={{ duration: 0.3 }}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <span className="text-black">{index + 1}</span>
                )}
              </motion.div>
              <motion.div
                className="absolute -right-5 w-20 text-center text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === currentStep ? 1 : 0.7,
                  fontWeight: index === currentStep ? 600 : 400,
                }}
                transition={{ duration: 0.3 }}
              >
                {step}
              </motion.div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 ${
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
