var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-DOIEyJ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// updateGithubFile.js
async function updateGithubFile(editorPath, content, env) {
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const REPO_OWNER = env.GITHUB_REPO_OWNER;
  const REPO_NAME = env.GITHUB_REPO_NAME;
  const FILE_PATH = editorPath || "test-editor.txt";
  const BRANCH = "main";
  const COMMIT_MESSAGE = "Updated via Cloudflare Workers";
  const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  function encodeBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  __name(encodeBase64, "encodeBase64");
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Cloudflare-Worker-GitHub-API"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`\u83B7\u53D6\u6587\u4EF6\u5931\u8D25: ${response.status} ${response.statusText}
\u9519\u8BEF\u8BE6\u60C5: ${errorText}`);
    }
    const data = await response.json();
    const sha = data.sha;
    const newContent = encodeBase64(content || "\u8FD9\u662F\u65B0\u7684\u5185\u5BB9\uFF0C\u6765\u81EA Cloudflare Workers\uFF01");
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
        sha
      })
    });
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`\u66F4\u65B0\u6587\u4EF6\u5931\u8D25: ${updateResponse.status} ${updateResponse.statusText}
\u9519\u8BEF\u8BE6\u60C5: ${errorText}`);
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
__name(updateGithubFile, "updateGithubFile");

// admin-page.js
function adminPage() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u7BA1\u7406\u754C\u9762</title>
  <!-- \u5F15\u5165 Bootstrap \u548C jQuery -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>
  
  <!-- \u5F15\u5165 Summernote -->
  <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-bs4.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-bs4.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/lang/summernote-zh-CN.min.js"><\/script>
  
  <style>
    .container { max-width: 1200px; margin-top: 30px; }
    .note-editor { margin-top: 20px; }
    .btn-save { margin-top: 20px; }
    .file-selector { margin-bottom: 20px; }
    .section-editor { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; }
    .section-title { 
      margin: 0;
      padding: 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #ddd;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 5px 5px 0 0;
    }
    .section-title:hover {
      background: #e9ecef;
    }
    .section-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: bold;
    }
    .section-content { padding: 15px; }
    .editor-container { margin-top: 20px; }
    .section-list { max-height: 600px; overflow-y: auto; }
    .section-preview { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    .collapse-icon {
      transition: transform 0.2s;
    }
    .collapsed .collapse-icon {
      transform: rotate(-90deg);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="mb-4">\u7F51\u7AD9\u5185\u5BB9\u7BA1\u7406</h1>
    
    <div class="file-selector">
      <label for="fileSelect" class="form-label">\u9009\u62E9\u8981\u7F16\u8F91\u7684\u6587\u4EF6\uFF1A</label>
      <select id="fileSelect" class="form-select">
        <option value="index.html">\u9996\u9875 (\u4E2D\u6587\u7248)</option>
        <option value="index-en.html">\u9996\u9875 (\u82F1\u6587\u7248)</option>
      </select>
      <button id="loadBtn" class="btn btn-primary mt-2">\u52A0\u8F7D\u6587\u4EF6</button>
    </div>
    
    <div id="sectionsContainer" class="section-list mt-4"></div>
    
    <button id="saveAllBtn" class="btn btn-success btn-save" style="display:none;">\u4FDD\u5B58\u6240\u6709\u66F4\u6539</button>
    <div id="statusMsg" class="alert mt-3" style="display: none;"></div>
  </div>

  <script>
    $(document).ready(function() {
      let originalHtml = ''; // \u5B58\u50A8\u539F\u59CBHTML
      let sections = []; // \u5B58\u50A8\u6240\u6709section
      
      // \u521D\u59CB\u5316\u7F16\u8F91\u5668
      function initSectionEditor(element) {
        $(element).summernote({
          height: 300,
          lang: 'zh-CN',
          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']],
            ['view', ['fullscreen', 'codeview', 'help']]
          ],
          callbacks: {
            onChange: function(contents) {
              // \u5B9E\u65F6\u9884\u89C8
              const previewEl = $(element).closest('.section-content').find('.section-preview');
              previewEl.html(contents);
            }
          }
        });
      }
      
      // \u52A0\u8F7D\u6587\u4EF6\u5185\u5BB9
      $('#loadBtn').click(function() {
        const fileName = $('#fileSelect').val();
        
        $('#statusMsg').removeClass('alert-success alert-danger')
          .addClass('alert-info')
          .text('\u6B63\u5728\u52A0\u8F7D\u6587\u4EF6...')
          .show();
          
        // \u4ECE GitHub \u83B7\u53D6\u6587\u4EF6\u5185\u5BB9
        fetch(fileName)
          .then(response => {
            if (!response.ok) {
              throw new Error('\u65E0\u6CD5\u52A0\u8F7D\u6587\u4EF6');
            }
            return response.text();
          })
          .then(content => {
            originalHtml = content;
            parseHtmlSections(content);
            $('#saveAllBtn').show();
            $('#statusMsg').removeClass('alert-info')
              .addClass('alert-success')
              .text('\u6587\u4EF6\u52A0\u8F7D\u6210\u529F\uFF01')
              .fadeOut(3000);
          })
          .catch(error => {
            console.error('Error:', error);
            $('#statusMsg').removeClass('alert-info')
              .addClass('alert-danger')
              .text('\u52A0\u8F7D\u6587\u4EF6\u5931\u8D25: ' + error.message)
              .show();
          });
      });
      
      // \u89E3\u6790HTML\uFF0C\u63D0\u53D6\u6240\u6709class="section"\u7684\u5143\u7D20
      function parseHtmlSections(html) {
        // \u521B\u5EFA\u4E34\u65F6DOM\u89E3\u6790HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // \u627E\u5230\u6240\u6709class\u4E3Asection\u7684\u5143\u7D20
        const sectionElements = doc.querySelectorAll('.section');
        
        if (sectionElements.length === 0) {
          $('#sectionsContainer').html('<div class="alert alert-warning">\u672A\u627E\u5230class="section"\u7684\u5143\u7D20</div>');
          return;
        }
        
        sections = [];
        let sectionHtml = '';
        
        // \u904D\u5386\u6240\u6709section\u5143\u7D20
        sectionElements.forEach((sectionEl, index) => {
          const sectionId = \`section-\${index}\`;
          const sectionHtmlContent = sectionEl.innerHTML;
          
          // \u83B7\u53D6section\u6807\u9898\uFF08\u5982\u679C\u6709h2\u6807\u7B7E\uFF09
          const titleEl = sectionEl.querySelector('h2');
          const sectionTitle = titleEl ? titleEl.textContent : \`\u533A\u5757 \${index + 1}\`;
          
          sections.push({
            id: sectionId,
            element: sectionEl,
            html: sectionHtmlContent,
            index: index
          });
          
          sectionHtml += \`
            <div class="section-editor">
              <div class="section-title collapsed" data-bs-toggle="collapse" data-bs-target="#collapse-\${sectionId}" aria-expanded="true">
                <h3>\${sectionTitle}</h3>
                <span class="collapse-icon">\u25BC</span>
              </div>
              <div id="collapse-\${sectionId}" class="collapse">
                <div class="section-content">
                  <div class="editor-container" id="editor-\${sectionId}"></div>
                  <div class="section-preview"></div>
                </div>
              </div>
            </div>
          \`;
        });
        
        // \u6DFB\u52A0\u7F16\u8F91\u5668\u5230\u9875\u9762
        $('#sectionsContainer').html(sectionHtml);
        
        // \u521D\u59CB\u5316\u6240\u6709\u7F16\u8F91\u5668
        sections.forEach(section => {
          const editorEl = $(\`#editor-\${section.id}\`);
          initSectionEditor(editorEl);
          editorEl.summernote('code', section.html);
        });

        // \u521D\u59CB\u5316\u6298\u53E0\u529F\u80FD
        const collapseElements = document.querySelectorAll('.collapse');
        collapseElements.forEach(collapseEl => {
          new bootstrap.Collapse(collapseEl, {
            toggle: false
          });
        });

        // \u6DFB\u52A0\u6298\u53E0\u56FE\u6807\u52A8\u753B
        document.querySelectorAll('.section-title').forEach(titleEl => {
          titleEl.addEventListener('click', function() {
            const icon = this.querySelector('.collapse-icon');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            icon.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
            this.setAttribute('aria-expanded', !isExpanded);
          });
        });
      }
      
      // \u4FDD\u5B58\u6240\u6709\u66F4\u6539
      $('#saveAllBtn').click(function() {
        // \u66F4\u65B0\u539F\u59CBHTML\u4E2D\u7684\u5185\u5BB9
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');
        
        sections.forEach(section => {
          const editorContent = $(\`#editor-\${section.id}\`).summernote('code');
          const sectionEl = doc.querySelectorAll('.section')[section.index];
          sectionEl.innerHTML = editorContent;
        });
        
        // \u83B7\u53D6\u66F4\u65B0\u540E\u7684HTML
        const updatedHtml = doc.documentElement.outerHTML;
        
        const fileName = $('#fileSelect').val();
        
        $('#statusMsg').removeClass('alert-success alert-danger')
          .addClass('alert-info')
          .text('\u6B63\u5728\u4FDD\u5B58...')
          .show();
          
        // \u53D1\u9001\u5230\u670D\u52A1\u5668\u4FDD\u5B58
        fetch('admin-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filePath: fileName,
            content: updatedHtml
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          $('#statusMsg').removeClass('alert-info')
            .addClass('alert-success')
            .text('\u4FDD\u5B58\u6210\u529F\uFF01')
            .show();
        })
        .catch(error => {
          console.error('Error:', error);
          $('#statusMsg').removeClass('alert-info')
            .addClass('alert-danger')
            .text('\u4FDD\u5B58\u5931\u8D25: ' + error.message)
            .show();
        });
      });
    });
  <\/script>
</body>
</html>
  `;
}
__name(adminPage, "adminPage");

