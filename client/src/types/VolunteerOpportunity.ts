export type VolunteerOpportunity = {
  id: number;
  name: string;
  type: string; // "Education" | "Environment" | "Outreach"
  description: string;
  spotsLeft: number;
  imageUrl: string | null; // set by admins in the Admin Panel (volunteers.image_url)
};