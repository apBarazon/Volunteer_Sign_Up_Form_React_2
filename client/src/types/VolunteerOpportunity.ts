export type VolunteerOpportunity = {
  id: number;
  name: string;
  type: string; // "Education" | "Environment" | "Outreach"
  description: string;
  spotsLeft: number;
};
