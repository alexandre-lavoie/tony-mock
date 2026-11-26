import type { UsersResponse } from "@influencial/contracts";
import {
  Avatar,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";

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

          {users.length ? (
            <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
              {users.map((user) => (
                <Link
                  className="user-link"
                  href={`/users/${user.id}`}
                  key={user.id}
                >
                  <Card className="user-card" size="3">
                    <Flex align="center" gap="4">
                      <Avatar
                        size="4"
                        radius="full"
                        fallback={(user.displayName ?? user.username)
                          .slice(0, 2)
                          .toUpperCase()}
                      />
                      <Flex direction="column" gap="1">
                        <Text size="3" weight="bold">
                          {user.displayName ?? user.username}
                        </Text>
                        <Text size="2" color="gray">
                          @{user.username}
                        </Text>
                      </Flex>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Grid>
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
