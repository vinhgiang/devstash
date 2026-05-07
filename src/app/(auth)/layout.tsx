import { Package } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Package className="size-6 text-primary" />
            <span className="font-semibold text-xl">DevStash</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
