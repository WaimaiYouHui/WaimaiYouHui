// 全局状态管理
const state = {
  currentNav: 'home',               // 当前导航页面，默认为首页
  activeTab: 'tab1',                // 当前激活的标签页，默认为美团
  isFixed: false,                   // 标签栏是否固定定位
  barTop: 0,                        // 标签栏初始顶部位置
  barHeight: 0,                     // 标签栏高度
  isPopupShow: false,               // 弹窗是否显示
  currentBanner: 0,                 // 当前轮播图索引
  bannerInterval: null,             // 轮播图定时器
  link: "",                         // 当前要复制的链接
  // 新增触摸相关状态
  touchStartX: 0,                   // 触摸开始时的X坐标
  touchStartTime: 0                 // 触摸开始的时间戳
};

// DOM元素缓存 - 存储常用DOM元素，避免重复查询
const elements = {
  buttonBar: document.getElementById('buttonBar'),
  buttonBarPlaceholder: document.getElementById('buttonBarPlaceholder'),
  buttonItems: document.querySelectorAll('.button-item'),
  tabContents: document.querySelectorAll('.tab-content'),
  navItems: document.querySelectorAll('.nav-item'),
  pageContents: document.querySelectorAll('.page-content'),
  popupMask: document.getElementById('popupMask'),
  popup: document.getElementById('popup'),
  linkText: document.getElementById('linkText'),
  toast: document.getElementById('toast'),
  bannerSwiper: document.getElementById('bannerSwiper'),
  bannerSlides: document.querySelectorAll('.banner-slide')
};

// 初始化函数 - 页面加载完成后执行
function init() {
  initButtonBar();       // 初始化标签栏
  initBanner();          // 初始化轮播图
  bindEvents();          // 绑定基础事件
  bindTouchEvents();     // 绑定触摸事件，增强移动端体验
}

// 初始化标签栏 - 设置初始位置和高度
function initButtonBar() {
  const rect = elements.buttonBar.getBoundingClientRect();
  state.barTop = rect.top + window.scrollY;  // 计算标签栏的绝对顶部位置
  state.barHeight = rect.height;             // 获取标签栏高度
  elements.buttonBarPlaceholder.style.height = `${state.barHeight}px`;  // 设置占位元素高度
}

// 初始化轮播图 - 设置自动轮播和触摸滑动
function initBanner() {
  // 设置自动轮播，每3秒切换一次
  state.bannerInterval = setInterval(() => {
    state.currentBanner = (state.currentBanner + 1) % elements.bannerSlides.length;
    updateBanner();
  }, 3000);
  
  // 添加轮播图触摸支持
  let startX, endX;
  // 触摸开始时记录起始X坐标并暂停自动轮播
  elements.bannerSwiper.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    clearInterval(state.bannerInterval);
  });
  
  // 触摸结束时计算滑动距离并处理
  elements.bannerSwiper.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
    // 恢复自动轮播
    state.bannerInterval = setInterval(() => {
      state.currentBanner = (state.currentBanner + 1) % elements.bannerSlides.length;
      updateBanner();
    }, 3000);
  });
  
  // 处理滑动逻辑
  function handleSwipe() {
    // 滑动距离超过50px才切换图片
    if (startX - endX > 50) {
      // 向右滑动，显示下一张
      state.currentBanner = (state.currentBanner + 1) % elements.bannerSlides.length;
    } else if (endX - startX > 50) {
      // 向左滑动，显示上一张
      state.currentBanner = (state.currentBanner - 1 + elements.bannerSlides.length) % elements.bannerSlides.length;
    }
    updateBanner();  // 更新轮播图显示
  }
}

// 更新轮播图显示状态
function updateBanner() {
  elements.bannerSlides.forEach((slide, index) => {
    // 激活当前轮播图，隐藏其他轮播图
    slide.classList.toggle('active', index === state.currentBanner);
    slide.style.display = index === state.currentBanner ? 'block' : 'none';
  });
}

// 绑定基础事件
function bindEvents() {
  // 监听滚动事件，用于标签栏固定定位
  window.addEventListener('scroll', handleScroll);
  // 页面卸载前清除轮播图定时器
  window.addEventListener('beforeunload', () => clearInterval(state.bannerInterval));
}

