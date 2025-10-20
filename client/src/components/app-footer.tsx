import { useQuery } from "@tanstack/react-query";
import type { SystemSetting } from "@shared/schema";

export function AppFooter() {
  const { data: settings } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  const settingsMap = settings?.reduce((acc, s) => {
    acc[s.key] = s.value || '';
    return acc;
  }, {} as Record<string, string>) || {};

  const footerText = settingsMap['footer_text'];

  if (!footerText) {
    return null;
  }

  return (
    <footer className="border-t bg-card mt-auto" data-testid="app-footer">
      <div className="container mx-auto px-4 py-4">
        <p className="text-center text-sm text-muted-foreground whitespace-pre-line">
          {footerText}
        </p>
      </div>
    </footer>
  );
}
