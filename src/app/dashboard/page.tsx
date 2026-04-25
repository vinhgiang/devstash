import { Plus, Search, Package, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border shrink-0">
          <Package className="size-5 text-primary" />
          <span className="font-semibold text-lg">DevStash</span>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 h-14 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Button variant="ghost" size="icon" className="shrink-0">
              <PanelLeft className="size-4" />
            </Button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-9"
              />
            </div>
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

        <main className="flex-1 p-6 overflow-auto">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}
