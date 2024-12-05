"use server";

import { db, predictions } from "~/packages/db/schema";
import { eq } from "drizzle-orm";
import { unstable_cache as cache } from "next/cache";

export const getPrediction = cache(
	async (input: { id: string }) => {
		return db.query.predictions.findFirst({
			where: eq(predictions.id, input.id),
			with: {
				outcomes: true,
			},
		});
	},
	["getPrediction"],
	{ revalidate: 60 * 10 },
);
