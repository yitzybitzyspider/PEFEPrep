/* PEFEPrep — math rendering helper (KaTeX auto-render).
 * Renders $...$ and $$...$$ inside an element. Safe no-op if KaTeX isn't loaded yet.
 */
window.renderMath = function (el) {
  try {
    if (window.renderMathInElement) {
      window.renderMathInElement(el || document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\(", right: "\\)", display: false },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  } catch (e) { /* ignore */ }
};

/* PEFEPrep — Markdown -> HTML for question content (stems, options, solutions).
 * Converts GFM tables, **bold**, bullet lists, and paragraph/line breaks while
 * leaving $...$ / $$...$$ math spans untouched so KaTeX can typeset them afterward.
 * Use renderRich(el, text) for a one-shot (markdown + math), or renderMarkdown /
 * renderInline to build an HTML string and call renderMath(container) once. */
(function () {
  // Placeholder sentinel for stashed math: a control char that never appears in
  // content. Written as a \u escape so the source file stays pure ASCII.
  var STX = "";
  var RESTORE_RE = new RegExp(STX + "(\\d+)" + STX, "g");
  var LONE_RE = new RegExp("^" + STX + "(\\d+)" + STX + "$");

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function inlineFmt(s) {
    return esc(s)
      .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  }

  function stash(text, bag) {
    // Escape-aware: a literal \$ (a dollar sign written inside math, e.g. currency authored
    // as $\$5{,}400$) must NOT terminate the span, or the closing $ and any following | get
    // mis-paired (which silently breaks table columns and runs prose together).
    return String(text)
      .replace(/\$\$(?:\\.|[^$]|\$(?!\$))+?\$\$/g, function (m) { bag.push(m); return STX + (bag.length - 1) + STX; })
      .replace(/\$(?:\\.|[^$\n])+?\$/g, function (m) { bag.push(m); return STX + (bag.length - 1) + STX; });
  }
  function restore(html, bag) {
    return html.replace(RESTORE_RE, function (_, n) { return bag[+n]; });
  }
  // True when a line is exactly one stashed display-math ($$...$$) span.
  function loneDisplay(line, bag) {
    var m = line.trim().match(LONE_RE);
    return !!(m && /^\$\$/.test(bag[+m[1]] || ""));
  }

  function splitRow(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }
  function isTableSep(line) {
    var t = line.trim();
    return /^[\s|:\-]+$/.test(t) && t.indexOf("-") >= 0 && t.indexOf("|") >= 0;
  }
  function isBullet(line) { return /^\s*[•\-*]\s+/.test(line); }
  function isRow(line) { return /^\s*\|/.test(line); }

  // Single-line / inline rendering: bold + math only, no block wrapping.
  window.renderInline = function (text) {
    if (text == null) return "";
    var bag = [];
    return restore(inlineFmt(stash(text, bag)), bag);
  };

  // Full block rendering: tables, lists, paragraphs, bold, math.
  window.renderMarkdown = function (text) {
    if (text == null) return "";
    var bag = [];
    var lines = stash(String(text).replace(/\r\n?/g, "\n"), bag).split("\n");
    var out = [], i = 0;

    while (i < lines.length) {
      if (lines[i].trim() === "") { i++; continue; }

      // GFM table: a "|...|" row immediately followed by a |---|---| separator.
      if (isRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var head = splitRow(lines[i]); i += 2;
        var body = [];
        while (i < lines.length && isRow(lines[i]) && lines[i].trim() !== "") { body.push(splitRow(lines[i])); i++; }
        out.push('<table class="mdtable"><thead><tr>' +
          head.map(function (c) { return "<th>" + inlineFmt(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          body.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inlineFmt(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table>");
        continue;
      }

      // Bullet list: consecutive bullet (*, -, or bullet-dot) lines.
      if (isBullet(lines[i])) {
        var items = [];
        while (i < lines.length && isBullet(lines[i])) {
          items.push("<li>" + inlineFmt(lines[i].replace(/^\s*[•\-*]\s+/, "")) + "</li>"); i++;
        }
        out.push('<ul class="mdlist">' + items.join("") + "</ul>");
        continue;
      }

      // A standalone display-math line renders as its own block; wrap it in a div so
      // consecutive $$…$$ blocks stay separated and KaTeX never sits inside a <p>.
      if (loneDisplay(lines[i], bag)) { out.push('<div class="mdmath">' + lines[i].trim() + "</div>"); i++; continue; }

      // Paragraph: gather lines until a blank line or a block element; single \n -> <br>.
      var para = [];
      while (i < lines.length && lines[i].trim() !== "" && !isRow(lines[i]) && !isBullet(lines[i]) && !loneDisplay(lines[i], bag)) {
        para.push(inlineFmt(lines[i])); i++;
      }
      out.push("<p>" + para.join("<br>") + "</p>");
    }

    return restore(out.join(""), bag);
  };

  // Convenience: set element HTML from markdown, then typeset its math.
  window.renderRich = function (el, text) {
    if (!el) return;
    el.innerHTML = window.renderMarkdown(text);
    window.renderMath(el);
  };
})();