// index.js
function checkBasicAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return false;
  }
  const [type, credentials] = authHeader.split(" ");
  if (type !== "Basic") {
    return false;
  }
  const [username, password] = atob(credentials).split(":");
  return username === env.ADMIN_USERNAME && password === env.ADMIN_PASSWORD;
}
__name(checkBasicAuth, "checkBasicAuth");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    let filePath = url.pathname.substring(1);
    if (filePath === "admin-page") {
      if (!checkBasicAuth(request, env)) {
        return new Response("Unauthorized", {
          status: 401,
          headers: {
            "WWW-Authenticate": 'Basic realm="Admin Area"'
          }
        });
      }
      if (request.method === "POST") {
        try {
          const { filePath: filePath2, content } = await request.json();
          if (!filePath2 || !content) {
            return new Response(
              JSON.stringify({ error: "\u6587\u4EF6\u8DEF\u5F84\u548C\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A" }),
              {
                status: 400,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*"
                }
              }
            );
          }
          return await updateGithubFile(filePath2, content, env);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: `\u89E3\u6790\u8BF7\u6C42\u5931\u8D25: ${error.message}` }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }
      }
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
      return new Response(adminPage(), {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache"
        }
      });
    }
    if (!filePath) {
      filePath = "index.html";
    }
    const GITHUB_REPO = `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}`;
    const BRANCH = env.GITHUB_BRANCH;
    const GITHUB_API_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${filePath}`;
    console.log(GITHUB_API_URL);
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      return new Response("File not found", { status: 404 });
    }
    const contentType = getContentType(filePath);
    if (contentType.startsWith("image/")) {
      const imageBuffer = await response.arrayBuffer();
      return new Response(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          // 讓瀏覽器快取圖片
          "Access-Control-Allow-Origin": "*"
          // 允許 CORS
        }
      });
    }
    return new Response(await response.text(), {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        // 允許 CORS
        "Cache-Control": contentType === "text/html" ? "no-cache, no-store, must-revalidate" : "public, max-age=86400",
        // HTML 文件不缓存
        "Pragma": contentType === "text/html" ? "no-cache" : "",
        // 兼容 HTTP/1.0
        "Expires": contentType === "text/html" ? "0" : ""
      }
    });
  }
};
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
  return "text/plain";
}
__name(getContentType, "getContentType");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-DOIEyJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = index_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-DOIEyJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
