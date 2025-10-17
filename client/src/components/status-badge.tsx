import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type ChangeStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'implemented' | 'cancelled';
type CIStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned';

interface StatusBadgeProps {
  status: TicketStatus | ChangeStatus | CIStatus | string;
  type?: 'ticket' | 'change' | 'ci';
}

const ticketStatusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
  in_progress: { label: 'In Progress', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  resolved: { label: 'Resolved', className: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-muted' },
};

const changeStatusConfig: Record<ChangeStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-muted' },
  pending_approval: { label: 'Pending Approval', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  approved: { label: 'Approved', className: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  rejected: { label: 'Rejected', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  scheduled: { label: 'Scheduled', className: 'bg-chart-5/10 text-chart-5 border-chart-5/20' },
  implemented: { label: 'Implemented', className: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-muted' },
};

const ciStatusConfig: Record<CIStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-chart-2/10 text-chart-2 border-chart-2/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-muted' },
  maintenance: { label: 'Maintenance', className: 'bg-chart-3/10 text-chart-3 border-chart-3/20' },
  decommissioned: { label: 'Decommissioned', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
};

export function StatusBadge({ status, type = 'ticket' }: StatusBadgeProps) {
  let config;
  
  if (type === 'ticket') {
    config = ticketStatusConfig[status as TicketStatus] || { label: status, className: '' };
  } else if (type === 'change') {
    config = changeStatusConfig[status as ChangeStatus] || { label: status, className: '' };
  } else {
    config = ciStatusConfig[status as CIStatus] || { label: status, className: '' };
  }

  return (
    <Badge variant="outline" className={cn("font-medium border", config.className)} data-testid={`status-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </Badge>
  );
}
