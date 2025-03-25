export async function updateGithubFile(editorPath, content, env) {
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    const REPO_OWNER = env.GITHUB_REPO_OWNER;
    const REPO_NAME = env.GITHUB_REPO_NAME;
    const FILE_PATH = editorPath || "test-editor.txt";
    const BRANCH = "main";
    const COMMIT_MESSAGE = "Updated via Cloudflare Workers";

    const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    // 辅助函数：将字符串转换为 Base64
    function encodeBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    try {
        // 获取最新的 SHA
        const response = await fetch(GITHUB_API_URL, {
            headers: { 
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'Cloudflare-Worker-GitHub-API'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`获取文件失败: ${response.status} ${response.statusText}\n错误详情: ${errorText}`);
        }

        const data = await response.json();
        const sha = data.sha;

        // 新的檔案內容（使用辅助函数进行 Base64 编码）
        const newContent = encodeBase64(content || "这是新的内容，来自 Cloudflare Workers！");

        // 提交 & 推送
        const updateResponse = await fetch(GITHUB_API_URL, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Cloudflare-Worker-GitHub-API"
            },
            body: JSON.stringify({
                message: COMMIT_MESSAGE,
                content: newContent,
                branch: BRANCH,
                sha: sha
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`更新文件失败: ${updateResponse.status} ${updateResponse.statusText}\n错误详情: ${errorText}`);
        }

        const result = await updateResponse.json();
        return new Response(JSON.stringify(result), { 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            } 
        });
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            status: "error",
            details: {
                repo: `${REPO_OWNER}/${REPO_NAME}`,
                file: FILE_PATH,
                branch: BRANCH
            }
        }), { 
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}

  