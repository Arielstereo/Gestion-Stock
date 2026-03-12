import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function LoadingButton({
  isLoading = false,
  loadingText = "Guardando...",
  children,
  className,
  disabled,
  ...props
}) {
  return (
    <Button
      disabled={isLoading || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
