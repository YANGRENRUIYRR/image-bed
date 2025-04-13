import type { VercelRequest, VercelResponse } from "@vercel/node";

// 从环境变量中获取 GitHub 信息
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

console.log('GitHub 环境变量检查：');
console.log('GITHUB_USERNAME:', GITHUB_USERNAME);
console.log('GITHUB_REPO:', GITHUB_REPO);
console.log('GITHUB_TOKEN:', GITHUB_TOKEN);

if (!GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_TOKEN) {
    throw new Error('Missing GitHub environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('接收到请求，请求方法:', req.method);
    if (req.method !== 'POST') {
        console.log('请求方法不是 POST，返回 405 错误');
        return res.status(405).send('Method Not Allowed');
    }

    try {
        console.log('开始动态导入 Octokit');
        // 动态导入 Octokit
        const { Octokit } = await import('@octokit/rest');
        console.log('Octokit 导入成功');
        const octokit = new Octokit({
            auth: GITHUB_TOKEN,
        });

        // 获取请求中的图片数据和文件名
        const { imageData, fileName } = req.body;

        console.log('请求体中的数据：');
        console.log('imageData:', imageData);
        console.log('fileName:', fileName);

        if (!imageData || !fileName) {
            console.log('缺少图片数据或文件名，返回 400 错误');
            return res.status(400).send('Missing image data or file name');
        }

        // 将图片数据转换为 Base64 编码
        const base64Data = Buffer.from(imageData, 'binary').toString('base64');
        const time = Date.now();
        console.log('图片数据已转换为 Base64 编码');

        console.log('开始上传图片到 GitHub 仓库');
        // 上传图片到 GitHub 仓库
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: `images/${time}-${fileName}`, // 假设图片存储在仓库的 images 文件夹下
            message: `Upload image: ${fileName}`,
            content: base64Data,
        });
        console.log('图片上传到 GitHub 仓库成功');

        // 提取上传文件的 URL
        const url = `/images/${time}-${fileName}`;

        console.log('上传成功，返回 200 响应');
        return res.status(200).json({
            success: true,
            data,
            url,
        });
    } catch (error) {
        console.error('Error uploading image to GitHub:', error);
        return res.status(500).send('Internal Server Error');
    }
}
