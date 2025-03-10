import type { VercelRequest, VercelResponse } from "@vercel/node";

// 从环境变量中获取 GitHub 信息
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
    throw new Error('Missing GitHub environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        // 动态导入 Octokit
        const { Octokit } = await import('@octokit/rest');
        const octokit = new Octokit({
            auth: GITHUB_TOKEN,
        });

        // 获取请求中的图片数据和文件名
        const { imageData, fileName } = req.body;

        if (!imageData || !fileName) {
            return res.status(400).send('Missing image data or file name');
        }

        // 将图片数据转换为 Base64 编码
        const base64Data = Buffer.from(imageData, 'binary').toString('base64');

        // 上传图片到 GitHub 仓库
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: `images/${base64Data}-${fileName}`, // 假设图片存储在仓库的 images 文件夹下
            message: `Upload image: ${fileName}`,
            content: base64Data,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error uploading image to GitHub:', error);
        return res.status(500).send('Internal Server Error');
    }
}
