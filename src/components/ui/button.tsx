import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-xs font-semibold whitespace-nowrap transition-all duration-150 outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-container shadow-xs",
        outline:
          "border-border-subtle bg-white text-ink hover:bg-slate-50 hover:text-ink shadow-xs",
        secondary:
          "bg-slate-100 text-ink hover:bg-slate-200/80 border-slate-200/60 shadow-xs",
        ghost:
          "hover:bg-slate-100 text-muted-slate hover:text-ink",
        destructive:
          "bg-danger text-white hover:bg-danger/90 shadow-xs",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-3.5 py-2",
        xs: "h-6.5 gap-1 rounded-lg px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10.5 gap-2.5 rounded-xl px-5 text-sm font-semibold",
        icon: "size-9 rounded-xl",
        "icon-xs":
          "size-6.5 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7.5 rounded-lg",
        "icon-lg": "size-10.5 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