// 绑定触摸事件 - 增强移动端体验
function bindTouchEvents() {
  // 为所有按钮添加触摸反馈
  document.querySelectorAll('.btn-touch').forEach(el => {
    // 触摸开始时记录位置和时间，并改变透明度
    el.addEventListener('touchstart', (e) => {
      e.stopPropagation();  // 阻止事件冒泡到卡片
      state.touchStartX = e.touches[0].clientX;
      state.touchStartTime = Date.now();
      el.style.opacity = '0.7';  // 触摸时的视觉反馈
    });
    
    // 触摸结束时恢复样式，并判断是否为有效点击
    el.addEventListener('touchend', (e) => {
      e.stopPropagation();  // 阻止事件冒泡到卡片
      el.style.opacity = '1';  // 恢复透明度
      
      // 获取触摸结束时的位置和时间
      const touchEndX = e.changedTouches[0].clientX;
      const touchTime = Date.now() - state.touchStartTime;
      const touchDistance = Math.abs(touchEndX - state.touchStartX);
      
      // 如果滑动距离小且时间短，视为有效点击
      if (touchDistance < 10 && touchTime < 300) {
        // 触发元素的click事件
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        el.dispatchEvent(clickEvent);
      }
    });
  });

  // 为卡片添加触摸事件，但不应用按钮的样式变化
  document.querySelectorAll('.card.touch-active').forEach(card => {
    card.addEventListener('touchstart', (e) => {
      // 只有当触摸目标不是按钮时才应用卡片的反馈
      if (!e.target.closest('.btn-touch')) {
        card.style.opacity = '0.95';  // 触摸时的视觉反馈
      }
    });
    
    card.addEventListener('touchend', (e) => {
      // 只有当触摸目标不是按钮时才恢复卡片样式
      if (!e.target.closest('.btn-touch')) {
        card.style.opacity = '1';  // 恢复透明度
      }
    });
  });
}

// 处理滚动事件 - 控制标签栏是否固定
function handleScroll() {
  const scrollTop = window.scrollY;
  // 当滚动到标签栏位置附近时，将标签栏固定
  if (scrollTop >= state.barTop - 10 && !state.isFixed) {
    elements.buttonBar.classList.add('fixed');
    state.isFixed = true;
  } else if (scrollTop < state.barTop - 10 && state.isFixed) {
    // 当滚动回标签栏原位置时，取消固定
    elements.buttonBar.classList.remove('fixed');
    state.isFixed = false;
  }
}

// 切换标签页
function switchTab(tabId) {
  state.activeTab = tabId;
  // 更新标签按钮状态
  elements.buttonItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  // 更新标签内容显示
  elements.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
}

// 切换导航页面（首页/教程）
function switchNav(navId) {
  state.currentNav = navId;
  // 更新导航按钮状态
  elements.navItems.forEach(item => {
    item.classList.toggle('active', item.textContent.trim() === (navId === 'home' ? '首页' : '教程'));
  });
  // 更新页面内容显示
  elements.pageContents.forEach(page => {
    page.classList.toggle('active', page.id === `${navId}-page`);
  });
  // 显示提示信息
  showToast(`已切换到${navId === 'home' ? '首页' : '教程'}页面`);
}

// 显示弹窗
function showPopup(link, event) {
  if (event) event.stopPropagation();  // 阻止事件冒泡
  state.link = link;                   // 保存要显示的链接
  elements.linkText.textContent = link; // 设置链接文本
  elements.popupMask.style.display = 'flex';  // 显示弹窗遮罩
  state.isPopupShow = true;            // 更新弹窗状态
}

// 带链接显示弹窗的快捷方法
function showPopupWithLink(link, event) {
  showPopup(link, event);
}

// 隐藏弹窗
function hidePopup() {
  elements.popupMask.style.display = 'none';  // 隐藏弹窗遮罩
  state.isPopupShow = false;                 // 更新弹窗状态
}

