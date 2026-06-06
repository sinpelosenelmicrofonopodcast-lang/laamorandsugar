import Link from "next/link";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductVisibilityToggle } from "@/components/admin/product-visibility-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllProductsAdmin } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-bakery-gold">
            Products
          </p>
          <CardTitle>Manage the storefront catalog</CardTitle>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.categories?.name ?? "Uncategorized"}</TableCell>
                <TableCell>{formatCurrency(product.base_price)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProductVisibilityToggle
                      productId={product.id}
                      productName={product.name}
                      published={product.active && product.status === "active"}
                    />
                    {product.status === "archived" ? (
                      <Badge variant="outline">Archived</Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                    </Button>
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
