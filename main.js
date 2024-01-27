const $ = id => document.getElementById(id);

const WEBHOOK_REGEX = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
let webhooks = [];

(async () => {
  webhooks = JSON.parse(localStorage.getItem('webhooks'));
  if (!webhooks) webhooks = [];
  let i = 0;
  for (let w of webhooks) {
    setTimeout(() => {
      appendWebhook(w);
      if (i + 1 >= webhooks.length) saveWebhooks();
    }, i / 10 * 1000);
    i++;
  }
})();

$('webhook-input').oninput = (ev) => {
  const input = ev.target;
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

async function appendWebhook(webhook) {
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

  await fetch(webhook).then(x => {
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
}

function lockState(flag) {
  uploadBtn.toggleAttribute('disabled', flag);
  startBtn.toggleAttribute('disabled', flag);
}

function saveWebhooks() {
  localStorage.setItem('webhooks', JSON.stringify(webhooks));
}

function parseSize(bytes) {
  const thresh = 1024;
  if (bytes < thresh) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  const r = 10 ** 2;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(bytes * r) / r >= thresh && u < units.length - 1);
  return `${bytes.toFixed(2)} ${units[u]}`;
}