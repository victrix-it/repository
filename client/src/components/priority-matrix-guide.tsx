import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityMatrixGuideProps {
  type?: 'incident' | 'change' | 'problem';
  className?: string;
}

export function PriorityMatrixGuide({ type = 'incident', className }: PriorityMatrixGuideProps) {
  const maxPriority = type === 'incident' ? 'P5' : 'P4';
  
  return (
    <Card className={cn("border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <CardTitle className="text-base">Priority Matrix Guide</CardTitle>
            <CardDescription className="mt-1">
              Select Impact and Urgency to determine the appropriate priority (P1-{maxPriority})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-2 bg-muted font-semibold text-left">
                  Impact ↓ / Urgency →
                </th>
                <th className="border border-border p-2 bg-muted font-semibold text-center">
                  <div className="font-semibold">Critical</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                    Service unavailable or major outage
                  </div>
                </th>
                <th className="border border-border p-2 bg-muted font-semibold text-center">
                  <div className="font-semibold">High</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                    Severely degraded, limited workaround
                  </div>
                </th>
                <th className="border border-border p-2 bg-muted font-semibold text-center">
                  <div className="font-semibold">Medium</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                    Degraded service, workaround available
                  </div>
                </th>
                <th className="border border-border p-2 bg-muted font-semibold text-center">
                  <div className="font-semibold">Low</div>
                  <div className="text-xs font-normal text-muted-foreground mt-0.5">
                    Minor issue or request
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-2 bg-muted font-medium">
                  <div className="font-semibold">High</div>
                  <div className="text-xs text-muted-foreground">
                    Affects entire org / critical service
                  </div>
                </td>
                <td className="border border-border p-3 text-center bg-red-100 dark:bg-red-950/30 font-semibold text-red-900 dark:text-red-300">
                  P1 – Critical
                </td>
                <td className="border border-border p-3 text-center bg-orange-100 dark:bg-orange-950/30 font-semibold text-orange-900 dark:text-orange-300">
                  P2 – High
                </td>
                <td className="border border-border p-3 text-center bg-yellow-100 dark:bg-yellow-950/30 font-semibold text-yellow-900 dark:text-yellow-300">
                  P3 – Medium
                </td>
                <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  P4 – Low
                </td>
              </tr>
              <tr>
                <td className="border border-border p-2 bg-muted font-medium">
                  <div className="font-semibold">Medium</div>
                  <div className="text-xs text-muted-foreground">
                    Affects a department or group
                  </div>
                </td>
                <td className="border border-border p-3 text-center bg-orange-100 dark:bg-orange-950/30 font-semibold text-orange-900 dark:text-orange-300">
                  P2 – High
                </td>
                <td className="border border-border p-3 text-center bg-yellow-100 dark:bg-yellow-950/30 font-semibold text-yellow-900 dark:text-yellow-300">
                  P3 – Medium
                </td>
                <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  P4 – Low
                </td>
                {type === 'incident' ? (
                  <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    P5 – Informational
                  </td>
                ) : (
                  <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                    P4 – Low
                  </td>
                )}
              </tr>
              <tr>
                <td className="border border-border p-2 bg-muted font-medium">
                  <div className="font-semibold">Low</div>
                  <div className="text-xs text-muted-foreground">
                    Affects a single user / non-critical
                  </div>
                </td>
                <td className="border border-border p-3 text-center bg-yellow-100 dark:bg-yellow-950/30 font-semibold text-yellow-900 dark:text-yellow-300">
                  P3 – Medium
                </td>
                <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  P4 – Low
                </td>
                {type === 'incident' ? (
                  <>
                    <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      P5 – Informational
                    </td>
                    <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      P5 – Informational
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      P4 – Low
                    </td>
                    <td className="border border-border p-3 text-center bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                      P4 – Low
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Priority Definitions:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li><span className="font-medium">P1 - Critical:</span> {type === 'incident' ? 'Major outage, no workaround' : type === 'change' ? 'Emergency change to restore service' : 'Recurring major incidents'}</li>
            <li><span className="font-medium">P2 - High:</span> {type === 'incident' ? 'Significant degradation, urgent impact' : type === 'change' ? 'High-impact planned change' : 'Significant recurring incidents'}</li>
            <li><span className="font-medium">P3 - Medium:</span> {type === 'incident' ? 'Partial loss, workaround available' : type === 'change' ? 'Standard or routine change' : 'Moderate recurring incidents'}</li>
            <li><span className="font-medium">P4 - Low:</span> {type === 'incident' ? 'Minor issue, minimal impact' : type === 'change' ? 'Minor enhancement or update' : 'Low-impact known errors'}</li>
            {type === 'incident' && (
              <li><span className="font-medium">P5 - Informational:</span> General query or advisory only</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
