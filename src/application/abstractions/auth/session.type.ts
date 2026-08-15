import { UserRole } from "@/domain/users/user-role.js";
import { Nullable } from "@/app/types.js";

export type Session = {
  id: string;
  email: string;
  firstName: Nullable<string>;
  lastName: Nullable<string>;
  role: UserRole["value"];
  avatarUrl: Nullable<string>;
};
