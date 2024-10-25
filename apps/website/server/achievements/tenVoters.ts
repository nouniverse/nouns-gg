import { eq } from "drizzle-orm";
import { db, proposals } from "~/packages/db/schema";
import type { AuthenticatedUser } from "../queries/users";

export default async function tenVoters(user: AuthenticatedUser) {
  const proposalsCreated = await db.query.proposals.findMany({
    where: eq(proposals.user, user.id),
    with: {
      votes: true,
    },
  });

  for (const proposal of proposalsCreated) {
    const unqiueVoters = new Set(proposal.votes.map((vote) => vote.user));

    if (unqiueVoters.size >= 10) {
      return true;
    }
  }

  return false;
}
