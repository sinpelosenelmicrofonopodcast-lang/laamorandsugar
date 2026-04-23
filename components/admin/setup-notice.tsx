import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <Card className="border-bakery-gold/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(197,155,69,0.08))]">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-serif text-3xl text-foreground">Finish Supabase and Stripe setup</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The UI is ready, but this environment still needs real credentials before admin CRUD, checkout, and uploads can run end to end.
          </p>
        </div>
        <Button asChild variant="gold">
          <Link href="https://vercel.com/docs" target="_blank" rel="noreferrer">
            Open deployment docs
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
