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
