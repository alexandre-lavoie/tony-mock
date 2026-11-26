import type { UserResponse } from "@influencial/contracts";
import {
  Avatar,
  Badge,
  Card,
  Container,
  Flex,
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

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

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
              <Badge variant="soft">Member #{user.id}</Badge>
              <Text size="2" color="gray">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </main>
  );
}
