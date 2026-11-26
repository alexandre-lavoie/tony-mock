import type { UsersResponse } from "@influencial/contracts";
import { Card, Container, Flex, Heading, Text } from "@radix-ui/themes";

import { UsersGrid } from "../../components/users-grid";
import { apiUrl } from "../../lib/api";

async function getUsers() {
  const response = await fetch(`${apiUrl}/api/users`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Unable to load users.");
  }

  return ((await response.json()) as UsersResponse).users;
}

export default async function UsersPage() {
  const users = await getUsers();
  const sortedUsers = [...users].sort(
    (left, right) =>
      right.influenceScore - left.influenceScore ||
      left.username.localeCompare(right.username),
  );

  return (
    <main className="page-shell">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="2">
            <Heading size="8">People</Heading>
            <Text size="4" color="gray">
              Everyone currently on Influencial.
            </Text>
          </Flex>

          {sortedUsers.length ? (
            <UsersGrid users={sortedUsers} />
          ) : (
            <Card size="3">
              <Text color="gray">No users have joined yet.</Text>
            </Card>
          )}
        </Flex>
      </Container>
    </main>
  );
}
