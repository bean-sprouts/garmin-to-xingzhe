let periodInMinutes;
let updateNumber;
let bgPage; // 事件页面
chrome.runtime.getBackgroundPage(res => {
  bgPage = res
});

async function checkStatus() {
  const xingZheRes = await fetch(`https://www.imxingzhe.com/api/v4/account/get_user_info/`).then(res => res);
  const garminRes = await fetch(`https://connect.garmin.cn/modern/proxy/userprofile-service/userprofile/user-settings/?_=${new Date().getTime()}`).then(res => res);
  const isXingZheLogin = xingZheRes.ok;
  const isGarminLogin = garminRes.ok;
  chrome.storage.sync.set({ isXingZheLogin, isGarminLogin }, () => {
    chrome.storage.sync.get(['periodInMinutes', 'updateNumber'], function (res) {
      // console.log('res', res);
      // 获取保存的间隔检查时间
      if (typeof res.periodInMinutes !== 'undefined') {
        periodInMinutesInput.value = res.periodInMinutes;
        periodInMinutes = res.periodInMinutes;
      } else {
        periodInMinutesInput.value = 60;
        periodInMinutes = 60;
        chrome.storage.sync.set({ periodInMinutes: 60 });
      }
      if (typeof res.updateNumber !== 'undefined') {
        updateNumberInput.value = res.updateNumber;
        updateNumber = res.updateNumber;
      } else {
        updateNumberInput.value = 100;
        updateNumber = 100;
        chrome.storage.sync.set({ updateNumber: 100 });
      }
      if (isGarminLogin) {
        garminStatusContainer.style.color = 'green';
        garminStatusEl.innerHTML = '已登录'
      } else {
        garminStatusContainer.style.color = 'red';
        garminStatusEl.innerHTML = '未登录'
      }
      if (isXingZheLogin) {
        xingzheStatusContainer.style.color = 'green';
        xingzheStatusEl.innerHTML = '已登录'
      } else {
        xingzheStatusContainer.style.color = 'red';
        xingzheStatusEl.innerHTML = '未登录'
      }
    });
  });
}

periodInMinutesInput.onchange = function (e) {
  periodInMinutes = e.target.valueAsNumber;
};

updateNumberInput.onchange = function (e) {
  updateNumber = e.target.valueAsNumber;
};

submit.onclick = function () {
  if (typeof periodInMinutes !== 'number' || periodInMinutes % 1 !== 0 || periodInMinutes < 1) {
    return alert('更新间隔必须输入大于0的整数');
  }
  if (typeof updateNumber !== 'number' || updateNumber % 1 !== 0 || updateNumber < 1) {
    return alert('更新条目数必须输入大于0的整数');
  }
  chrome.storage.sync.set({ periodInMinutes, updateNumber }, () => {
    bgPage.updateAlarms();
    alert('保存成功');
  });
};

sync.onclick = async function () {
  mask.style.visibility = 'visible';
  chrome.storage.sync.set({ updateNumber }, async () => {
    await bgPage.run(true);
    mask.style.visibility = 'hidden';
  });
};

garminStatusContainer.onclick = function () {
  chrome.windows.create({ url: `https://connect.garmin.cn/signin/`, width: 300, height: 800 });
};

xingzheStatusContainer.onclick = function () {
  chrome.windows.create({ url: `https://www.imxingzhe.com/user/login`, width: 300, height: 800 });
};

checkStatus();

// 点击其他窗口或者pupup页面时重新检查登录状态
chrome.windows.onFocusChanged.addListener(checkStatus);
window.addEventListener('focus', checkStatus);
