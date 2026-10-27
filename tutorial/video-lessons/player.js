/* Native dual-format playback; no analytics, uploads or autoplay. */
(() => {
  'use strict';
  if (new URL(location.href).searchParams.get('embedded') === '1') document.body.classList.add('embedded');
  const video = document.getElementById('lesson-video');
  if (!video) return;
  const status = document.getElementById('play-status');
  const format = document.getElementById('format');
  const speed = document.getElementById('speed');
  // A revised video has different chapter times. Keep old resume points intact,
  // but never apply an old timestamp to a different edit. Course checks are separate.
  const key = 'yang-audio-video-v2:' + location.pathname + (video.dataset.revision ? ':' + video.dataset.revision : '');
  let pendingTime = 0;
  try { pendingTime = Number(localStorage.getItem(key)) || 0; } catch (_) {}
  // Metadata may not be ready when a learner seeks or changes format.
  const hasMetadata = () => video.readyState > 0 && Number.isFinite(video.duration);
  function seek(time) {
    pendingTime = Math.max(0, Number(time) || 0);
    if (hasMetadata()) {
      video.currentTime = Math.min(pendingTime, Math.max(0, video.duration - 0.1));
      pendingTime = 0;
    }
  }
  function showError(code) {
    const reason = {
      1: '播放被中断', 2: '网络未能加载完整视频',
      3: '浏览器无法解码当前视频', 4: '当前浏览器不支持此格式，或视频源未能加载'
    }[code] || '视频未能加载';
    status.textContent = `${reason}（错误码 ${code || '未知'}）。请切换 WebM / MP4 后点击播放，或重试加载。完整图文不受影响。`;
  }
  function play() {
    try {
      Promise.resolve(video.play()).catch(error => {
        if (error?.name === 'NotSupportedError') showError(4);
        else status.textContent = '播放没有开始，请点击播放器的播放按钮；仍无反应时切换格式或重试加载。';
      });
    } catch (_) { showError(video.error?.code); }
  }
  function metadataReady() {
    video.playbackRate = Number(speed?.value) || 1;
    if (pendingTime > 0 && pendingTime < video.duration - 0.1) seek(pendingTime);
    else pendingTime = 0;
    status.textContent = '视频已加载；点击播放继续。可切换格式，学习任务仍需手动勾选。';
  }
  video.addEventListener('loadedmetadata', metadataReady);
  document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => {
    seek(button.dataset.seek);
    play();
    video.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }));
  speed?.addEventListener('change', e => { video.playbackRate = Number(e.target.value); });
  document.getElementById('replay')?.addEventListener('click', () => { seek(Math.max(0, video.currentTime - 10)); });
  function reloadSource() {
    pendingTime = video.currentTime > 0 ? video.currentTime : pendingTime;
    video.pause();
    const selected = format?.value || 'auto';
    if (selected === 'auto') video.removeAttribute('src');
    else if (video.dataset[selected]) video.src = video.dataset[selected];
    video.load();
    status.textContent = '正在重新加载；加载后点击播放，保留原来的观看位置。';
  }
  format?.addEventListener('change', reloadSource);
  document.getElementById('retry')?.addEventListener('click', reloadSource);
  const chapters = [...document.querySelectorAll('.chapters [data-seek]')];
  let lastSave = -10;
  video.addEventListener('timeupdate', () => {
    chapters.forEach((button, i) => button.setAttribute('aria-current', String(video.currentTime >= Number(button.dataset.seek) && (i === chapters.length-1 || video.currentTime < Number(chapters[i+1].dataset.seek)))));
    if (hasMetadata() && Math.abs(video.currentTime-lastSave)>5) {
      try { localStorage.setItem(key, String(video.currentTime)); } catch (_) {}
      lastSave = video.currentTime;
    }
  });
  // Source errors do not always bubble to the video element.
  const sources = [...video.querySelectorAll('source')];
  const failedSources = new Set();
  sources.forEach(source => source.addEventListener('error', () => {
    failedSources.add(source);
    if (failedSources.size === sources.length) showError(4);
  }));
  video.addEventListener('loadstart', () => failedSources.clear());
  video.addEventListener('error', () => showError(video.error?.code));
  video.addEventListener('waiting', () => { status.textContent = '正在缓冲视频；若长时间不动，请切换播放格式或点击“重试加载”。'; });
  video.addEventListener('stalled', () => { status.textContent = '视频数据暂未到达。可以重试加载或下载后播放；也可先读上方的完整图文。'; });
  video.addEventListener('playing', () => { status.textContent = '正在播放。看不懂时暂停手算，或切换到上方的完整图文。'; });
  video.addEventListener('ended', () => { status.textContent = '看完了。试着闭卷回答自测，再回到今日任务手动勾选。'; });
  // A cached source can finish before this deferred script attaches listeners.
  if (video.error) showError(video.error.code);
  else if (hasMetadata()) metadataReady();
})();
