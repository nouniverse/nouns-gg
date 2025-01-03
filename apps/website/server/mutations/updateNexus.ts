"use server";

import { z } from "zod";
import { onlyUser } from ".";
import { revalidatePath } from "next/cache";
import { db, nexus, ranks, seasons } from "~/packages/db/schema";
import { asc, desc, eq, lte, or } from "drizzle-orm";

export const updateNexus = onlyUser
	.schema(
		z.object({
			name: z.string().optional(),
			image: z.string().optional(),
			bio: z.string().optional(),
			canRecieveEmails: z.boolean().optional(),
		}),
	)
	.action(async ({ parsedInput, ctx }) => {
		const updateData: Partial<typeof parsedInput> = {};

		if (parsedInput.name !== undefined) updateData.name = parsedInput.name;
		if (parsedInput.image !== undefined) updateData.image = parsedInput.image;
		if (parsedInput.bio !== undefined) updateData.bio = parsedInput.bio;
		if (parsedInput.canRecieveEmails !== undefined)
			updateData.canRecieveEmails = parsedInput.canRecieveEmails;

		if (Object.keys(updateData).length > 0) {
			await db
				.update(nexus)
				.set(updateData)
				.where(
					or(
						ctx.user.nexus?.discord
							? eq(nexus.discord, ctx.user.nexus.discord)
							: undefined,
						eq(nexus.id, ctx.user.id),
					),
				);

			revalidatePath(`/users/${ctx.user.id}`);
			if (ctx.user.nexus?.discord) {
				revalidatePath(`/users/${ctx.user.nexus.discord}`);
			}
			revalidatePath("/nexus");
		}
	});
