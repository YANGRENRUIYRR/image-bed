import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getBadgeImage(url: string) {
    const githubUsername = process.env.GITHUB_USERNAME;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubUsername || !githubRepo) {
        throw new Error('Missing GitHub environment variables');
    }

    const imageUrl = `https://raw.githubusercontent.com/${githubUsername}/${githubRepo}/refs/heads/main/images/${url}`;
    const res = await fetch(imageUrl);

    if (!res.ok) {
        throw new Error(`Request failed with status code ${res.status}`);
    }

    const contentType = res.headers.get('Content-Type');
    const buffer = await res.buffer();

    return { contentType, buffer };
}

export default async (request: VercelRequest, response: VercelResponse) => {
    let { url } = request.query;

    if (Array.isArray(url)) {
        url = url[0];
    }

    if (!url) {
        return response.status(400).send('Missing "url" query parameter');
    }

    try {
        const { contentType, buffer } = await getBadgeImage(url as string);
        response
           .status(200)
           .setHeader('Content-Type', contentType || 'image/svg+xml')
           .setHeader('Cache-Control', 'public, max-age=43200') // 43200s（12h） cache
           .end(buffer);
    } catch (error) {
        console.error('Error fetching image:', error);
        response.status(500).send('Internal Server Error');
    }
};
