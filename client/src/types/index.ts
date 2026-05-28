export interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url: string;
}

export interface AuthStatus {
  github: GithubUser | null;
  twitter: TwitterUser | null;
}

export interface Repo {
  full_name: string;
  description: string | null;
  language: string | null;
  private: boolean;
  pushed_at: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface RepoMeta {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
}

export interface CommitsResponse {
  commits: Commit[];
  repo: RepoMeta;
}
