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
  if (!WEBHOOK_REGEX.test(input.value) || webhooks.some(x => x[0] == input.value)) {
    input.classList.add('err');
  } else {
    webhooks.push([input.value, true]);
    saveWebhooks();
    appendWebhook([input.value, true]);
    input.value = '';
    input.classList.remove('err');
  }
};

webhookInput.onkeydown = (e) => {
  if (e.key != 'Enter') return;
  try {
    let input = e.target.value;
    let parsed = input.split('!')
      .map(x => atob(x))
      .map(x => x.split('!').map(x => atob(x)).join('/'))
      .map(x => `https://discord.com/api/webhooks/${x}`);
    parsed.forEach(x => {
      if (webhooks.some(v => v[0] == x)) return;
      webhooks.push([x, true]);
      saveWebhooks();
      appendWebhook([x, true]);
    });
    e.target.value = '';
    e.target.classList.remove('err');
  } catch {

  }
};

function appendWebhook(webhook, delay) {
  let div = document.createElement('div');
  div.classList.toggle('off', !webhook[1]);

  let info = document.createElement('div');
  let name = document.createElement('span');
  name.textContent = '???';
  let desc = document.createElement('span');
  desc.textContent = 'Loading...';
  info.append(name, desc);

  let btn = document.createElement('button');
  btn.onclick = () => {
    let idx = webhooks.findIndex(x => x[0] == webhook[0]);
    if (idx != -1) webhooks.splice(idx, 1);
    div.remove();
    saveWebhooks();
  };
  btn.className = 'material-symbols-outlined';
  btn.innerHTML = '&#xe15b;';
  div.append(info, btn);

  div.onclick = () => {
    if (locked) return;
    let w = webhooks.filter(x => x[0] == webhook[0])?.[0];
    if (!w) return;
    w[1] = !w[1];
    div.classList.toggle('off', !w[1]);
    saveWebhooks();
  };

  $('webhook-list').append(div);

  setTimeout(() => {
    fetch(webhook[0]).then(x => {
      if (x.status == 401 || x.status == 404) {
        div.remove();
        webhooks = webhooks.filter(w => w[0] != webhook[0]);
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