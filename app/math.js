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
