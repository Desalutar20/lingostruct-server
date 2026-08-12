import { UserRole } from "@/domain/users/user-role.js";

export type Session = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole["value"];
};
