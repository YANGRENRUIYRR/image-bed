import fetch from 'node-fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';
async function getBadgeImage(url: string) {
    const res = await fetch(
        'https://raw.githubusercontent.com/'+process.env.GITHUB_USERNAME+'/'+process.env.GITHUB_REPO+'/refs/heads/main/images/'+url
    );

    if (!res.ok) throw 'error';
    return await res.text();
}

export default async (request: VercelRequest, response: VercelResponse) => {
    let { url } = request.query;

    if (Array.isArray(url)) url = url[0];
    getBadgeImage(url as string)
        .then((data) => {
            response
                .status(200)
                .setHeader('Content-Type', 'image/svg+xml;charset=utf-8')
                .setHeader('Cache-Control', 'public, max-age=43200') // 43200s（12h） cache
                .send(data);
        })
        .catch(() => {
            response.status(500).send('error');
        });
};
