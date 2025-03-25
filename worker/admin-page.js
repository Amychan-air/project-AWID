function adminPage(url) {
    if (url.pathname === "/admin-page" && url.searchParams.get("pwd") === "123456") {
        return new Response("Admin page", { headers: { "Content-Type": "text/html" } });
    }

    if (url.pathname === "/admin-page/editor" && url.searchParams.get("pwd") === "123456") {
        const editorPath = url.searchParams.get("filePath");
        const content = url.searchParams.get("content");
        return {
            filePath: editorPath,
            content: content
        }
    }
}

export default adminPage;