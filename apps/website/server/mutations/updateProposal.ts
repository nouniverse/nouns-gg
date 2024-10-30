"use server";

import { db, proposals, rounds } from "~/packages/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { onlyUser } from ".";

export const updateProposal = onlyUser
  .schema(
    z.object({
      title: z.string(),
      image: z.string().optional(),
      content: z.string(),
      round: z.string(),
      video: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const round = await db.query.rounds.findFirst({
      where: eq(rounds.id, parsedInput.round),
      with: {
        proposals: {
          where: eq(proposals.user, ctx.user.id),
        },
      },
    });

    if (!round) {
      throw new Error("Round not found");
    }

    const proposal = round.proposals[0];

    if (!proposal) {
      throw new Error("You did not propose for this round");
    }

    const now = new Date();
    const votingStart = new Date(round.votingStart);

    if (now > votingStart) {
      throw new Error("Proposing has closed");
    }

    if (round.type === "image" && !parsedInput.image) {
      throw new Error("Image is required");
    }

    if (round.type === "video" && (!parsedInput.video || !parsedInput.image)) {
      throw new Error("Video and cover image is required");
    }

    await db
      .update(proposals)
      .set({
        title: parsedInput.title,
        content: parsedInput.content,
        image: parsedInput.image,
        video: parsedInput.video,
      })
      .where(eq(proposals.id, proposal.id));

    revalidatePath(`/rounds/${parsedInput.round}`);
    revalidatePath(`/rounds/${parsedInput.round}/create`);
  });
