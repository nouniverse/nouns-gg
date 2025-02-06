import { eq } from "drizzle-orm";
import { db, products } from "~/packages/db/schema";

type ProductUpdated = {
	admin_graphql_api_id: string;
	variants: Array<{
		admin_graphql_api_id: string;
		inventory_quantity: number;
		price: string;
	}>;
};

export async function POST(request: Request) {
	const updatedProducts: ProductUpdated[] = [];

	await db.transaction(async (tx) => {
		for (const updatedProduct of updatedProducts) {
			const product = await tx.query.products.findFirst({
				where: eq(products.shopifyId, updatedProduct.admin_graphql_api_id),
			});

			if (!product) {
				continue;
			}

			await tx
				.update(products)
				.set({
					variants: product.variants.map((variant) => {
						const updatedVariant = updatedProduct.variants.find(
							(v) => v.admin_graphql_api_id === variant.shopifyId,
						);

						if (!updatedVariant) {
							return variant;
						}

						return {
							...variant,
							inventory: updatedVariant.inventory_quantity,
							price: Number(updatedVariant.price),
						};
					}),
				})
				.where(eq(products.shopifyId, updatedProduct.admin_graphql_api_id));
		}
	});
}
