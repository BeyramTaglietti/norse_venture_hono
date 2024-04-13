export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    profile_picture: string | null;
    created_at: Date;
  };
};
