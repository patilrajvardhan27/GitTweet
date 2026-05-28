'use strict';

const axios = require('axios');

const BASE = 'https://api.github.com';

/**
 * @param {string} token
 * @returns {import('axios').AxiosInstance}
 */
function client(token) {
  return axios.create({
    baseURL: BASE,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

/**
 * @param {string} token
 * @returns {Promise<{ login: string, name: string, avatar_url: string }>}
 */
async function getUser(token) {
  const { data } = await client(token).get('/user');
  return { login: data.login, name: data.name, avatar_url: data.avatar_url };
}

/**
 * @param {string} token
 * @returns {Promise<Array<{ full_name: string, description: string|null, language: string|null, private: boolean, pushed_at: string }>>}
 */
async function getRepos(token) {
  const { data } = await client(token).get('/user/repos', {
    params: { sort: 'pushed', per_page: 50, type: 'owner' },
  });
  return data.map((r) => ({
    full_name: r.full_name,
    description: r.description,
    language: r.language,
    private: r.private,
    pushed_at: r.pushed_at,
  }));
}

/**
 * @param {string} token
 * @param {string} repo  e.g. "owner/name"
 * @param {string} since  ISO 8601 string
 * @returns {Promise<{ commits: Array, repo: object }>}
 */
async function getCommits(token, repo, since) {
  const gh = client(token);

  const [commitsRes, repoRes] = await Promise.all([
    gh.get(`/repos/${repo}/commits`, { params: { since, per_page: 100 } }),
    gh.get(`/repos/${repo}`),
  ]);

  const commits = commitsRes.data.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split('\n')[0], // first line only
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));

  const r = repoRes.data;
  const repoMeta = {
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    language: r.language,
  };

  return { commits, repo: repoMeta };
}

module.exports = { getUser, getRepos, getCommits };
