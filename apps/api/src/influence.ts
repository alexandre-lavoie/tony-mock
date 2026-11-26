import type { FollowEdge } from "./database";

function createFollowerIndex(followEdges: FollowEdge[]) {
  const followerIdsByUserId = new Map<number, number[]>();

  for (const { followerId, followingId } of followEdges) {
    const followerIds = followerIdsByUserId.get(followingId) ?? [];
    followerIds.push(followerId);
    followerIdsByUserId.set(followingId, followerIds);
  }

  return followerIdsByUserId;
}

function calculateFollowerDepths(
  userId: number,
  followerIdsByUserId: Map<number, number[]>,
): Map<number, number> {
  const depths = new Map<number, number>([[userId, 0]]);
  const pendingUserIds = [userId];

  while (pendingUserIds.length > 0) {
    const currentUserId = pendingUserIds.shift();

    if (currentUserId === undefined) {
      continue;
    }

    const nextDepth = (depths.get(currentUserId) ?? 0) + 1;

    for (const followerId of followerIdsByUserId.get(currentUserId) ?? []) {
      if (depths.has(followerId)) {
        continue;
      }

      depths.set(followerId, nextDepth);
      pendingUserIds.push(followerId);
    }
  }

  depths.delete(userId);
  return depths;
}

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
  const followerIdsByUserId = createFollowerIndex(followEdges);

  return new Map(
    userIds.map((userId) => [
      userId,
      calculateFollowerDepths(userId, followerIdsByUserId).size,
    ]),
  );
}

export function calculateRecursiveFollowerDepths(
  userId: number,
  followEdges: FollowEdge[],
): Map<number, number> {
  return calculateFollowerDepths(userId, createFollowerIndex(followEdges));
}
