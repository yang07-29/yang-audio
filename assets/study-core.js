/* 日期、预算与进度纯函数；浏览器和Node测试共用，不依赖网络。 */
(function (host, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else host.AudioStudyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const ms = Date.parse(value+'T00:00:00Z');
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0,10) === value;
  }
  function dateAt(start, index) {
    if (!validDate(start) || !Number.isInteger(index)) throw new Error('无效日期或序号');
    return new Date(Date.parse(start+'T00:00:00Z')+index*DAY).toISOString().slice(0,10);
  }
  function indexAt(start, date) {
    if (!validDate(start) || !validDate(date)) throw new Error('无效日期');
    return Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/DAY);
  }
  function normalize(raw, data) {
    const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const result = {version:1,start:validDate(s.start) ? s.start : data.start,
      minutes:[90,120,150].includes(s.minutes) ? s.minutes : data.defaultMinutes,done:{},notes:{}};
    for (const day of data.days) {
      const checks = s.done && s.done[day.id];
      if (Array.isArray(checks)) result.done[day.id] = Array.from({length:5},(_,i)=>checks[i] === true);
      const note = s.notes && s.notes[day.id];
      if (typeof note === 'string') result.notes[day.id] = note.slice(0,10000);
    }
    return result;
  }
  function isComplete(checks) {
    return Array.isArray(checks) && checks.length === 5 && checks.every(x=>x === true);
  }
  function nextPending(state,data) { return data.days.findIndex(d=>!isComplete(state.done[d.id])); }
  function totalMinutes(day, budget) { return day.minutes.reduce((a,b)=>a+b,0)+([120,150].includes(budget)?budget-90:0); }
  return {validDate,dateAt,indexAt,normalize,isComplete,nextPending,totalMinutes};
});
