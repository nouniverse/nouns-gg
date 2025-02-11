import { env } from "~/env";
import { asc, eq, isNotNull, or } from "drizzle-orm";
import { db, nexus, ranks, xp } from "~/packages/db/schema";
import { unstable_cache as cache } from "next/cache";
import { cookies } from "next/headers";
import checkDiscordAccountAge from "@/utils/checkDiscordAccountAge";
import { privyClient } from "../clients/privy";
import { pinataClient } from "../clients/pinata";

export async function getAuthenticatedUser() {
	const token = (await cookies()).get("privy-id-token");

	if (!token) return;

	try {
		const privyUser = await privyClient.getUser({ idToken: token.value });

		let userNexus = await db.query.nexus.findFirst({
			where: eq(nexus.id, privyUser.id),
			with: {
				rank: true,
				carts: {
					with: {
						product: true,
					},
				},
			},
		});

		try {
			if (!userNexus) {
				const [fullPrivyUser, lowestRank, inServer] = await Promise.all([
					privyClient.getUser(privyUser.id),
					db.query.ranks.findFirst({
						orderBy: asc(ranks.place),
					}),
					privyUser.discord?.subject &&
					checkDiscordAccountAge(privyUser.discord.subject)
						? isInServer({ subject: privyUser.discord.subject })
						: undefined,
				]);

				let rank: number | null = null;

				if (lowestRank) {
					if (fullPrivyUser.discord && inServer) {
						rank = lowestRank.id;
					}

					if (fullPrivyUser.farcaster) {
						rank = lowestRank.id;
					}
				}

				const image = await pinataClient.upload.url(
					fullPrivyUser.farcaster?.pfp ??
						fullPrivyUser.twitter?.profilePictureUrl ??
						`https://api.cloudnouns.com/v1/pfp?text=${privyUser.id}&background=1`,
				);

				await db.insert(nexus).values({
					id: privyUser.id,
					rank,
					name:
						fullPrivyUser.farcaster?.displayName ??
						fullPrivyUser.twitter?.name ??
						fullPrivyUser.discord?.username?.split("#")[0] ??
						fullPrivyUser.email?.address.split("@")[0] ??
						privyUser.id.replace("did:privy:", "").substring(0, 8),
					image: `https://ipfs.nouns.gg/ipfs/${image.IpfsHash}`,
					bio: fullPrivyUser.farcaster?.bio ?? "",
					twitter: fullPrivyUser.twitter?.username,
					discord: fullPrivyUser.discord?.username?.split("#")[0],
					username: fullPrivyUser.farcaster?.username ?? undefined,
					fid: fullPrivyUser.farcaster?.fid ?? undefined,

					canRecieveEmails: false,
				});

				userNexus = await db.query.nexus.findFirst({
					where: eq(nexus.id, privyUser.id),
					with: {
						rank: true,
						carts: {
							with: {
								product: true,
							},
						},
					},
				});
			}
		} catch (e) {}

		return {
			id: privyUser.id,
			discord: privyUser.discord,
			twitter: privyUser.twitter,
			farcaster: privyUser.farcaster,
			wallets: privyUser.linkedAccounts.filter(
				(account) => account.type === "wallet",
			),
			email: privyUser.email,
			nexus: userNexus,
		};
	} catch (e) {
		console.error(e);
	}
}

export type AuthenticatedUser = NonNullable<
	Awaited<ReturnType<typeof getAuthenticatedUser>>
>;

export const isInServer = async (input: { subject: string }) => {
	return (
		await fetch(
			`https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${input.subject}`,
			{
				headers: {
					Authorization: `Bot ${env.DISCORD_TOKEN}`,
				},
			},
		)
	).ok;
};

export const getUser = cache(
	async (input: { user: string }) => {
		return db.query.nexus.findFirst({
			where: or(eq(nexus.id, input.user), eq(nexus.username, input.user)),
			with: {
				rank: true,
			},
		});
	},
	["getUser"],
	{ tags: ["getUser"], revalidate: 60 * 10 },
);

export const getUserStats = cache(
	async (input: { user: string }) => {
		const user = await db.query.nexus.findFirst({
			where: eq(nexus.id, input.user),
			with: {
				proposals: true,
				xpRecords: {
					where: isNotNull(xp.quest),
				},
				votes: true,
			},
		});

		return {
			proposalsCreated: user?.proposals.length ?? 0,
			questsCompleted: user?.xpRecords.length ?? 0,
			votesCast: user?.votes.length ?? 0,
		};
	},
	["getUserStats"],
	{ tags: ["getUserStats"], revalidate: 60 * 10 },
);
