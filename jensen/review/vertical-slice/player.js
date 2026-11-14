(function () {
  'use strict';
  // This local fixture preview has no reward writer, persistence or combat entry.
  function createPlayer(fixture) {
    if (!fixture || fixture.mode !== 'READ_ONLY_STORY_PREVIEW' || !Array.isArray(fixture.shots) || fixture.shots.length !== 4 || fixture.rewardBinding !== 'UNBOUND') throw new Error('Expected four-shot preview with an unbound reward.');
    for (const shot of fixture.shots) {
      if (![shot.id, shot.caption, shot.period, shot.label, shot.alt].every(v => typeof v === 'string' && v.length > 0)) throw new Error('Incomplete shot.');
      if (shot.image !== null && (typeof shot.image !== 'string' || !/^assets\/[a-z0-9-]+\.png$/.test(shot.image))) throw new Error('Image must be a local approved asset.');
      if (!Number.isFinite(shot.seconds) || shot.seconds < 7 || shot.seconds > 12) throw new Error('Invalid optional reading interval.');
    }
    let position = 0;
    return {
      get position() { return position; },
      get phase() { return position < 4 ? 'story' : position === 4 ? 'onboarding' : 'preview'; },
      next() { position = Math.min(5, position + 1); },
      previous() { position = Math.max(0, position - 1); },
      skip() { position = 5; },
      replay() { position = 0; }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createPlayer };
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  let player;
  try { player = createPlayer(window.N01_PREVIEW); }
  catch (error) {
    $('caption').textContent = '剧情数据未就绪';
    $('support').textContent = '未产生奖励或进度。请保留此页交作者检查。';
    for (const id of ['next', 'previous', 'skip', 'autoplay']) $(id).disabled = true;
    return;
  }
  const fixture = window.N01_PREVIEW;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  $('reduce-motion').checked = reduced.matches;
  document.body.classList.toggle('reduced-motion', reduced.matches);
  $('history').textContent = fixture.history;
  let timer = null;
  let imageGeneration = 0;
  function stopAuto() {
    clearTimeout(timer);
    timer = null;
    $('autoplay').checked = false;
  }
  function schedule() {
    clearTimeout(timer);
    timer = null;
    if ($('autoplay').checked && player.phase === 'story' && !document.hidden) {
      timer = setTimeout(() => { player.next(); render(false); }, fixture.shots[player.position].seconds * 1000);
    }
  }
  function showImage(shot) {
    const generation = ++imageGeneration;
    const art = $('art');
    art.onload = null;
    art.onerror = null;
    art.hidden = true;
    art.removeAttribute('src');
    $('image-fallback').hidden = false;
    $('image-fallback').textContent = shot.alt + '。插画尚未载入，仍可继续或跳过。';
    art.alt = shot.alt;
    if (!shot.image) return;
    art.onload = () => {
      if (generation !== imageGeneration) return;
      art.hidden = false;
      $('image-fallback').hidden = true;
    };
    art.onerror = () => {
      if (generation !== imageGeneration) return;
      art.hidden = true;
      $('image-fallback').hidden = false;
      $('image-fallback').textContent = '插画未能显示：' + shot.alt + '。仍可继续或跳过。';
    };
    art.src = shot.image;
  }
  function render(moveFocus) {
    const story = player.phase === 'story';
    const onboarding = player.phase === 'onboarding';
    if (!story) stopAuto();
    const shot = fixture.shots[story ? player.position : 3];
    $('period').textContent = story ? shot.period : onboarding ? '唯一提升 · 待绑定' : '1997 · 幻想竞赛';
    $('progress').textContent = story ? `${player.position + 1} / 4 镜` : onboarding ? '能力提示' : '下一战设计';
    $('truth-label').textContent = story ? shot.label : '只读设计预演 · 没有真实胜利或结算回执';
    $('caption').textContent = story ? shot.caption : onboarding ? '下一场之前，只看这一次提升。' : '下一张舞台，留出一条你的路。';
    $('support').textContent = story ? '' : onboarding ? '当前奖励未绑定。这个提示不发奖，也不要求试招。' : '当前没有可玩的第 2 战入口。';
    $('onboarding').hidden = !onboarding;
    $('battle-preview').hidden = player.phase !== 'preview';
    $('visual').hidden = onboarding;
    if (!onboarding) showImage(shot);
    $('previous').disabled = player.position === 0;
    $('previous').textContent = story ? '上一镜' : onboarding ? '回看最后一镜' : '回看能力提示';
    $('next').hidden = player.phase === 'preview';
    $('next').textContent = player.position === 3 ? '查看能力提示' : onboarding ? '查看第2战设计' : '下一镜';
    $('skip').disabled = player.phase === 'preview';
    $('autoplay').disabled = !story;
    $('caption').classList.remove('scene-enter');
    void $('caption').offsetWidth;
    $('caption').classList.add('scene-enter');
    if (moveFocus) $('caption').focus();
    schedule();
  }
  $('next').addEventListener('click', () => { player.next(); render(true); });
  $('previous').addEventListener('click', () => { stopAuto(); player.previous(); render(true); });
  $('skip').addEventListener('click', () => { stopAuto(); player.skip(); render(true); });
  $('replay').addEventListener('click', () => { stopAuto(); player.replay(); render(true); });
  $('autoplay').addEventListener('change', schedule);
  $('reduce-motion').addEventListener('change', () => document.body.classList.toggle('reduced-motion', $('reduce-motion').checked));
  $('large-text').addEventListener('change', () => document.body.classList.toggle('large-text', $('large-text').checked));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); });
  window.addEventListener('pagehide', stopAuto);
  render(false);
}());
