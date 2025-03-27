export function adminPage() {
  // 创建包含 Summernote 编辑器的 HTML 管理页面
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理界面</title>
  <!-- 引入 Bootstrap 和 jQuery -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  
  <!-- 引入 Summernote -->
  <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-bs4.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-bs4.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/lang/summernote-zh-CN.min.js"></script>
  
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
    <h1 class="mb-4">网站内容管理</h1>
    
    <div class="file-selector">
      <label for="fileSelect" class="form-label">选择要编辑的文件：</label>
      <select id="fileSelect" class="form-select">
        <option value="index.html">首页 (中文版)</option>
        <option value="index-en.html">首页 (英文版)</option>
      </select>
      <button id="loadBtn" class="btn btn-primary mt-2">加载文件</button>
    </div>
    
    <div id="sectionsContainer" class="section-list mt-4"></div>
    
    <button id="saveAllBtn" class="btn btn-success btn-save" style="display:none;">保存所有更改</button>
    <div id="statusMsg" class="alert mt-3" style="display: none;"></div>
  </div>

  <script>
    $(document).ready(function() {
      let originalHtml = ''; // 存储原始HTML
      let sections = []; // 存储所有section
      
      // 初始化编辑器
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
              // 实时预览
              const previewEl = $(element).closest('.section-content').find('.section-preview');
              previewEl.html(contents);
            }
          }
        });
      }
      
      // 加载文件内容
      $('#loadBtn').click(function() {
        const fileName = $('#fileSelect').val();
        
        $('#statusMsg').removeClass('alert-success alert-danger')
          .addClass('alert-info')
          .text('正在加载文件...')
          .show();
          
        // 从 GitHub 获取文件内容
        fetch(fileName)
          .then(response => {
            if (!response.ok) {
              throw new Error('无法加载文件');
            }
            return response.text();
          })
          .then(content => {
            originalHtml = content;
            parseHtmlSections(content);
            $('#saveAllBtn').show();
            $('#statusMsg').removeClass('alert-info')
              .addClass('alert-success')
              .text('文件加载成功！')
              .fadeOut(3000);
          })
          .catch(error => {
            console.error('Error:', error);
            $('#statusMsg').removeClass('alert-info')
              .addClass('alert-danger')
              .text('加载文件失败: ' + error.message)
              .show();
          });
      });
      
      // 解析HTML，提取所有class="section"的元素
      function parseHtmlSections(html) {
        // 创建临时DOM解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 找到所有class为section的元素
        const sectionElements = doc.querySelectorAll('.section');
        
        if (sectionElements.length === 0) {
          $('#sectionsContainer').html('<div class="alert alert-warning">未找到class="section"的元素</div>');
          return;
        }
        
        sections = [];
        let sectionHtml = '';
        
        // 遍历所有section元素
        sectionElements.forEach((sectionEl, index) => {
          const sectionId = \`section-\${index}\`;
          const sectionHtmlContent = sectionEl.innerHTML;
          
          // 获取section标题（如果有h2标签）
          const titleEl = sectionEl.querySelector('h2');
          const sectionTitle = titleEl ? titleEl.textContent : \`区块 \${index + 1}\`;
          
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
                <span class="collapse-icon">▼</span>
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
        
        // 添加编辑器到页面
        $('#sectionsContainer').html(sectionHtml);
        
        // 初始化所有编辑器
        sections.forEach(section => {
          const editorEl = $(\`#editor-\${section.id}\`);
          initSectionEditor(editorEl);
          editorEl.summernote('code', section.html);
        });

        // 初始化折叠功能
        const collapseElements = document.querySelectorAll('.collapse');
        collapseElements.forEach(collapseEl => {
          new bootstrap.Collapse(collapseEl, {
            toggle: false
          });
        });

        // 添加折叠图标动画
        document.querySelectorAll('.section-title').forEach(titleEl => {
          titleEl.addEventListener('click', function() {
            const icon = this.querySelector('.collapse-icon');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            icon.style.transform = isExpanded ? 'rotate(-90deg)' : 'rotate(0deg)';
            this.setAttribute('aria-expanded', !isExpanded);
          });
        });
      }
      
      // 保存所有更改
      $('#saveAllBtn').click(function() {
        // 更新原始HTML中的内容
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalHtml, 'text/html');
        
        sections.forEach(section => {
          const editorContent = $(\`#editor-\${section.id}\`).summernote('code');
          const sectionEl = doc.querySelectorAll('.section')[section.index];
          sectionEl.innerHTML = editorContent;
        });
        
        // 获取更新后的HTML
        const updatedHtml = doc.documentElement.outerHTML;
        
        const fileName = $('#fileSelect').val();
        
        $('#statusMsg').removeClass('alert-success alert-danger')
          .addClass('alert-info')
          .text('正在保存...')
          .show();
          
        // 发送到服务器保存
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
            .text('保存成功！')
            .show();
        })
        .catch(error => {
          console.error('Error:', error);
          $('#statusMsg').removeClass('alert-info')
            .addClass('alert-danger')
            .text('保存失败: ' + error.message)
            .show();
        });
      });
    });
  </script>
</body>
</html>
  `;
}