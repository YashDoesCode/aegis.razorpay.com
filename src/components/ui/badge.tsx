import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-white border-transparent",
        secondary:
          "bg-slate-100 text-slate-700 border-slate-200/80",
        destructive:
          "bg-rose-50 text-rose-700 border-rose-200",
        success:
          "bg-emerald-50 text-emerald-800 border-emerald-200",
        warning:
          "bg-amber-50 text-amber-800 border-amber-200",
        ai:
          "bg-blue-50 text-primary border-blue-200",
        outline:
          "border-border-subtle bg-white text-slate-700",
        ghost:
          "hover:bg-slate-100 text-muted-slate",
        link: "text-primary underline-offset-4 hover:underline",
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
