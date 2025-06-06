// 等待頁面加載完成後執行
document.addEventListener('DOMContentLoaded', function() {
    const floatingSignup = document.querySelector('.floating-signup');
    let lastScrollTop = 0;
    let isScrolling = false;
    let scrollTimeout;
    
    // 檢查是否為移動設備
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // 顯示浮動報名框的函數
    function showFloatingSignup() {
        setTimeout(function() {
            floatingSignup.classList.add('show');
        }, 1000); // 1秒延遲後顯示
    }
    
    // 只在移動設備上執行
    if(isMobile()) {
        showFloatingSignup();
    } else {
        // 非移動設備直接顯示
        floatingSignup.classList.add('show');
    }
    
    // 窗口大小變化時重新檢查
    window.addEventListener('resize', function() {
        if(isMobile()) {
            if(!floatingSignup.classList.contains('show')) {
                showFloatingSignup();
            }
        } else {
            floatingSignup.classList.add('show');
        }
    });

    window.addEventListener('scroll', function() {
        if (!isScrolling) {
            isScrolling = true;
            window.requestAnimationFrame(function() {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                
                // 当滚动到底部时隐藏
                if (scrollTop + windowHeight >= documentHeight - 100) {
                    floatingSignup.classList.add('hide');
                } else {
                    floatingSignup.classList.remove('hide');
                }
                
                lastScrollTop = scrollTop;
                isScrolling = false;
            });
        }
    });
}); 

//    SEGEN KOMET 寶力創科 製作
//    https://www.segenkomet.com/