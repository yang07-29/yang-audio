/* Native MP4 playback; no analytics, uploads or autoplay. */
(() => {
  'use strict';
  if (new URL(location.href).searchParams.get('embedded') === '1') document.body.classList.add('embedded');
  const video = document.getElementById('lesson-video');
  if (!video) return;
  const status = document.getElementById('play-status');
  const key = 'yang-audio-video-v2:' + location.pathname;
  let saved = 0;
  try { saved = Number(localStorage.getItem(key)) || 0; } catch (_) {}
  video.addEventListener('loadedmetadata', () => {
    if (saved > 0 && saved < video.duration - 5) {
      video.currentTime = saved;
      status.textContent = '已恢复到上次位置；点击播放继续。视频结束不会自动勾选学习任务。';
    }
  }, { once: true });
  document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => {
    video.currentTime = Number(button.dataset.seek);
    video.play().catch(() => { status.textContent = '已跳转，请点击播放器开始播放。'; });
    video.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }));
  document.getElementById('speed').addEventListener('change', e => { video.playbackRate = Number(e.target.value); });
  document.getElementById('replay').addEventListener('click', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  const chapters = [...document.querySelectorAll('.chapters [data-seek]')];
  let lastSave = -10;
  video.addEventListener('timeupdate', () => {
    chapters.forEach((button, i) => button.setAttribute('aria-current', String(video.currentTime >= Number(button.dataset.seek) && (i === chapters.length-1 || video.currentTime < Number(chapters[i+1].dataset.seek)))));
    if (Math.abs(video.currentTime-lastSave)>5) {
      try { localStorage.setItem(key, String(video.currentTime)); } catch (_) {}
      lastSave = video.currentTime;
    }
  });
  video.addEventListener('error', () => { status.textContent = '视频未能加载。请检查网络或尝试下载视频；正文与讲稿仍可阅读。'; });
  video.addEventListener('ended', () => { status.textContent = '看完了。试着闭卷回答自测，再回到今日任务手动勾选。'; });
})();
