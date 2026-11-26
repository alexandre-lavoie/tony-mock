"use client";

import { Button, Container, Flex, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearStoredUser,
  getStoredUser,
  type SessionUser,
  subscribeToAuthChange,
} from "../lib/auth";

export function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const updateUser = () => setUser(getStoredUser());

    updateUser();
    return subscribeToAuthChange(updateUser);
  }, []);

  function logout() {
    clearStoredUser();
    router.push("/login");
  }

  return (
    <header className="site-header">
      <Container size="4">
        <Flex align="center" justify="between" gap="4">
          <Text asChild size="5" weight="bold">
            <Link className="brand" href="/users">
              Influencial
            </Link>
          </Text>

          <Flex align="center" gap="3">
            <Button asChild variant="ghost">
              <Link href="/users">People</Link>
            </Button>
            {user ? (
              <>
                <Button asChild variant="ghost">
                  <Link href={`/users/${user.id}`}>
                    {user.displayName ?? `@${user.username}`}
                  </Link>
                </Button>
                <Button variant="soft" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Log in</Link>
              </Button>
            )}
          </Flex>
        </Flex>
      </Container>
    </header>
  );
}
