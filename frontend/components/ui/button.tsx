import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black uppercase tracking-[0.08em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-lime-300 text-white shadow-[0_0_34px_rgba(190,255,24,0.34)] hover:bg-lime-200",
        outline:
          "border border-lime-300/55 bg-black/20 text-white hover:border-lime-200 hover:bg-lime-300/10",
        ghost: "text-lime-200 hover:bg-lime-300/10 hover:text-lime-100"},
      size: {
        default: "h-12 px-6",
        lg: "h-16 px-8 text-base",
        icon: "size-12"}},
    defaultVariants: {
      variant: "default",
      size: "default"}},
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
