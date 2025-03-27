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
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-bs4.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/lang/summernote-zh-CN.min.js"></script>
  
  <style>
    .container { max-width: 1200px; margin-top: 30px; }
    .note-editor { margin-top: 20px; }
    .btn-save { margin-top: 20px; }
    .file-selector { margin-bottom: 20px; }
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
    
    <div id="editor"></div>
    <button id="saveBtn" class="btn btn-success btn-save">保存更改</button>
    <div id="statusMsg" class="alert mt-3" style="display: none;"></div>
  </div>

  <script>
    $(document).ready(function() {
      // 初始化编辑器
      function initEditor() {
        $('#editor').summernote({
          height: 500,
          lang: 'zh-CN',
          callbacks: {
            onImageUpload: function(files) {
              // 这里可以添加图片上传功能
              alert('目前不支持直接上传图片，请使用图片URL');
            }
          },
          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']],
            ['view', ['fullscreen', 'codeview', 'help']]
          ]
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
            if (!$('#editor').hasClass('note-editor')) {
              initEditor();
            }
            $('#editor').summernote('code', content);
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
      
      // 保存文件内容
      $('#saveBtn').click(function() {
        const fileName = $('#fileSelect').val();
        const content = $('#editor').summernote('code');
        
        if (!content) {
          $('#statusMsg').removeClass('alert-success alert-info')
            .addClass('alert-danger')
            .text('内容不能为空！')
            .show();
          return;
        }
        
        $('#statusMsg').removeClass('alert-success alert-danger')
          .addClass('alert-info')
          .text('正在保存...')
          .show();
          
        // 发送到服务器保存 - 使用 JSON 请求体
        fetch('admin-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filePath: fileName,
            content: content
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