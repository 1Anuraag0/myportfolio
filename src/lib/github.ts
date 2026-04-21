export interface GitHubUser {
  login: string;
  public_repos: number;
  avatar_url: string;
  bio: string;
  email: string | null;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  html_url: string;
  stargazers_count: number;
}

const USERNAME = '1Anuraag0';
const API_BASE = 'https://api.github.com';

export async function fetchGitHubData(): Promise<{
  user: GitHubUser;
  repos: GitHubRepo[];
}> {
  const [userRes, reposRes] = await Promise.all([
    fetch(`${API_BASE}/users/${USERNAME}`),
    fetch(`${API_BASE}/users/${USERNAME}/repos?sort=updated&per_page=6&type=public`),
  ]);

  const user = await userRes.json();
  const repos = await reposRes.json();

  return { user, repos };
}

export function aggregateLanguages(repos: GitHubRepo[]): string[] {
  const counts: Record<string, number> = {};
  repos.forEach((repo) => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang]) => lang);
}

export function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ContributionDay {
  color: string;
  contributionCount: number;
  contributionLevel: string;
  date: string;
}

export async function fetchGitHubContributions(year: string = 'all'): Promise<{ totalContributions: number; grid: ContributionDay[][] }> {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=${year}`);
    const data = await res.json();
    
    let total = Object.values(data.total).reduce((a: any, b: any) => a + b, 0) as number;
    
    const grid: ContributionDay[][] = [];
    let currentWeek: ContributionDay[] = [];
    
    data.contributions.forEach((day: any) => {
      currentWeek.push({
        color: '', // not used in our 3d garden
        contributionCount: day.count,
        contributionLevel: String(day.level),
        date: day.date
      });
      const d = new Date(day.date);
      if (d.getDay() === 6) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }

    return { totalContributions: total, grid };
  } catch (error) {
    console.error('Error fetching GitHub contributions:', error);
    return { totalContributions: 0, grid: [] };
  }
}

