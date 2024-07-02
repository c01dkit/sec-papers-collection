// 执行高亮操作的函数
function highlightTargetElement() {
    // 获取url中的#xxx部分
    const hash = window.location.hash.slice(1);
  
    // 找到页面内对应id的元素
    let targetElement = document.querySelector(`#${hash} a`);
    if (!targetElement) {
        targetElement = document.getElementById(hash);
    }
    // 如果找到对应的元素,就添加动态高亮效果
    if (targetElement) {
      // 添加高亮效果的CSS类
      targetElement.classList.add('search-highlight');
  
      // 计算元素到页面顶部的距离
      const targetTop = targetElement.offsetTop;
  
      // 计算页面可视区域的高度
      const viewportHeight = window.innerHeight;
  
      // 计算应该滚动到的位置(使元素位于屏幕中央)
      const scrollTo = targetTop - (viewportHeight / 2);
  
      // 平滑滚动到计算出的位置
      window.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }
// 监听URL中#部分的变化,执行高亮操作
window.addEventListener('hashchange', highlightTargetElement);

// 页面加载时也执行一次高亮操作
window.addEventListener('load', highlightTargetElement);