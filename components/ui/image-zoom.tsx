"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { X, ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

const ImageZoom = DialogPrimitive.Root

const ImageZoomTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & {
    children: React.ReactElement
  }
>(({ className, children, ...props }, ref) => {
  return (
    <DialogPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative group cursor-zoom-in transition-all duration-200 hover:opacity-90",
        className
      )}
      {...props}
    >
      {children}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
        <ZoomIn className="h-6 w-6 text-white" />
      </div>
    </DialogPrimitive.Trigger>
  )
})
ImageZoomTrigger.displayName = DialogPrimitive.Trigger.displayName

const ImageZoomContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: string
  }
>(({ className, children, title, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      <VisuallyHidden.Root asChild>
        <DialogPrimitive.Title>
          {title || "Image Zoom View"}
        </DialogPrimitive.Title>
      </VisuallyHidden.Root>
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
        <X className="h-4 w-4 bg-white" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
ImageZoomContent.displayName = DialogPrimitive.Content.displayName

interface ImageZoomImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  className?: string
}

const ImageZoomImage = React.forwardRef<HTMLImageElement, ImageZoomImageProps>(
  ({ className, src, alt, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          "max-h-[80vh] max-w-full object-contain rounded-lg",
          className
        )}
        {...props}
      />
    )
  }
)
ImageZoomImage.displayName = "ImageZoomImage"

export { ImageZoom, ImageZoomTrigger, ImageZoomContent, ImageZoomImage }