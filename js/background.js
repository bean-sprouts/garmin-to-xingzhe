function request(url, config = {}) {
  return fetch(url, config).then(res => {
    if(res.ok) {
      return res.json();
    } else {
      throw Error(res.status);
    }
  })
}

// 获取行者骑行记录列表
async function getXingZheRecordList(userId) {
  const year = new Date().getFullYear();
  let promises = [];
  for (let i = 0; i < 1; i++) {
    promises.push(request(`https://www.imxingzhe.com/api/v4/new_workout_list?user_id=${userId}&year=${year - i}&xingzhe_timestamp=${new Date().getTime() / 1000}000`));
    await sleep(3000);
  }
  return Promise.all(promises).then(resArr => {
    console.log('resArr', resArr);
    return resArr.reduce((pre, curr) => pre.concat(curr.data), []);
  });
}

function getUserInfo() {
  return request(`https://www.imxingzhe.com/api/v4/account/get_user_info/`);
}

function getFirstRecord() {
  return getUserInfo().then(res => {
    return getXingZheRecordList(res.userid).then(res => {
      // 得到最新一条骑行记录，如果为undefined表示10年内没有骑行记录
      return res[0];
    })
  })
}

function getGarminRecord() {
  return request(`https://connect.garmin.cn/modern/proxy/activitylist-service/activities/search/activities?activityType=cycling&start=0&limit=100`);
}

function downloadFile(item) {
  // window.open(`https://connect.garmin.cn/modern/proxy/download-service/files/activity/${activityId}`);
  return fetch(`https://connect.garmin.cn/modern/proxy/download-service/files/activity/${item.activityId}`)
    .then(res => {
      if (res.status === 200) {
        return res.blob();
      } else {
        throw Error();
      }
    })
    .then(blob => {
      // 读取zip压缩文件里面的文件内容
      return JSZip.loadAsync(blob).then(zip => {
        const promises = [];
        for (let key in zip.files) {
          // 用blob的格式读取，方便后面下载到本地
          if (zip.files.hasOwnProperty(key)) {
            promises.push(zip.file(zip.files[key].name).async('blob').then(res => {
              const file = new File([res], zip.files[key].name);
              return uploadFile(file, item);
            }));
          }
        }
        return Promise.all(promises);
      })
    })
}

function uploadFile(file, item) {
  function formatNumber(n) {
    const str = n.toString();
    return str[1] ? str : `0${str}`;
  }

  const date = new Date(item.beginTimestamp);
  const year = date.getFullYear();
  const month = formatNumber(date.getMonth() + 1);
  const dateStr = formatNumber(date.getDate());
  const hour = date.getHours();
  let titleStr;
  if (hour >= 0 && hour < 12) {
    titleStr = '上午';
  } else if (hour < 18) {
    titleStr = '下午';
  } else {
    titleStr = '晚上';
  }

  const formData = new FormData();
  formData.append('title', `${year}-${month}-${dateStr} ${titleStr} 骑行`);
  formData.append('device', 6);
  formData.append('sport', 3);
  formData.append('upload_file_name', file);
  return request(`https://www.imxingzhe.com/api/v4/upload_fits`, {
    method: 'post',
    body: formData
  }).then(res => {
      console.log('res', res);
    })
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  })
}

// 通过行者的start_time、distance、duration三个值和garmin的beginTimestamp、Math.floor(distance)、Math.floor(duration)进行比较匹配骑行记录
function run(manual = false) {
  console.log('run');
  return getGarminRecord().then(garminRes => {
    console.log('garminRes', garminRes);
    chrome.storage.sync.set({ isGarminLogin: true });
    if (garminRes.length > 0) {
      return getFirstRecord().then(res => {
        chrome.storage.sync.set({ isXingZheLogin: true });
        if (typeof res === 'undefined') {
          // 行者没有骑行记录，导入所有佳明骑行记录
          garminRes.forEach(async item => {
            await downloadFile(item);
            await sleep(3000);
          });
        } else {
          const index = garminRes.findIndex(item => item.beginTimestamp === res.start_time && Math.floor(item.distance) === res.distance && Math.floor(item.duration) === res.duration);
          console.log('index', index);
          if (index > 0) {
            garminRes.slice(0, index).forEach(async item => {
              await downloadFile(item);
              await sleep(3000);
            });
            message(`骑行记录同步完成，同步了${index}条数据`);
          } else {
            manual && message(`骑行记录已是最新，无需同步!`);
          }
        }
      }).catch(error => {
        console.log('error---getFirstRecord', error);
        chrome.storage.sync.set({ isXingZheLogin: false });
      })
    } else {
      manual && message(`无佳明骑行记录!`);
    }
  }).catch(error => {
    console.log('error---getGarminRecord', error);
    message(`同步骑行记录发生错误!`);
    error.message === '403' && chrome.storage.sync.set({ isGarminLogin: false });
  })
}

function updateAlarms() {
  chrome.storage.sync.get('periodInMinutes', function (res) {
    // console.log('res', res);
    // 获取保存的间隔检查时间
    if (typeof res.periodInMinutes === 'undefined') {
      // 默认60分钟检查一次
      chrome.storage.sync.set({ periodInMinutes: 60 });
      chrome.alarms.create('garminToXingZhe', {
        periodInMinutes: 60
      });
    } else {
      chrome.alarms.create('garminToXingZhe', {
        periodInMinutes: res.periodInMinutes
      });
    }
  });
}

function message(msg) {
  chrome.notifications.create('', {
    type: 'basic',
    iconUrl: 'image/icon128.png',
    title: '提示',
    message: msg
  })
}

// 监听到定时事件触发就检查是否有更新
chrome.alarms.onAlarm.addListener(res => {
  if (res.name === 'garminToXingZhe') {
    run();
  }
});
