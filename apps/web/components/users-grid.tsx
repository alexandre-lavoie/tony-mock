"use client";

import type {
  ErrorResponse,
  FollowingResponse,
  UserListItem,
} from "@influencial/contracts";
import { Avatar, Button, Card, Flex, Grid, Text } from "@radix-ui/themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiUrl } from "../lib/api";
import {
  getStoredUser,
  type SessionUser,
  subscribeToAuthChange,
} from "../lib/auth";

export function UsersGrid({ users }: { users: UserListItem[] }) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [followerIds, setFollowerIds] = useState<Set<number>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    async function updateSession() {
      const user = getStoredUser();
      setSessionUser(user);
      setFollowerIds(new Set());
      setFollowingIds(new Set());

      if (!user) {
        return;
      }

      const response = await fetch(`${apiUrl}/users/${user.id}/following`);

      if (response.ok) {
        const body = (await response.json()) as FollowingResponse;
        setFollowerIds(new Set(body.followerIds));
        setFollowingIds(new Set(body.followingIds));
      }
    }

    void updateSession();
    return subscribeToAuthChange(() => void updateSession());
  }, []);

  async function toggleFollow(followingId: number) {
    if (!sessionUser) {
      return;
    }

    const isFollowing = followingIds.has(followingId);
    setPendingIds((current) => new Set(current).add(followingId));
    setErrors((current) => ({ ...current, [followingId]: "" }));

    try {
      const response = await fetch(
        `${apiUrl}/users/${sessionUser.id}/follow/${followingId}`,
        { method: isFollowing ? "DELETE" : "POST" },
      );

      if (!response.ok && !(response.status === 409 && !isFollowing)) {
        const body = (await response.json()) as ErrorResponse;
        throw new Error(body.error);
      }

      setFollowingIds((current) => {
        const next = new Set(current);

        if (isFollowing) {
          next.delete(followingId);
        } else {
          next.add(followingId);
        }

        return next;
      });
      router.refresh();
    } catch (cause) {
      setErrors((current) => ({
        ...current,
        [followingId]:
          cause instanceof Error ? cause.message : "Unable to follow user.",
      }));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(followingId);
        return next;
      });
    }
  }

  return (
    <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
      {users.map((user) => {
        const isFollowing = followingIds.has(user.id);
        const followsYou = followerIds.has(user.id);
        const isPending = pendingIds.has(user.id);

        return (
          <Card className="user-card" size="3" key={user.id}>
            <Flex direction="column" gap="3">
              <Link className="user-link" href={`/users/${user.id}`}>
                <Flex align="center" justify="between" gap="4">
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
                  <Text
                    aria-label={`Influence: ${user.influenceScore}`}
                    size="6"
                    weight="bold"
                  >
                    {user.influenceScore}
                  </Text>
                </Flex>
              </Link>

              {sessionUser && sessionUser.id !== user.id ? (
                <Flex direction="column" gap="1">
                  <Button
                    variant={isFollowing ? "soft" : "solid"}
                    disabled={followsYou || isPending}
                    onClick={() => void toggleFollow(user.id)}
                  >
                    {isPending
                      ? isFollowing
                        ? "Unfollowing…"
                        : "Following…"
                      : isFollowing
                        ? "Following"
                        : followsYou
                          ? "Follows you"
                          : "Follow"}
                  </Button>
                  {errors[user.id] ? (
                    <Text size="1" color="red">
                      {errors[user.id]}
                    </Text>
                  ) : null}
                </Flex>
              ) : null}
            </Flex>
          </Card>
        );
      })}
    </Grid>
  );
}
