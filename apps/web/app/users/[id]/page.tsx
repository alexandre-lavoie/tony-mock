import type {
  InfluenceResponse,
  RecursiveFollowersResponse,
  UserResponse,
} from "@influencial/contracts";
import {
  Avatar,
  Badge,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { notFound } from "next/navigation";

import { apiUrl } from "../../../lib/api";

async function getUser(id: string) {
  const response = await fetch(`${apiUrl}/api/users/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404 || response.status === 400) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Unable to load this profile.");
  }

  return ((await response.json()) as UserResponse).user;
}

async function getInfluenceScore(id: string) {
  const response = await fetch(`${apiUrl}/users/${id}/influence`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to calculate this user's influence score.");
  }

  return ((await response.json()) as InfluenceResponse).score;
}

async function getRecursiveFollowers(id: string) {
  const response = await fetch(`${apiUrl}/users/${id}/influence/followers`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load this user's followers.");
  }

  return ((await response.json()) as RecursiveFollowersResponse).followers;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, influenceScore, followers] = await Promise.all([
    getUser(id),
    getInfluenceScore(id),
    getRecursiveFollowers(id),
  ]);

  return (
    <main className="page-shell">
      <Container size="2">
        <Flex direction="column" gap="4">
          <Text asChild size="2" color="gray">
            <Link href="/users">← Back to people</Link>
          </Text>

          <Card size="5">
            <Flex direction="column" align="center" gap="4">
              <Avatar
                size="8"
                radius="full"
                fallback={(user.displayName ?? user.username)
                  .slice(0, 2)
                  .toUpperCase()}
              />
              <Flex direction="column" align="center" gap="2">
                <Heading size="8">{user.displayName ?? user.username}</Heading>
                <Text size="4" color="gray">
                  @{user.username}
                </Text>
              </Flex>
              <Flex gap="2" wrap="wrap" justify="center">
                <Badge color="blue" variant="solid">
                  Influence: {influenceScore}
                </Badge>
              </Flex>
              <Text size="2" color="gray">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </Flex>
          </Card>

          <Card size="4">
            <Flex direction="column" gap="4">
              <Flex align="baseline" justify="between" gap="3">
                <Heading size="5">Followers</Heading>
                <Text size="2" color="gray">
                  {followers.length} total
                </Text>
              </Flex>

              {followers.length ? (
                <Grid columns={{ initial: "1", sm: "2" }} gap="3">
                  {followers.map((follower) => (
                    <Card asChild size="2" key={follower.id}>
                      <Link
                        className="user-link"
                        href={`/users/${follower.id}`}
                      >
                        <Flex align="center" gap="3">
                          <Avatar
                            size="3"
                            radius="full"
                            fallback={(
                              follower.displayName ?? follower.username
                            )
                              .slice(0, 2)
                              .toUpperCase()}
                          />
                          <Flex direction="column" gap="1">
                            <Text size="2" weight="bold">
                              {follower.displayName ?? follower.username}
                            </Text>
                            <Text size="1" color="gray">
                              @{follower.username}
                            </Text>
                            <Text size="1" color="blue">
                              {follower.depth === 1
                                ? "Direct follower"
                                : `${follower.depth} levels away`}
                            </Text>
                          </Flex>
                        </Flex>
                      </Link>
                    </Card>
                  ))}
                </Grid>
              ) : (
                <Text color="gray">This user has no followers yet.</Text>
              )}
            </Flex>
          </Card>
        </Flex>
      </Container>
    </main>
  );
}
