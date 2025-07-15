
import * as React from "react"
import { toast as sonnerToast } from "sonner"

// This is a compatibility layer that allows us to use the old toast API
// with the new sonner toast component
export function toast(props: {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  action?: React.ReactNode
} | string) {
  // If props is a string, show a simple toast with the string as the message
  if (typeof props === 'string') {
    return sonnerToast(props)
  }

  // If props is an object with title and/or description, adapt it to sonner's API
  const { title, description, variant, action } = props

  // Handle different variants
  if (variant === "destructive") {
    return sonnerToast.error(title as string, {
      description: description,
      action: action
    })
  }

  // Default case, use the info toast
  return sonnerToast(title as string, {
    description: description,
    action: action
  })
}

// For direct access to sonner's toast functions
export const sonner = sonnerToast

// Hook to provide the toast function
export function useToast() {
  return {
    toast,
    // Add compatibility methods for anything else that might be expected
    dismiss: sonnerToast.dismiss
  }
}
