let periodInMinutes;
const bgPage = chrome.extension.getBackgroundPage();  // 事件页面

// 每次打开检查登录状态
fetch(`https://www.imxingzhe.com/api/v4/account/get_user_info/`).then(res => {
    chrome.storage.sync.set({ isXingZheLogin: res.ok }, checkStatus);
});

fetch(`https://connect.garmin.cn/modern/proxy/userprofile-service/userprofile/user-settings/?_=${new Date().getTime()}`).then(res => {
    chrome.storage.sync.set({ isGarminLogin: res.ok }, checkStatus);
});

function checkStatus() {
  chrome.storage.sync.get(['periodInMinutes', 'isGarminLogin', 'isXingZheLogin'], function (res) {
    // console.log('res', res);
    // 获取保存的间隔检查时间
    if(typeof res.periodInMinutes !== 'undefined') {
      periodInMinutesInput.value = res.periodInMinutes;
    }
    if(res.isGarminLogin) {
      garminStatusContainer.style.color = 'green';
      garminStatusEl.innerHTML = '已登录'
    } else {
      garminStatusContainer.style.color = 'red';
      garminStatusEl.innerHTML = '未登录'
    }
    if(res.isXingZheLogin) {
      xingzheStatusContainer.style.color = 'green';
      xingzheStatusEl.innerHTML = '已登录'
    } else {
      xingzheStatusContainer.style.color = 'red';
      xingzheStatusEl.innerHTML = '未登录'
    }
  });
}

periodInMinutesInput.onchange = function (e) {
  periodInMinutes = e.target.valueAsNumber;
};

submit.onclick = function () {
  console.log('periodInMinutes,typeof periodInMinutes, periodInMinutes % 1 ', periodInMinutes,typeof periodInMinutes, periodInMinutes % 1 );
  if (typeof periodInMinutes !== 'number' || periodInMinutes % 1 !==0 || periodInMinutes < 1) {
    return alert('必须输入大于0的整数');
  }
  chrome.storage.sync.set({ periodInMinutes }, () => {
    bgPage.updateAlarms();
    alert('保存成功');
  });
};

sync.onclick = async function () {
  mask.style.visibility = 'visible';
  await bgPage.run(true);
  mask.style.visibility = 'hidden';
};

garminStatusContainer.onclick = function () {
  chrome.windows.create({ url: `https://connect.garmin.cn/signin/`, width: 300, height: 800 }, (window) => {
    console.log('window', window);
  });
};

xingzheStatusContainer.onclick = function () {
  chrome.windows.create({ url: `https://www.imxingzhe.com/user/login`, width: 300, height: 800 }, (window) => {
    console.log('window', window);
  });
};
