export const UserConstraints = {
  EmailUnique: "uq_users_email",
  GoogleIdUnique: "uq_users_google_id",
  GithubIdUnique: "uq_users_github_id",
  RoleCheck: "ck_users_role",
} as const;
