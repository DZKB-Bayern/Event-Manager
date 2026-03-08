export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  /**
   * The Webling member ID associated with this event. This replaces the
   * previous `user_id` field. All event queries should filter on this
   * identifier rather than the Supabase user id.
   */
  webling_member_id: string;
  image_url?: string;
  color?: string;
  button_text?: string;
  button_link?: string;
}

export interface AdminEvent extends Event {
  profiles?: { username: string };
}

export interface Profile {
  id: string;
  username: string;
  role: string;
  created_at: string;
}
