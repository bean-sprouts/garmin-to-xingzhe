let startDate = '2020-09-09';
let endDate = '2020-09-09';

startDateInput.onchange = function (e) {
  console.log('e---startDate', e);
  startDate = e.target.value;
};

endDateInput.onchange = function (e) {
  endDate = e.target.value;
}
;
exp.onclick = function () {
  console.log('点击导出按钮', startDate, endDate);
  const params = {
    activityType: 'cycling',
    startDate,
    endDate,
    limit: 100,
    start: 0,
    _: new Date().getTime()
  };
  const q = new URLSearchParams()
  for (let key in params) {
    q.append(key, params[key])
  }
  fetch(`https://connect.garmin.cn/modern/proxy/activitylist-service/activities/search/activities?${q.toString()}`)
    .then(res => res.json())
    .then(res => {
      console.log('res', res);
      resultText.innerHTML = `<span style="color: #359947;">本次导入记录数量： ${ res.length } </span>`
      res.forEach(item => {
        downloadFile(item);
      });

     /* resultText.innerHTML = `<span style="color: #359947;">今日完成任务数量： ${ res.result.length } </span>`

      let html = ``
      res.result.forEach(v => {
        const params = v.paramsTo122 || {}
        if (!v.isBindSuccess) {
          html += `
                    <li style="color: red;">${v.createdAt } : ${ params.hphm }【${ params.htbh }】-失败(${ v.errorMsg })</li>
                `
        } else {
          html += `
                    <li style="color: #359947;">${v.createdAt } : ${ params.hphm }-【${ params.htbh }】-成功</li>
                `
        }
      })
      list.innerHTML = html*/
    })
};

function downloadFile(item) {
  // window.open(`https://connect.garmin.cn/modern/proxy/download-service/files/activity/${activityId}`);
  fetch(`https://connect.garmin.cn/modern/proxy/download-service/files/activity/${item.activityId}`)
    .then(res => res.blob())
    .then(blob => {
      // 读取zip压缩文件里面的文件内容
      JSZip.loadAsync(blob).then(zip => {
        for (let key in zip.files) {
          // 用blob的格式读取，方便后面下载到本地
          zip.file(zip.files[key].name).async('blob').then(res => {
            const file = new File([res], zip.files[key].name);
            uploadFile(file, item);
          })
        }
      })
    })
}

function uploadFile(file, item) {
  function formatNumber(n) {
    const str = n.toString();
    return str[1] ? str : `0${str}`;
  }
  const date = new Date(item.startTimeLocal);
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
  fetch(`https://www.imxingzhe.com/api/v4/upload_fits`, {
    method: 'post',
    body: formData
  }).then(res => res.json())
    .then(res => {
      console.log('res', res);
    })
}
