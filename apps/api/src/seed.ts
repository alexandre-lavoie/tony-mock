import type { DatabaseAdapter } from "./database";

const firstNames = [
  "Avery",
  "Blake",
  "Cameron",
  "Dakota",
  "Emerson",
  "Frankie",
  "Gray",
  "Harper",
  "Indigo",
  "Jordan",
  "Kai",
  "Logan",
  "Morgan",
  "Nico",
  "Oakley",
  "Parker",
  "Quinn",
  "Reese",
  "Sage",
  "Taylor",
];

const lastNames = [
  "Anderson",
  "Brooks",
  "Chen",
  "Diaz",
  "Ellis",
  "Foster",
  "Green",
  "Hayes",
  "Ivanov",
  "Jones",
  "Kim",
  "Lopez",
  "Moore",
  "Nguyen",
  "Owens",
  "Patel",
  "Rivera",
  "Singh",
  "Turner",
  "Wilson",
];

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export async function seedDatabaseIfEmpty(
  database: DatabaseAdapter,
  userCount = 64,
): Promise<number> {
  if ((await database.listUsers()).length > 0) {
    return 0;
  }

  const userIds: number[] = [];

  for (let index = 0; index < userCount; index += 1) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const username = `${firstName}.${lastName}.${index + 1}`.toLowerCase();
    const user = await database.createUser({
      username,
      displayName: `${firstName} ${lastName}`,
    });

    userIds.push(user.id);
  }

  // Users may only follow users created earlier in the list. This produces a
  // varied graph while guaranteeing that seeded relationships cannot cycle.
  for (
    let followerIndex = 1;
    followerIndex < userIds.length;
    followerIndex += 1
  ) {
    const followerId = userIds[followerIndex] as number;
    let createdFollow = false;

    for (
      let followingIndex = 0;
      followingIndex < followerIndex;
      followingIndex += 1
    ) {
      if (Math.random() > 0.22) {
        continue;
      }

      await database.createFollow(
        followerId,
        userIds[followingIndex] as number,
      );
      createdFollow = true;
    }

    if (!createdFollow) {
      const followingIndex = Math.floor(Math.random() * followerIndex);
      await database.createFollow(
        followerId,
        userIds[followingIndex] as number,
      );
    }
  }

  return userIds.length;
}