// 复制链接 - 增强移动端兼容性
function copyLink(event) {
  if (event) event.preventDefault();  // 阻止右键菜单默认行为
  
  // 移动端兼容性处理：检查浏览器是否支持Clipboard API
  if (!navigator.clipboard) {
    // 降级处理：创建textarea元素并选中内容
    const textarea = document.createElement('textarea');
    textarea.value = state.link;
    textarea.style.position = 'fixed';  // 固定定位，避免影响页面布局
    textarea.style.left = '-9999px';    // 移出可视区域
    document.body.appendChild(textarea);
    textarea.select();  // 选中内容
    
    try {
      // 执行复制命令
      const successful = document.execCommand('copy');
      if (successful) {
        showToast('复制成功');
        hidePopup();
      } else {
        throw new Error('复制失败');
      }
    } catch (err) {
      showToast('请手动复制链接');
    } finally {
      document.body.removeChild(textarea);  // 清理临时元素
    }
    return;
  }
  
  // 现代浏览器处理：使用Clipboard API
  navigator.clipboard.writeText(state.link).then(() => {
    showToast('复制成功');
    hidePopup();
  }).catch(() => {
    showToast('复制失败，请手动复制');
  });
}

// 复制隐藏内容 - 优化移动端兼容性
function copyHiddenContent(event, content, toastMsg) {
  if (event) event.stopPropagation();  // 阻止事件冒泡
  
  // 创建临时textarea元素
  const textarea = document.createElement('textarea');
  textarea.value = content;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  
  try {
    textarea.select();  // 选中内容
    textarea.setSelectionRange(0, content.length);  // 确保全选
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    
    if (successful) {
      showToast(toastMsg || '领取成功');  // 显示提示信息
    } else {
      throw new Error('复制失败');
    }
  } catch (err) {
    // 复制失败时提示手动复制
    showToast('点歪啦！: ' + content.substring(0, 10) + '...');
    textarea.focus();
    textarea.select();  // 选中内容，方便用户手动复制
  } finally {
    document.body.removeChild(textarea);  // 清理临时元素
  }
}

// 显示提示框
function showToast(message) {
  const toast = elements.toast;
  clearTimeout(toast.timer);  // 清除之前的定时器
  toast.textContent = message;  // 设置提示文本
  toast.classList.add('show');  // 显示提示框
  // 2秒后隐藏提示框
  toast.timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// 处理按钮点击 - 阻止事件冒泡
function handleButtonClick(event) {
  event.stopPropagation();
}

// 跳转到小程序
function goToMiniProgram(appid, path) {
  showToast(`正在跳转到小程序: ${appid}`);
}

// 导航到小程序
function navigateToMiniProgram(appid, path) {
  showToast(`正在跳转到小程序: ${appid}`);
}

// 返回上一页
function goBack() {
  showToast('返回上一页');
  // 如果有历史记录，则返回上一页
  if (window.history.length > 1) window.history.back();
}

// 优化：只在非生产环境禁用开发者工具（避免影响调试）
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  document.addEventListener('keydown', e => {
    // 阻止F12键打开开发者工具
    if (e.key === 'F12') {
      e.preventDefault();
      showToast('开发者工具已禁用');
    }
    // 阻止Ctrl+Shift+I打开开发者工具
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      showToast('开发者工具已禁用');
    }
  });
}

// 直接给快捷按钮添加独立的触摸缩放效果
window.addEventListener('DOMContentLoaded', () => {
  // 选择所有快捷按钮
  const quickButtons = document.querySelectorAll('.btn');
  
  // 为每个按钮绑定独立的触摸事件
  quickButtons.forEach(btn => {
    // 触摸开始：缩小90%
    btn.addEventListener('touchstart', (e) => {
      // 强制设置样式，不被全局事件影响
      btn.style.transform = 'scale(0.9)';
      btn.style.transition = 'transform 0.15s ease';
      btn.style.opacity = '0.7';
      // 阻止事件冒泡到全局触摸事件
      e.stopPropagation();
    }, { passive: true }); // passive模式提升性能，避免警告
    
    // 触摸结束：回弹
    btn.addEventListener('touchend', (e) => {
      btn.style.transform = 'scale(1)';
      btn.style.opacity = '1';
      e.stopPropagation();
    });
    
    // 触摸取消（如滑动离开按钮）：同样回弹
    btn.addEventListener('touchcancel', () => {
      btn.style.transform = 'scale(1)';
      btn.style.opacity = '1';
    });
  });
});

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);