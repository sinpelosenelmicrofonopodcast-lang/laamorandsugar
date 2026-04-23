import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="container py-24">
      <Card className="mx-auto max-w-2xl text-center">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-bakery-gold">
            404
          </p>
          <CardTitle>That page is not on the dessert table.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground">
            The page you requested may have moved, expired, or not been published yet.
          </p>
          <Button asChild variant="gold">
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
