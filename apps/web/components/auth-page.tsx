"use client";

import type {
  CreateUserRequest,
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  UserResponse,
} from "@influencial/contracts";
import {
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Heading,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { browserApiUrl } from "../lib/api";
import { storeUser } from "../lib/auth";

type AuthMode = "login" | "signup";

export function AuthPage({ defaultMode }: { defaultMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(value: string) {
    setMode(value as AuthMode);
    setError(undefined);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const input = {
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
    } satisfies LoginRequest;

    try {
      const response = await fetch(`${browserApiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorResponse;
        throw new Error(body.error);
      }

      const body = (await response.json()) as LoginResponse;
      storeUser(body.user);
      router.push("/users");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();
    const input = {
      username: String(form.get("username") ?? "").trim(),
      displayName: displayName || null,
    } satisfies CreateUserRequest;

    try {
      const response = await fetch(`${browserApiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const body = (await response.json()) as ErrorResponse;
        throw new Error(body.error);
      }

      const { user } = (await response.json()) as UserResponse;
      storeUser({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      });
      router.push("/users");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="centered-page">
      <Container size="1" width="100%">
        <Card size="4">
          <Flex direction="column" gap="5">
            <Flex direction="column" gap="2">
              <Heading size="7">Welcome to Influencial</Heading>
              <Text color="gray">
                Log in to your account or create a new one.
              </Text>
            </Flex>

            <Tabs.Root value={mode} onValueChange={changeMode}>
              <Tabs.List size="2">
                <Tabs.Trigger value="login">Log in</Tabs.Trigger>
                <Tabs.Trigger value="signup">Sign up</Tabs.Trigger>
              </Tabs.List>

              {error ? (
                <Callout.Root className="auth-error" color="red">
                  <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
              ) : null}

              <Tabs.Content value="login">
                <form onSubmit={login}>
                  <Flex direction="column" gap="4" pt="4">
                    <Flex direction="column" gap="2">
                      <Text
                        as="label"
                        htmlFor="login-username"
                        size="2"
                        weight="medium"
                      >
                        Username
                      </Text>
                      <TextField.Root
                        id="login-username"
                        name="username"
                        placeholder="your-username"
                        required
                      />
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text
                        as="label"
                        htmlFor="login-password"
                        size="2"
                        weight="medium"
                      >
                        Password
                      </Text>
                      <TextField.Root
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Anything works"
                      />
                      <Text size="1" color="gray">
                        This demo does not validate passwords.
                      </Text>
                    </Flex>

                    <Button size="3" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Logging in…" : "Log in"}
                    </Button>
                  </Flex>
                </form>
              </Tabs.Content>

              <Tabs.Content value="signup">
                <form onSubmit={signup}>
                  <Flex direction="column" gap="4" pt="4">
                    <Flex direction="column" gap="2">
                      <Text
                        as="label"
                        htmlFor="signup-display-name"
                        size="2"
                        weight="medium"
                      >
                        Display name
                      </Text>
                      <TextField.Root
                        id="signup-display-name"
                        name="displayName"
                        placeholder="Your name"
                        maxLength={100}
                      />
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text
                        as="label"
                        htmlFor="signup-username"
                        size="2"
                        weight="medium"
                      >
                        Username
                      </Text>
                      <TextField.Root
                        id="signup-username"
                        name="username"
                        placeholder="your-username"
                        maxLength={50}
                        required
                      />
                    </Flex>

                    <Button size="3" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating account…" : "Create account"}
                    </Button>
                  </Flex>
                </form>
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </Card>
      </Container>
    </main>
  );
}
