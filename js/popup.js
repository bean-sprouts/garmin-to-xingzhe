let periodInMinutes;
const bgPage = chrome.extension.getBackgroundPage();  // 事件页面
chrome.storage.sync.get('periodInMinutes', function (res) {
  // console.log('res', res);
  // 获取保存的间隔检查时间
  if(typeof res.periodInMinutes !== 'undefined') {
    periodInMinutesInput.value = res.periodInMinutes;
  }
});


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
