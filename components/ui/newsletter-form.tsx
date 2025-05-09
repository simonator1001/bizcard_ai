"use client";

import * as React from "react";
import { useState, useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type FormStatus = "idle" | "loading" | "success" | "error";

interface NewsletterFormProps extends React.HTMLAttributes<HTMLFormElement> {
  onSubscribe?: (email: string) => Promise<{ success: boolean; error?: string }>;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
}

const NewsletterForm = ({
  onSubscribe,
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  successMessage = "Thanks for subscribing!",
  className,
  ...props
}: NewsletterFormProps) => {
  const [formState, setFormState] = useState({
    email: "",
    status: "idle" as FormStatus,
    message: "",
  });
  const inputId = useId();
  const isLoading = formState.status === "loading";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubscribe) return;

    setFormState((prev) => ({ ...prev, status: "loading", message: "" }));

    try {
      const result = await onSubscribe(formState.email);
      if (!result.success) {
        setFormState((prev) => ({
          ...prev,
          status: "error",
          message: result.error || "Failed to subscribe",
        }));
      } else {
        setFormState({
          email: "",
          status: "success",
          message: successMessage,
        });
      }
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        status: "error",
        message: error instanceof Error ? error.message : "Failed to subscribe",
      }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-md", className)}
      {...props}
    >
      <div className="relative overflow-hidden rounded-full border border-border/30 bg-background shadow-lg transition-all duration-300 hover:shadow-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
        <div className="flex items-center">
          <Input
            id={inputId}
            type="email"
            placeholder={placeholder}
            value={formState.email}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, email: e.target.value }))
            }
            disabled={isLoading || formState.status === "success"}
            required
            className="flex-1 border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Email address"
          />
          <div className="pr-1">
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || formState.status === "success"}
              className="relative h-9 overflow-hidden rounded-full px-4 transition-all duration-300 hover:bg-primary/90"
            >
              <motion.span
                initial={{ opacity: 1 }}
                animate={{ 
                  opacity: isLoading ? 0 : 1,
                  y: isLoading ? -20 : 0 
                }}
                className="flex items-center gap-1"
              >
                {buttonText}
                <Send className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </motion.span>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              )}
            </Button>
          </div>
        </div>
      </div>
      {formState.message && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-2 text-xs",
            formState.status === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          )}
          role="alert"
        >
          {formState.message}
        </motion.p>
      )}
    </form>
  );
};

export default NewsletterForm; 