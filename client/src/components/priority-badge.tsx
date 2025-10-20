import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

type Priority = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'low' | 'medium' | 'high' | 'critical';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  // New P1-P5 format
  p1: { label: 'P1 - Critical', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  p2: { label: 'P2 - High', className: 'bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/20' },
  p3: { label: 'P3 - Medium', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  p4: { label: 'P4 - Low', className: 'bg-muted text-muted-foreground border-muted' },
  p5: { label: 'P5 - Informational', className: 'bg-muted text-muted-foreground border-muted' },
  
  // Legacy format (for backward compatibility)
  critical: { label: 'Critical', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  high: { label: 'High', className: 'bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/20' },
  medium: { label: 'Medium', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-muted' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className)} data-testid={`priority-${priority}`}>
      {(priority === 'p1' || priority === 'p2' || priority === 'high' || priority === 'critical') && (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {config.label}
    </Badge>
  );
}
