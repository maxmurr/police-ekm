import { cn } from "@/lib/utils";

interface BounceLoaderProps {
  className?: string;
}
export default function BounceLoader({ className }: BounceLoaderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="status" aria-label="Loading">
      <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.32s] [animation-duration:0.8s] motion-reduce:animate-pulse"></div>
      <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.16s] [animation-duration:0.8s] motion-reduce:animate-pulse"></div>
      <div className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-duration:0.8s] motion-reduce:animate-pulse"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
