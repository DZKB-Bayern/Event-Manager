export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  user_id: string;
  image_url?: string;
  color?: string;
  button_text?: string;
  button_link?: string;
  category?: string;
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
