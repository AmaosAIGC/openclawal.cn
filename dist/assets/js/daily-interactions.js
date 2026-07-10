1|1|/**
2|2| * daily-interactions.js — 日报页交互功能（v3）
3|3| * 功能：前一期/后一期导航、公众号弹窗、下载图片
4|4| * 修正：srcdoc 绕过 X-Frame-Options、data-date 追踪当前日期、自适应高度
5|5| */
6|6|(function() {
7|7|  'use strict';
8|8|
9|9|  var AVAILABLE_DATES = [
10|10|    "2026-06-01","2026-06-02","2026-06-03","2026-06-04",
11|11|    "2026-06-09","2026-06-10","2026-06-11",
12|12|    "2026-06-15","2026-06-16","2026-06-17","2026-06-18","2026-06-22",
13|13|    "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10"
14|14|  ];
15|15|  var CURRENT_DATE = "2026-07-10";
16|16|
17|17|  /* ──────── 工具函数 ──────── */
18|18|  function getCurrentDateStr() {
19|19|    var iframe = document.querySelector('.oc-daily-frame');
20|20|    if (!iframe) return 'today';
21|21|    if (iframe.dataset && iframe.dataset.date) return iframe.dataset.date;
22|22|    var m = iframe.src.match(/daily\/(\d{4}-\d{2}-\d{2})\.html/);
23|23|    return m ? m[1] : 'today';
24|24|  }
25|25|
26|26|  /* ──────── 高度自适应 ──────── */
27|27|  function adjustHeight(iframe) {
28|28|    try {
29|29|      var doc = iframe.contentDocument || iframe.contentWindow.document;
30|30|      var b = doc.body;
31|31|      if (!b) return;
32|32|      var wasOverflow = b.style.overflow;
33|33|      b.style.overflow = 'visible';
34|34|      var realH = b.scrollHeight;
35|35|      b.style.overflow = wasOverflow;
36|36|      iframe.style.height = Math.max(realH, 400) + 'px';
37|37|    } catch(e) {}
38|38|  }
39|39|
40|40|  function setCurrentDate(dateStr) {
41|41|    var iframe = document.querySelector('.oc-daily-frame');
42|42|    if (iframe) iframe.dataset.date = dateStr;
43|43|  }
44|44|
45|45|  /* ──────── 通过 fetch 把报告页内容加载到 iframe srcdoc ──────── */
46|46|  function loadReportByFetch(dateStr, callback) {
47|47|    var xhr = new XMLHttpRequest();
48|48|    xhr.open('GET', '/reports/daily/' + dateStr + '.html?t=' + Date.now(), true);
49|49|    xhr.onload = function() {
50|50|      if (xhr.status !== 200) {
51|51|        console.error('Failed to fetch report:', xhr.status);
52|52|        if (callback) callback();
53|53|        return;
54|54|      }
55|55|      var iframe = document.querySelector('.oc-daily-frame');
56|56|      if (!iframe) { if (callback) callback(); return; }
57|57|      iframe.srcdoc = xhr.responseText;
58|58|      var checkLoaded = function() {
59|59|        try {
60|60|          var doc = iframe.contentDocument || iframe.contentWindow.document;
61|61|          if (doc && doc.body && doc.body.childNodes.length > 0) {
62|62|            setTimeout(function() { adjustHeight(iframe); }, 100);
63|63|            if (callback) callback();
64|64|            return;
65|65|          }
66|66|        } catch(e) {}
67|67|        setTimeout(checkLoaded, 50);
68|68|      };
69|69|      setTimeout(checkLoaded, 100);
70|70|    };
71|71|    xhr.onerror = function() {
72|72|      console.error('XHR error fetching report');
73|73|      if (callback) callback();
74|74|    };
75|75|    xhr.send();
76|76|  }
77|77|
78|78|  /* ──────── 1. 前一期/后一期导航 ──────── */
79|79|  function initNavigation() {
80|80|    var prevBtn = document.querySelector('.oc-daily-step button:first-child');
81|81|    var nextBtn = document.querySelector('.oc-daily-step button:last-child');
82|82|    var iframe = document.querySelector('.oc-daily-frame');
83|83|
84|84|    if (!prevBtn || !nextBtn || !iframe) return;
85|85|
86|86|    function getCurrentDate() {
87|87|      if (iframe.dataset && iframe.dataset.date) return iframe.dataset.date;
88|88|      var m = iframe.src.match(/daily\/(\d{4}-\d{2}-\d{2})\.html/);
89|89|      return m ? m[1] : null;
90|90|    }
91|91|
92|92|    function updateDateUI(dateStr) {
93|93|      var d = new Date(dateStr + 'T00:00:00+08:00');
94|94|      var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
95|95|      var wd = weekdays[d.getDay()];
96|96|      var month = parseInt(dateStr.slice(5,7));
97|97|      var day = parseInt(dateStr.slice(8,10));
98|98|
99|99|      var pill = document.querySelector('.oc-daily-date-pill');
100|100|      if (pill) pill.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path></svg>' + dateStr + ' · ' + wd;
101|101|
102|102|      var title = document.querySelector('.oc-daily-main__head h2');
103|103|      if (title) title.textContent = 'OpenClaw 中文社区日报 ' + month + '月' + day + '日';
104|104|
105|105|      var dl = document.querySelector('.oc-daily-cta__secondary');
106|106|      if (dl) {
107|107|        dl.dataset.date = dateStr;
108|108|      }
109|109|    }
110|110|
111|111|    function loadHighlights(dateStr) {
112|112|      var xhr = new XMLHttpRequest();
113|113|      xhr.open('GET', '/reports/daily/' + dateStr + '.html', true);
114|114|      xhr.onload = function() {
115|115|        if (xhr.status !== 200) return;
116|116|        var html = xhr.responseText;
117|117|        var communityCount = (html.match(/<li class="community-item">/g) || []).length;
118|118|        var headlinesCount = (html.match(/<li class="headline">/g) || []).length;
119|119|
120|120|        var hh = document.querySelector('.oc-daily-highlights__head');
121|121|        if (hh && communityCount > 0) {
122|122|          var total = headlinesCount + communityCount;
123|123|          hh.innerHTML = '本期社区摘录 · 共 ' + total + ' 条';
124|124|        }
125|125|
126|126|        var hl = document.querySelector('.oc-daily-highlights__list');
127|127|        if (!hl) return;
128|128|
129|129|        var parser = new DOMParser();
130|130|        var doc = parser.parseFromString(html, 'text/html');
131|131|        var items = doc.querySelectorAll('.community-item');
132|132|        var headlines = doc.querySelectorAll('.headline');
133|133|
134|134|        var h = '';
135|135|        if (headlines.length > 0) {
136|136|          headlines.forEach(function(item, i) {
137|137|            var num = (i + 1).toString().padStart(2, '0');
138|138|            var titleEl = item.querySelector('.headline-title');
139|139|            var tagEl = item.querySelector('.tag-headline');
140|140|            var title = titleEl ? titleEl.textContent : '';
141|141|            var tag = tagEl ? tagEl.textContent : '';
142|142|            if (title) {
143|143|              h += '<li class="oc-daily-highlights__item"><span class="oc-daily-highlights__num">' + num + '</span><span class="oc-daily-highlights__body"><span class="oc-daily-highlights__title">' + title + '</span><span class="oc-daily-highlights__tag">' + tag + '</span></span></li>';
144|144|            }
145|145|          });
146|146|        }
147|147|        if (items.length > 0) {
148|148|          items.forEach(function(item, i) {
149|149|            var idx = headlines.length + i;
150|150|            var num = (idx + 1).toString().padStart(2, '0');
151|151|            var titleEl = item.querySelector('.community-title');
152|152|            var tagEl = item.querySelector('.tag-community');
153|153|            var title = titleEl ? titleEl.textContent : '';
154|154|            var tag = tagEl ? tagEl.textContent : '';
155|155|            if (title) {
156|156|              h += '<li class="oc-daily-highlights__item"><span class="oc-daily-highlights__num">' + num + '</span><span class="oc-daily-highlights__body"><span class="oc-daily-highlights__title">' + title + '</span><span class="oc-daily-highlights__tag">' + tag + '</span></span></li>';
157|157|            }
158|158|          });
159|159|        }
160|160|        hl.innerHTML = h || '<li class="oc-daily-highlights__item" style="opacity:0.6">暂无社区摘录数据</li>';
161|161|      };
162|162|      xhr.send();
163|163|    }
164|164|
165|165|    function navigate(dir) {
166|166|      var current = getCurrentDate();
167|167|      if (!current) return;
168|168|      var idx = AVAILABLE_DATES.indexOf(current);
169|169|      if (idx === -1) return;
170|170|      var newIdx = idx + dir;
171|171|      if (newIdx < 0 || newIdx >= AVAILABLE_DATES.length) return;
172|172|      var newDate = AVAILABLE_DATES[newIdx];
173|173|
174|174|      loadReportByFetch(newDate, function() {
175|175|        loadHighlights(newDate);
176|176|        updateDateUI(newDate);
177|177|      });
178|178|
179|179|      setCurrentDate(newDate);
180|180|      updateDateUI(newDate);
181|181|      prevBtn.disabled = (newIdx === 0);
182|182|      nextBtn.disabled = (newIdx === AVAILABLE_DATES.length - 1);
183|183|    }
184|184|
185|185|    prevBtn.addEventListener('click', function() { navigate(-1); });
186|186|    nextBtn.addEventListener('click', function() { navigate(1); });
187|187|
188|188|    function onIframeLoad() {
189|189|      setTimeout(function() { adjustHeight(iframe); }, 100);
190|190|    }
191|191|    iframe.addEventListener('load', onIframeLoad);
192|192|
193|193|    var initialDate = CURRENT_DATE;
194|194|    updateDateUI(initialDate);
195|195|    loadReportByFetch(initialDate, function() {
196|196|      loadHighlights(initialDate);
197|197|    });
198|198|
199|199|    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
200|200|      setTimeout(function() { adjustHeight(iframe); }, 150);
201|201|    }
202|202|
203|203|    setCurrentDate(initialDate);
204|204|    prevBtn.disabled = true;
205|205|  }
206|206|
207|207|  /* ──────── 2. 公众号弹窗 ──────── */
208|208|  function initModal() {
209|209|    var overlay = document.createElement('div');
210|210|    overlay.id = 'oc-daily-modal';
211|211|
212|212|    var style = document.createElement('style');
213|213|    style.textContent =
214|214|      '#oc-daily-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.75);justify-content:center;align-items:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:ocModalFadeIn 0.25s ease-out;}' +
215|215|      '#oc-daily-modal.show{display:flex;}' +
216|216|      '@keyframes ocModalFadeIn{from{opacity:0}to{opacity:1}}' +
217|217|      '#oc-daily-modal .oc-modal-card{background:linear-gradient(145deg,#0d312d 0%,#082121 100%);border:1px solid rgba(255,230,203,0.12);border-radius:24px;padding:0;max-width:480px;width:92%;box-shadow:0 32px 96px rgba(0,0,0,0.6);position:relative;overflow:hidden;animation:ocModalSlideUp 0.3s ease-out;}' +
218|218|      '@keyframes ocModalSlideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}' +
219|219|      '#oc-daily-modal .oc-modal-close{position:absolute;top:16px;right:18px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,230,203,0.10);color:rgba(255,230,203,0.5);font-size:20px;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;transition:all 0.2s;line-height:1;}' +
220|220|      '#oc-daily-modal .oc-modal-close:hover{background:rgba(255,230,203,0.12);color:#ffe6cb;}' +
221|221|      '#oc-daily-modal .oc-modal-header{padding:40px 32px 0 32px;text-align:center;}' +
222|222|      '#oc-daily-modal .oc-modal-badge{display:inline-block;background:linear-gradient(135deg,rgba(251,146,60,0.20),rgba(251,146,60,0.08));border:1px solid rgba(251,146,60,0.20);border-radius:20px;padding:4px 14px;font-size:13px;color:#fb923c;letter-spacing:1px;font-weight:700;text-transform:uppercase;margin-bottom:12px;}' +
223|223|      '#oc-daily-modal .oc-modal-title{color:#ffe6cb;font-size:22px;margin:0 0 6px;font-weight:700;}' +
224|224|      '#oc-daily-modal .oc-modal-desc{color:rgba(255,230,203,0.7);font-size:16px;font-weight:600;line-height:1.7;margin:0 0 24px;}' +
225|225|      '#oc-daily-modal .oc-modal-body{padding:0 32px 32px;display:flex;flex-direction:column;align-items:center;}' +
226|226|      '#oc-daily-modal .oc-modal-qr-wrapper{position:relative;padding:16px;background:rgba(255,230,203,0.03);border:1px solid rgba(255,230,203,0.08);border-radius:16px;margin-bottom:20px;}' +
227|227|      '#oc-daily-modal .oc-modal-qr{width:200px;height:200px;border-radius:10px;display:block;}' +
228|228|      '#oc-daily-modal .oc-modal-label{color:rgba(255,230,203,0.4);font-size:12px;text-align:center;margin:0 0 4px;letter-spacing:0.5px;}' +
229|229|      '#oc-daily-modal .oc-modal-cta{color:#ffd700;font-size:17px;font-weight:700;margin:0;text-align:center;}' +
230|230|      '#oc-daily-modal .oc-modal-footer{background:rgba(0,0,0,0.15);padding:14px 32px;border-top:1px solid rgba(255,230,203,0.05);}' +
231|231|      '#oc-daily-modal .oc-modal-footer p{color:rgba(255,230,203,0.35);font-size:14px;font-weight:600;margin:0;text-align:center;}';
232|232|
233|233|    document.head.appendChild(style);
234|234|
235|235|    var card = document.createElement('div');
236|236|    card.className = 'oc-modal-card';
237|237|
238|238|    var closeBtn = document.createElement('button');
239|239|    closeBtn.className = 'oc-modal-close';
240|240|    closeBtn.innerHTML = '&times;';
241|241|    closeBtn.setAttribute('aria-label', '关闭');
242|242|
243|243|    var header = document.createElement('div');
244|244|    header.className = 'oc-modal-header';
245|245|    var badge = document.createElement('div');
246|246|    badge.className = 'oc-modal-badge';
247|247|    badge.textContent = 'WECHAT · 公众号';
248|248|    var title = document.createElement('h3');
249|249|    title.className = 'oc-modal-title';
250|250|    title.textContent = '订阅公众号获取每日日报';
251|251|    var desc = document.createElement('p');
252|252|    desc.className = 'oc-modal-desc';
253|253|    desc.innerHTML = '微信扫码关注 <strong style="color:#ffd700">「阿茅的数字大厦」</strong>，<br>每日日报上线立刻推送，公众号内可查看含链接详细版。';
254|254|    header.appendChild(badge); header.appendChild(title); header.appendChild(desc);
255|255|
256|256|    var body = document.createElement('div');
257|257|    body.className = 'oc-modal-body';
258|258|    var qrWrapper = document.createElement('div');
259|259|    qrWrapper.className = 'oc-modal-qr-wrapper';
260|260|    var qrImg = document.createElement('img');
261|261|    var pageQr = document.querySelector('img[alt*="二维码"]');
262|262|    qrImg.src = pageQr ? pageQr.src : '/img/daily/wechat-official-qr.jpg';
263|263|    qrImg.alt = '微信公众号「阿茅的数字大厦」二维码';
264|264|    qrImg.className = 'oc-modal-qr';
265|265|    qrWrapper.appendChild(qrImg);
266|266|    body.appendChild(qrWrapper);
267|267|    var ctaText = document.createElement('p');
268|268|    ctaText.className = 'oc-modal-cta';
269|269|    ctaText.textContent = '微信扫一扫 · 关注公众号';
270|270|    body.appendChild(ctaText);
271|271|
272|272|    var footer = document.createElement('div');
273|273|    footer.className = 'oc-modal-footer';
274|274|    var footerP = document.createElement('p');
275|275|    footerP.textContent = '已归档 ' + AVAILABLE_DATES.length + ' 期 · 每日更新';
276|276|    footer.appendChild(footerP);
277|277|
278|278|    card.appendChild(closeBtn); card.appendChild(header); card.appendChild(body); card.appendChild(footer);
279|279|    overlay.appendChild(card);
280|280|    document.body.appendChild(overlay);
281|281|
282|282|    function openModal() { overlay.classList.add('show'); overlay.style.display = 'flex'; }
283|283|    function closeModal() { overlay.classList.remove('show'); overlay.style.display = 'none'; }
284|284|    closeBtn.addEventListener('click', closeModal);
285|285|    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
286|286|    document.addEventListener('keydown', function(e) {
287|287|      if (e.key === 'Escape' && overlay.classList.contains('show')) closeModal();
288|288|    });
289|289|
290|290|    var linksBtn = document.querySelector('.oc-daily-links');
291|291|    if (linksBtn) linksBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopImmediatePropagation(); openModal(); }, true);
292|292|    var subBtn = document.querySelector('.oc-daily-sub-bar');
293|293|    if (subBtn) subBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopImmediatePropagation(); openModal(); }, true);
294|294|    var sidebarCta = document.querySelector('.oc-daily-cta__primary');
295|295|    if (sidebarCta) sidebarCta.addEventListener('click', function(e) { e.preventDefault(); e.stopImmediatePropagation(); openModal(); }, true);
296|296|  }
297|297|
298|298|  /* ──────── 3. 下载图片 ──────── */
299|299|  function initDownload() {
300|300|    var dlLink = document.querySelector('.oc-daily-cta__secondary');
301|301|    if (!dlLink) return;
302|302|
303|303|    dlLink.addEventListener('click', function(e) {
304|304|      e.preventDefault();
305|305|      e.stopImmediatePropagation();
306|306|      var iframe = document.querySelector('.oc-daily-frame');
307|307|      if (!iframe) return;
308|308|      var dateStr = dlLink.dataset.date || getCurrentDateStr();
309|309|      downloadViaCanvas(iframe, dateStr);
310|310|    }, true);
311|311|  }
312|312|
313|313|  function downloadViaCanvas(iframe, dateStr) {
314|314|    if (typeof html2canvas === 'undefined') {
315|315|      var script = document.createElement('script');
316|316|      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
317|317|      script.onload = function() { doCapture(iframe, dateStr); };
318|318|      script.onerror = function() { console.error('html2canvas CDN load failed - CSP blocking'); };
319|319|      document.head.appendChild(script);
320|320|    } else {
321|321|      doCapture(iframe, dateStr);
322|322|    }
323|323|  }
324|324|
325|325|  function doCapture(iframe, dateStr) {
326|326|    try {
327|327|      var doc = iframe.contentDocument || iframe.contentWindow.document;
328|328|      if (!doc) return;
329|329|      var body = doc.body;
330|330|      if (!body) return;
331|331|      var origOverflow = body.style.overflow;
332|332|      body.style.overflow = 'visible';
333|333|      var fullHeight = body.scrollHeight;
334|334|      var fullWidth = body.scrollWidth;
335|335|      html2canvas(body, {
336|336|        scale: 2, useCORS: true, allowTaint: true,
337|337|        backgroundColor: '#041c1c', logging: false,
338|338|        width: fullWidth, height: fullHeight,
339|339|        windowWidth: fullWidth, windowHeight: fullHeight
340|340|      }).then(function(canvas) {
341|341|        body.style.overflow = origOverflow;
342|342|        var link = document.createElement('a');
343|343|        link.download = 'openclaw-daily-' + dateStr + '.png';
344|344|        link.href = canvas.toDataURL('image/png');
345|345|        document.body.appendChild(link);
346|346|        link.click();
347|347|        document.body.removeChild(link);
348|348|      }).catch(function(err) {
349|349|        console.error('html2canvas capture failed:', err);
350|350|        body.style.overflow = origOverflow;
351|351|      });
352|352|    } catch(e) { console.error('Download capture failed:', e); }
353|353|  }
354|354|
355|355|  /* ──────── 初始化 ──────── */
356|356|  function init() {
357|357|    initNavigation();
358|358|    initModal();
359|359|    initDownload();
360|360|  }
361|361|
362|362|  if (document.readyState === 'loading') {
363|363|    document.addEventListener('DOMContentLoaded', init);
364|364|  } else {
365|365|    init();
366|366|  }
367|367|})();
368|368|