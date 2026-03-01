export interface ApiUser {
  id: string;
  pkid?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  status?: string;
  profile?: {
    id?: string;
    name: string;
    avatar?: string;
    cellphone?: string;
  };
  groups?: { id: number; name: string }[];
}
