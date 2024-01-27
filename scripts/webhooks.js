const WEBHOOK_REGEX = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
let webhooks = [];
let webhookUsage = [];

(async () => {
  webhooks = JSON.parse(localStorage.getItem('webhooks'));
  if (!webhooks) webhooks = [];
  let i = 0;
  webhooks.forEach(w => appendWebhook(w, i++ * 50));
})();

webhookInput.oninput = () => {
  const input = webhookInput;
  if (!input.value) {
    input.classList.remove('err');
    return;
  }
  if (!WEBHOOK_REGEX.test(input.value) || webhooks.includes(input.value)) {
    input.classList.add('err');
  } else {
    webhooks.push(input.value);
    saveWebhooks();
    appendWebhook(input.value);
    input.value = '';
    input.classList.remove('err');
  }
}

function appendWebhook(webhook, delay) {
  let div = document.createElement('div');
  div.className = 'webhook';

  let info = document.createElement('div');
  let name = document.createElement('span');
  name.textContent = '???';
  let desc = document.createElement('span');
  desc.textContent = 'Loading...';
  info.append(name, desc);

  let btn = document.createElement('button');
  btn.onclick = () => {
    let idx = webhooks.indexOf(webhook);
    if (idx != -1) webhooks.splice(idx, 1);
    div.remove();
    saveWebhooks();
  };
  btn.className = 'material-symbols-outlined';
  btn.innerHTML = '&#xe15b;';
  div.append(info, btn);

  $('webhook-list').append(div);

  setTimeout(() => {
    fetch(webhook).then(x => {
      if (x.status == 401 || x.status == 404) {
        div.remove();
        webhooks = webhooks.filter(w => w != webhook);
        saveWebhooks();
        return;
      }
      if (!x.ok) throw new Error();
      return x.json();
    }).then(res => {
      name.textContent = res.name;
      desc.textContent = res.id;
    }).catch(() => {
      name.classList.add('t-err');
      desc.textContent = 'ERROR';
    });
  }, delay);
}


function saveWebhooks() {
  localStorage.setItem('webhooks', JSON.stringify(webhooks));
}


function getWebhook() {
  let w = webhookUsage.sort((a, b) => a[0] - b[0])[0];
  w[0]++;
  return w[1];
}