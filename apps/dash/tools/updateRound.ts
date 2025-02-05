import { agent } from "../";
import { db, rounds } from "~/packages/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TZDate } from "@date-fns/tz";

agent.addTool({
	description:
		"Takes a nouns.gg round id and updates any specified parameters on it",
	providers: ["discord"],
	parameters: z.object({
		round: z
			.string()
			.describe(
				"The round id to update (the path segment displayed after /rounds/ in the url)",
			),
		update: z.object({
			name: z.string().optional().describe("The new name/title of the round"),
			start: z
				.string()
				.optional()
				.describe("The new date and time the round starts in an ISO string"),
			votingStart: z
				.string()
				.optional()
				.describe(
					"The new date and time the round voting starts in an ISO string",
				),
			end: z
				.string()
				.optional()
				.describe("The new date and time the round ends in an ISO string"),
			community: z
				.string()
				.optional()
				.describe("The community the round belongs to"),
			event: z.string().optional().describe("The event the round belongs to"),
			featured: z
				.boolean()
				.optional()
				.describe(
					"Change whether the round should be featured and pinned to the top of the feed",
				),
		}),
	}),
	execute: async ({ parameters, context }) => {
		console.log(parameters);
		console.log(context);

		if (
			![
				"samscolari",
				"sasquatch",
				"peterpandam",
				"ohantheman",
				"patyiutazza",
			].includes(context.author)
		) {
			throw new Error("You are not authorized to update rounds");
		}

		const round = await db.query.rounds.findFirst({
			where: eq(rounds.id, parameters.round),
		});

		if (!round) {
			throw new Error("I couldn't find that round");
		}

		await db.transaction(async (tx) => {
			if (parameters.update.name !== undefined) {
				await tx
					.update(rounds)
					.set({ name: parameters.update.name })
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.start !== undefined) {
				await tx
					.update(rounds)
					.set({
						start: new TZDate(new Date(parameters.update.start), "+05:00"),
					})
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.votingStart !== undefined) {
				await tx
					.update(rounds)
					.set({
						votingStart: new TZDate(
							new Date(parameters.update.votingStart),
							"+05:00",
						),
					})
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.end !== undefined) {
				await tx
					.update(rounds)
					.set({ end: new TZDate(new Date(parameters.update.end), "+05:00") })
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.community !== undefined) {
				await tx
					.update(rounds)
					.set({ community: parameters.update.community })
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.event !== undefined) {
				await tx
					.update(rounds)
					.set({ event: parameters.update.event })
					.where(eq(rounds.id, round.id));
			}

			if (parameters.update.featured !== undefined) {
				await tx
					.update(rounds)
					.set({ featured: parameters.update.featured })
					.where(eq(rounds.id, round.id));
			}
		});
	},
});
