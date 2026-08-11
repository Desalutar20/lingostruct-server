export type Session = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "regular";
};
