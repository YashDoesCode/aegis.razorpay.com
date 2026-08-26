import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[4px] border border-transparent px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-rp-blue focus-visible:ring-2 focus-visible:ring-rp-blue/30 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-rp-blue text-white",
        secondary:
          "bg-rp-bg-2 text-rp-slate border-rp-border",
        destructive:
          "bg-rp-red-tint/40 text-rp-red border-[#ED293933]",
        success:
          "bg-rp-green-tint text-rp-green border-[#00A25133]",
        warning:
          "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]",
        ai:
          "bg-rp-blue-bg text-rp-blue border-rp-blue/30",
        outline:
          "border-rp-border bg-rp-surface text-rp-slate",
        ghost:
          "hover:bg-rp-bg-2 text-rp-muted",
        link: "text-rp-blue underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
