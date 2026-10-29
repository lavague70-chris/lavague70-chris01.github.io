const app = document.getElementById('app');
let data = { categories: [], items: [] };

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function youtubeThumb(link) {
  const m = String(link).match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

function renderHome() {
  document.title = "Chris's Pick";
  app.innerHTML = `<div class="cats">${data.categories.map(cat => {
    const count = data.items.filter(i => i.category === cat.id).length;
    return `
      <a class="cat" data-id="${esc(cat.id)}" href="#${esc(cat.id)}">
        <div class="cat-emoji">${esc(cat.emoji)}</div>
        <div class="cat-text">
          <div class="cat-name">${esc(cat.name)}</div>
          <div class="cat-desc">${esc(cat.desc)}</div>
        </div>
        <div class="cat-count">${count}개</div>
      </a>`;
  }).join('')}</div>`;
}

function renderCategory(cat) {
  document.title = `${cat.name} · Chris's Pick`;
  const items = data.items
    .filter(i => i.category === cat.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const list = items.length ? items.map(item => {
    const img = item.image || youtubeThumb(item.link);
    const tag = item.link && !item.video ? 'a' : 'div';
    const href = tag === 'a' ? ` href="${esc(item.link)}" target="_blank" rel="noopener"` : '';
    const media = item.video
      ? `<video src="${esc(item.video)}#t=0.1" controls playsinline preload="metadata"></video>`
      : img ? `<img src="${esc(img)}" alt="" loading="lazy">` : '';
    return `
      <${tag} class="item"${href}>
        ${media}
        <div class="item-body">
          <h3 class="item-title">${esc(item.title)}</h3>
          ${item.memo ? `<p class="item-memo">${esc(item.memo)}</p>` : ''}
          <div class="item-meta">
            <span>${esc(item.date)}</span>
            ${item.link ? '<span class="item-link">보러 가기 →</span>' : ''}
          </div>
        </div>
      </${tag}>`;
  }).join('') : '<p class="empty">아직 올린 자료가 없어요</p>';

  const tabs = data.categories.map(c => `
    <a class="tab${c.id === cat.id ? ' on' : ''}" data-id="${esc(c.id)}" href="#${esc(c.id)}">${esc(c.emoji)} ${esc(c.name)}</a>`
  ).join('');

  app.innerHTML = `
    <a class="back" href="#">← 처음으로</a>
    <nav class="tabs">${tabs}</nav>
    <section class="section" data-id="${esc(cat.id)}">
      <div class="section-head">
        <h2>${esc(cat.emoji)} ${esc(cat.name)}</h2>
        <p>${esc(cat.desc)}</p>
      </div>
      <div class="items">${list}</div>
    </section>`;
}

function route() {
  const id = location.hash.slice(1);
  const cat = data.categories.find(c => c.id === id);
  cat ? renderCategory(cat) : renderHome();
  window.scrollTo(0, 0);
}

// 상위 폴더의 data.json을 읽습니다
fetch('../data.json', { cache: 'no-cache' })
  .then(res => res.json())
  .then(json => { data = json; route(); })
  .catch(() => { app.innerHTML = '<p class="empty">자료를 불러오지 못했어요</p>'; });

window.addEventListener('hashchange', route);

// ---- 홈화면 설치 (PWA) ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js');
}

const installBtn = document.getElementById('installBtn');
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvent = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.hidden = true;
});

const ua = navigator.userAgent;
const howto = document.getElementById('howtoBody');
if (/KAKAOTALK/i.test(ua)) {
  const url = encodeURIComponent(location.href);
  howto.innerHTML = `
    <p>카톡 안에서는 설치가 안 돼요. 먼저 다른 브라우저로 열어주세요.</p>
    <a class="kakao-btn" href="kakaotalk://web/openExternal?url=${url}">브라우저로 열기</a>
    <p>열린 화면에서 아래 '홈화면에 추가'를 따라 하시면 됩니다.</p>`;
} else if (/iPhone|iPad|iPod/i.test(ua)) {
  howto.innerHTML = `
    <ol>
      <li>사파리 아래쪽 <b>공유 버튼(□↑)</b>을 누르세요</li>
      <li><b>홈 화면에 추가</b>를 누르세요</li>
      <li>오른쪽 위 <b>추가</b>를 누르면 끝!</li>
    </ol>`;
} else {
  howto.innerHTML = `
    <ol>
      <li>크롬 오른쪽 위 <b>⋮ 메뉴</b>를 누르세요</li>
      <li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 누르세요</li>
      <li><b>설치</b>를 누르면 홈화면에 아이콘이 생겨요</li>
    </ol>`;
}
