import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <div className="text-center max-w-sm">
        <div className="font-mono text-6xl font-bold text-border mb-4">404</div>
        <h2 className="text-lg font-semibold text-forest-slate mb-2">Page not found</h2>
        <p className="text-sm text-mossy-gray mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
