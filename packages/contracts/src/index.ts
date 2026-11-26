export type DatabaseDialect = "sqlite" | "postgresql";

export type User = {
  id: number;
  username: string;
  displayName: string | null;
  createdAt: string;
};

export type CreateUserRequest = {
  username: string;
  displayName?: string | null;
};

export type UserResponse = {
  user: User;
};

export type LoginRequest = {
  username: string;
  password?: string;
};

export type LoginResponse = {
  user: Pick<User, "id" | "username" | "displayName">;
};

export type Follow = {
  followerId: number;
  followingId: number;
  createdAt: string;
};

export type FollowResponse = {
  follow: Follow;
};

export type HealthResponse = {
  status: "ok";
  database: DatabaseDialect;
};

export type MessageResponse = {
  message: string;
};

export type UsersResponse = {
  users: User[];
};

export type ErrorResponse = {
  error: string;
};
