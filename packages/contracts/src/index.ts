export type DatabaseDialect = "sqlite" | "postgresql";

export type User = {
  id: number;
  username: string;
  displayName: string | null;
  createdAt: string;
};

export type Follow = {
  followerId: number;
  followingId: number;
  createdAt: string;
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
