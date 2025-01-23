const repoURL = 'https://api.github.com/repos/c01dkit/sec-papers-collection'

async function getRepoStatistics() {
    try {
        let response = await fetch(repoURL);
        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export const GithubService = {
    getRepoStatisticsData() {
        return getRepoStatistics();
    }
}