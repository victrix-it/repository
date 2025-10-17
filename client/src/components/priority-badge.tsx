import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-muted' },
  medium: { label: 'Medium', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  high: { label: 'High', className: 'bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)] border-[hsl(25,95%,53%)]/20' },
  critical: { label: 'Critical', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant="outline" className={cn("font-medium border", config.className)} data-testid={`priority-${priority}`}>
      {(priority === 'high' || priority === 'critical') && (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {config.label}
    </Badge>
  );
}
