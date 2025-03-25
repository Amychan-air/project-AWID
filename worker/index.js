import { updateGithubFile } from './updateGithubFile.js';

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      let filePath = url.pathname.substring(1); // 取得請求的檔案名稱
  
      // 如果沒有指定文件，預設讀取 index.html
      if (!filePath) {
        filePath = "index.html";
      }
  
      if (filePath === "admin-page") {
        const editorPath = url.searchParams.get("filePath");
        const content = url.searchParams.get("content");
        return await updateGithubFile(editorPath, content, env);
      }

      const GITHUB_REPO = `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`;
      const BRANCH = env.GITHUB_BRANCH;
      const GITHUB_API_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${filePath}`;
  
      // 取得檔案內容
      const response = await fetch(GITHUB_API_URL);
      if (!response.ok) {
        return new Response("File not found", { status: 404 });
      }
  
      // 判斷 Content-Type
      const contentType = getContentType(filePath);
  
      // 如果是圖片，使用 `arrayBuffer()` 來處理二進制數據
      if (contentType.startsWith("image/")) {
        const imageBuffer = await response.arrayBuffer();
        return new Response(imageBuffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400", // 讓瀏覽器快取圖片
            "Access-Control-Allow-Origin": "*", // 允許 CORS
          }
        });
      }
  
      // 其他類型直接回應文字
      return new Response(await response.text(), {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*", // 允許 CORS
        }
      });
    }
  };
  
  // 判斷 Content-Type
  function getContentType(filePath) {
    if (filePath.endsWith(".html")) return "text/html";
    if (filePath.endsWith(".css")) return "text/css";
    if (filePath.endsWith(".js")) return "application/javascript";
    if (filePath.endsWith(".json")) return "application/json";
    if (filePath.endsWith(".svg")) return "image/svg+xml";
    if (filePath.endsWith(".png")) return "image/png";
    if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
    if (filePath.endsWith(".gif")) return "image/gif";
    if (filePath.endsWith(".webp")) return "image/webp";
    return "text/plain"; // 預設為純文字
  }
  