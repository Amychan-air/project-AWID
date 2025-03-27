import { updateGithubFile } from './updateGithubFile.js';
import { adminPage } from './admin-page.js';

// 验证 Basic Auth
function checkBasicAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  const [type, credentials] = authHeader.split(' ');
  if (type !== 'Basic') {
    return false;
  }

  const [username, password] = atob(credentials).split(':');
  return username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
}

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      let filePath = url.pathname.substring(1); // 取得請求的檔案名稱
      
      // 处理管理页面请求
      if (filePath === "admin-page") {
        // 检查认证
        if (!checkBasicAuth(request, env)) {
          return new Response('Unauthorized', {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Basic realm="Admin Area"'
            }
          });
        }
        
        // 处理 POST 请求 - 更新文件
        if (request.method === "POST") {
          try {
            // 从请求体中解析 JSON 数据
            const { filePath, content } = await request.json();
            if (!filePath || !content) {
              return new Response(
                JSON.stringify({ error: '文件路径和内容不能为空' }), 
                { 
                  status: 400, 
                  headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                  } 
                }
              );
            }
            return await updateGithubFile(filePath, content, env);
          } catch (error) {
            return new Response(
              JSON.stringify({ error: `解析请求失败: ${error.message}` }), 
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                } 
              }
            );
          }
        }
        
        // 处理预检请求
        if (request.method === "OPTIONS") {
          return new Response(null, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
              "Access-Control-Max-Age": "86400"
            }
          });
        }
        
        // 显示管理页面
        return new Response(adminPage(), {
          headers: {
            "Content-Type": "text/html",
            "Cache-Control": "no-cache"
          }
        });
      }
      
      // 如果沒有指定文件，預設讀取 index.html
      if (!filePath) {
        filePath = "index.html";
      }

      const GITHUB_REPO = `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`;
      const BRANCH = env.GITHUB_BRANCH;
      const GITHUB_API_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${filePath}`;
      console.log(GITHUB_API_URL);
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
  