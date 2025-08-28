import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Journey Homepage</h1>
        <p className="mt-2 text-sm opacity-80">Placeholder for journey flow</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button>Start Journey</Button>
        </div>
      </div>
    </main>
  );
}
