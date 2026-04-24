import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <span className="font-semibold text-lg">DevStash</span>
        </div>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Plus className="size-4" />
            New Collection
          </Button>
          <Button>
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-64 border-r border-border p-6 shrink-0">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}