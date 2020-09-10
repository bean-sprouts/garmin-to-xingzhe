//从122交管平台录入合同
function httpSend122(params) {
  const q = new URLSearchParams()
  for (let key in params) {
    q.append(key, params[key])
  }
  return fetch(`https://${currentCity}.122.gov.cn/vio/rent/contract/save?${q.toString()}`).then(res => {
    if (res.status === 200) {
      return res.json()
    } else {
      throw Error()
    }
  }).catch(err => { console.log(err) })
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}

function init() {
  console.log('garmin_init')
}

init();





