import type { FollowEdge } from "./database";

export async function calculateInfluenceScore(
  userId: number,
  listFollowerIds: (userId: number) => Promise<number[]>,
): Promise<number> {
  const discoveredUserIds = new Set([userId]);
  const pendingUserIds = [userId];

  while (pendingUserIds.length > 0) {
    const currentUserId = pendingUserIds.shift();

    if (currentUserId === undefined) {
      continue;
    }

    const followerIds = await listFollowerIds(currentUserId);

    for (const followerId of followerIds) {
      if (discoveredUserIds.has(followerId)) {
        continue;
      }

      discoveredUserIds.add(followerId);
      pendingUserIds.push(followerId);
    }
  }

  return discoveredUserIds.size - 1;
}

export function calculateInfluenceScores(
  userIds: number[],
  followEdges: FollowEdge[],
): Map<number, number> {
  const followerIdsByUserId = new Map<number, number[]>();

  for (const { followerId, followingId } of followEdges) {
    const followerIds = followerIdsByUserId.get(followingId) ?? [];
    followerIds.push(followerId);
    followerIdsByUserId.set(followingId, followerIds);
  }

  return new Map(
    userIds.map((userId) => {
      const discoveredUserIds = new Set([userId]);
      const pendingUserIds = [userId];

      while (pendingUserIds.length > 0) {
        const currentUserId = pendingUserIds.shift();

        if (currentUserId === undefined) {
          continue;
        }

        for (const followerId of followerIdsByUserId.get(currentUserId) ?? []) {
          if (discoveredUserIds.has(followerId)) {
            continue;
          }

          discoveredUserIds.add(followerId);
          pendingUserIds.push(followerId);
        }
      }

      return [userId, discoveredUserIds.size - 1];
    }),
  );
}
