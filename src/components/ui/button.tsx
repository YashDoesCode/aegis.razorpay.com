import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[4px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-rp-blue focus-visible:ring-2 focus-visible:ring-rp-blue/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-rp-blue text-white hover:bg-rp-blue-hover rp-shadow-soft",
        outline:
          "border-rp-border bg-rp-surface text-rp-blue hover:bg-rp-bg-2 hover:text-rp-blue-hover rp-shadow-soft",
        secondary:
          "bg-rp-bg-2 text-rp-ink hover:bg-rp-bg-3 border-rp-border rp-shadow-soft",
        ghost:
          "hover:bg-rp-bg-2 hover:text-rp-ink text-rp-muted",
        destructive:
          "bg-rp-red text-white hover:bg-rp-red-dark rp-shadow-soft",
        link: "text-rp-blue underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 py-1.5 text-xs",
        xs: "h-6 gap-1 rounded-[4px] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[4px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 rounded-[4px] px-4 text-sm font-semibold",
        icon: "size-8 rounded-[4px]",
        "icon-xs":
          "size-6 rounded-[4px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[4px]",
        "icon-lg": "size-10 rounded-[4px]",
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
