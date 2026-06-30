#!/usr/bin/env python3
"""Build a print-ready FE study PDF (LaTeX -> pdflatex) from a data/days/dayNN.json file.

Usage: python3 scripts/build_day_pdf.py data/days/day05.json materials/

The day JSON uses KaTeX-style math inside $...$ (\dfrac, \mathrm, \times, ...), which
pdflatex renders directly with amsmath. Plain-text segments are LaTeX-escaped and a
small set of Unicode characters are mapped to LaTeX so pdflatex (non-UTF8 by default)
compiles cleanly. Uses only base/recommended LaTeX packages (no -extra).
"""
import json
import re
import sys
import os

# Unicode -> (text-mode LaTeX, math-mode LaTeX)
UNI = {
    "³": ("\\textsuperscript{3}", "^{3}"),
    "²": ("\\textsuperscript{2}", "^{2}"),
    "¹": ("\\textsuperscript{1}", "^{1}"),
    "°": ("\\textdegree{}", "^{\\circ}"),
    "×": ("$\\times$", "\\times"),
    "−": ("$-$", "-"),
    "–": ("--", "-"),
    "—": ("---", "-"),
    "≈": ("$\\approx$", "\\approx"),
    "≤": ("$\\le$", "\\le"),
    "≥": ("$\\ge$", "\\ge"),
    "·": ("$\\cdot$", "\\cdot{}"),
    "½": ("$\\tfrac{1}{2}$", "\\tfrac{1}{2}"),
    "√": ("$\\surd$", "\\surd"),
    "α": ("$\\alpha$", "\\alpha"),
    "β": ("$\\beta$", "\\beta"),
    "Δ": ("$\\Delta$", "\\Delta"),
    "μ": ("$\\mu$", "\\mu"),
    "µ": ("$\\mu$", "\\mu"),
    "ρ": ("$\\rho$", "\\rho"),
    "γ": ("$\\gamma$", "\\gamma"),
    "π": ("$\\pi$", "\\pi"),
    "θ": ("$\\theta$", "\\theta"),
    "ε": ("$\\varepsilon$", "\\varepsilon"),
    "σ": ("$\\sigma$", "\\sigma"),
    "η": ("$\\eta$", "\\eta"),
    "τ": ("$\\tau$", "\\tau"),
    "λ": ("$\\lambda$", "\\lambda"),
    "ω": ("$\\omega$", "\\omega"),
    "Γ": ("$\\Gamma$", "\\Gamma"),
    "Σ": ("$\\Sigma$", "\\Sigma"),
    "Φ": ("$\\Phi$", "\\Phi"),
    "Ω": ("$\\Omega$", "\\Omega"),
    "x̄": ("$\\bar{x}$", "\\bar{x}"),
    "̄": ("", ""),    # strip stray combining macron (U+0304)
    "ṁ": ("$\\dot{m}$", "\\dot{m}"),
    "∑": ("$\\sum$", "\\sum"),
    "→": ("$\\rightarrow$", "\\rightarrow"),
    "⇌": ("$\\rightleftharpoons$", "\\rightleftharpoons"),
    # superscripts
    "⁰": ("\\textsuperscript{0}", "^{0}"),
    "⁴": ("\\textsuperscript{4}", "^{4}"),
    "⁵": ("\\textsuperscript{5}", "^{5}"),
    "⁶": ("\\textsuperscript{6}", "^{6}"),
    "⁷": ("\\textsuperscript{7}", "^{7}"),
    "⁸": ("\\textsuperscript{8}", "^{8}"),
    "⁹": ("\\textsuperscript{9}", "^{9}"),
    "ⁿ": ("\\textsuperscript{n}", "^{n}"),
    "⁺": ("\\textsuperscript{+}", "^{+}"),
    "⁻": ("\\textsuperscript{--}", "^{-}"),
    # subscripts
    "₀": ("\\textsubscript{0}", "_{0}"),
    "₁": ("\\textsubscript{1}", "_{1}"),
    "₂": ("\\textsubscript{2}", "_{2}"),
    "₃": ("\\textsubscript{3}", "_{3}"),
    "₄": ("\\textsubscript{4}", "_{4}"),
    "₅": ("\\textsubscript{5}", "_{5}"),
    "₆": ("\\textsubscript{6}", "_{6}"),
    "₇": ("\\textsubscript{7}", "_{7}"),
    "₈": ("\\textsubscript{8}", "_{8}"),
    "₉": ("\\textsubscript{9}", "_{9}"),
    "ₐ": ("\\textsubscript{a}", "_{a}"),
    "ₑ": ("\\textsubscript{e}", "_{e}"),
    "ₒ": ("\\textsubscript{o}", "_{o}"),
    "ₚ": ("\\textsubscript{p}", "_{p}"),
    "ₜ": ("\\textsubscript{t}", "_{t}"),
    "ₙ": ("\\textsubscript{n}", "_{n}"),
    "ₗ": ("\\textsubscript{l}", "_{l}"),
    "ᵢ": ("\\textsubscript{i}", "_{i}"),
    "ᵣ": ("\\textsubscript{r}", "_{r}"),
    "ₓ": ("\\textsubscript{x}", "_{x}"),
    "₊": ("\\textsubscript{+}", "_{+}"),
    "₋": ("\\textsubscript{-}", "_{-}"),
    # math symbols
    "✓": ("$\\checkmark$", "\\checkmark"),
    "∼": ("$\\sim$", "\\sim"),
    "≡": ("$\\equiv$", "\\equiv"),
    "∝": ("$\\propto$", "\\propto"),
    "∞": ("$\\infty$", "\\infty"),
    "±": ("$\\pm$", "\\pm"),
    "∓": ("$\\mp$", "\\mp"),
    "≠": ("$\\neq$", "\\neq"),
    "∈": ("$\\in$", "\\in"),
    "∉": ("$\\notin$", "\\notin"),
    "⊂": ("$\\subset$", "\\subset"),
    "∩": ("$\\cap$", "\\cap"),
    "∪": ("$\\cup$", "\\cup"),
    "∧": ("$\\wedge$", "\\wedge"),
    "∨": ("$\\vee$", "\\vee"),
    "∫": ("$\\int$", "\\int"),
    "∂": ("$\\partial$", "\\partial"),
    "∇": ("$\\nabla$", "\\nabla"),
    # typographic
    "’": ("'", "'"),
    "‘": ("'", "'"),
    "‘": ("'", "'"),
    "“": ("``", "``"),
    "”": ("''", "''"),
    " ": ("\\,", "\\,"),   # thin space
    " ": ("~", "~"),  # nbsp
}

SPECIALS = {
    "\\": "\\textbackslash{}",
    "&": "\\&",
    "%": "\\%",
    "$": "\\$",
    "#": "\\#",
    "_": "\\_",
    "{": "\\{",
    "}": "\\}",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
    "<": "\\textless{}",
    ">": "\\textgreater{}",
    "|": "\\textbar{}",
}


def esc_text(s):
    out = []
    for ch in s:
        if ch in UNI:
            out.append(UNI[ch][0])
        elif ch in SPECIALS:
            out.append(SPECIALS[ch])
        else:
            out.append(ch)
    return "".join(out)


def fix_math(s):
    out = []
    for ch in s:
        out.append(UNI[ch][1] if ch in UNI else ch)
    return "".join(out)


# Math placeholders use an ASCII token that never occurs in content (no "@@@" in any
# day file) and is stripped again before LaTeX is emitted, so output stays ASCII.
_SENT = "@@@%d@@@"
_SENT_RE = re.compile(r"@@@(\d+)@@@")
# A balanced $...$ inline-math span, escape-aware so a literal \$ (a dollar sign written
# inside math, e.g. currency authored as $\$5{,}400$) does not terminate the span.
_INLINE_MATH = re.compile(r"\$((?:\\.|[^$])+?)\$")
_DISPLAY_MATH = re.compile(r"\$\$((?:\\.|[^$]|\$(?!\$))+?)\$\$")
# **bold**  or  *italic*. Italic is boundary-aware (CommonMark-ish): a delimiting * may not
# touch an alphanumeric, so intraword multiplication like C1*p1+C2*p2 is left as literal text.
_EMPH = re.compile(r"\*\*(.+?)\*\*|(?<![A-Za-z0-9*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![A-Za-z0-9*])")


def render_inline(s):
    """Inline renderer: math spans kept, **bold**/*italic* -> LaTeX, the rest escaped.

    Currency is authored as self-delimited math (e.g. ``$\\$5{,}400$``) so every ``$`` is
    balanced; the escape-aware regex keeps the literal ``\\$`` inside the span.
    """
    if s is None:
        return ""
    bag = []

    def stash(m):
        bag.append(m.group(1))
        return _SENT % (len(bag) - 1)

    text = _DISPLAY_MATH.sub(stash, str(s))
    text = _INLINE_MATH.sub(stash, text)

    # Tokenize bold/italic on the math-free text, escaping surrounding and inner text.
    res = []
    last = 0
    for m in _EMPH.finditer(text):
        res.append(_esc_split(text[last:m.start()]))
        if m.group(1) is not None:
            res.append(r"\textbf{" + _esc_split(m.group(1)) + "}")
        else:
            res.append(r"\emph{" + _esc_split(m.group(2)) + "}")
        last = m.end()
    res.append(_esc_split(text[last:]))
    joined = "".join(res)

    return _SENT_RE.sub(lambda m: "$" + fix_math(bag[int(m.group(1))]) + "$", joined)


def _esc_split(text):
    """LaTeX-escape text while preserving @@@N@@@ math placeholders verbatim."""
    out = []
    for i, piece in enumerate(_SENT_RE.split(text)):
        out.append(_SENT % int(piece) if i % 2 == 1 else esc_text(piece))
    return "".join(out)


def _split_row(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _is_table_sep(line):
    t = line.strip()
    return bool(re.fullmatch(r"[\s|:\-]+", t)) and "-" in t and "|" in t


def _is_row(line):
    return line.lstrip().startswith("|")


def _is_bullet(line):
    return bool(re.match(r"\s*[•\-*]\s+", line))


def _is_lone_display(line):
    t = line.strip()
    return t.startswith("$$") and t.endswith("$$") and len(t) >= 4


def render_block(s):
    """Block renderer for stems/solutions: GFM tables, bullet lists, display-math lines,
    and paragraphs (each rendered inline). Mirrors the website's renderMarkdown so the PDF
    and the live site agree."""
    if s is None:
        return ""
    lines = str(s).replace("\r\n", "\n").split("\n")
    out = []
    i = 0
    n = len(lines)
    while i < n:
        if lines[i].strip() == "":
            i += 1
            continue

        # GFM table: a |...| row followed by a |---|---| separator.
        if _is_row(lines[i]) and i + 1 < n and _is_table_sep(lines[i + 1]):
            head = _split_row(lines[i])
            i += 2
            body = []
            while i < n and _is_row(lines[i]) and lines[i].strip() != "":
                body.append(_split_row(lines[i]))
                i += 1
            out.append(_latex_table(head, body))
            continue

        # Bullet list.
        if _is_bullet(lines[i]):
            items = []
            while i < n and _is_bullet(lines[i]):
                items.append(re.sub(r"^\s*[•\-*]\s+", "", lines[i]))
                i += 1
            out.append(r"\begin{itemize}\setlength{\itemsep}{0pt}\setlength{\parskip}{0pt}")
            out.extend(r"\item " + render_inline(it) for it in items)
            out.append(r"\end{itemize}")
            continue

        # Standalone display-math line.
        if _is_lone_display(lines[i]):
            inner = lines[i].strip()[2:-2]
            out.append("\\[" + fix_math(inner) + "\\]")
            i += 1
            continue

        # Paragraph: gather until a blank line or a block element.
        para = []
        while (i < n and lines[i].strip() != "" and not _is_row(lines[i])
               and not _is_bullet(lines[i]) and not _is_lone_display(lines[i])):
            para.append(lines[i])
            i += 1
        out.append(render_inline(" ".join(para)) + r"\par")
    return "\n".join(out)


def _latex_table(head, body):
    ncol = max(len(head), max((len(r) for r in body), default=0))
    spec = "|" + "l|" * ncol

    def row(cells, bold=False):
        cells = list(cells) + [""] * (ncol - len(cells))
        rendered = []
        for c in cells:
            cell = render_inline(c)
            rendered.append((r"\textbf{" + cell + "}") if bold else cell)
        return " & ".join(rendered) + r" \\ \hline"

    lines = [r"\par\vspace{3pt}\noindent\begin{tabular}{" + spec + "}", r"\hline",
             row(head, bold=True)]
    lines += [row(r) for r in body]
    lines.append(r"\end{tabular}\par\vspace{3pt}")
    return "\n".join(lines)


def render(s):
    """Backwards-compatible alias: inline rendering for short fields."""
    return render_inline(s)


PREAMBLE = r"""\documentclass[11pt]{article}
\usepackage[margin=0.9in]{geometry}
\usepackage{amsmath,amssymb}
\usepackage{xcolor}
\usepackage{textcomp}
\usepackage{fancyhdr}
\usepackage[hidelinks]{hyperref}
\definecolor{accent}{HTML}{1F6F8B}
\definecolor{soft}{HTML}{555555}
\definecolor{boxbg}{HTML}{F4F8FA}
\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
\pagestyle{fancy}\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\lhead{\small\color{soft}FE Environmental \textemdash\ PEFEPrep}
\rhead{\small\color{soft}\rightmark}
\cfoot{\small\color{soft}\thepage}
\newcommand{\correct}[1]{\textbf{#1}\;{\color{accent}$\checkmark$}}
\newcommand{\optline}[2]{\par\noindent\hspace{1.2em}(#1)\hspace{0.6em}#2}
"""


def build_tex(day):
    L = [PREAMBLE]
    L.append(r"\begin{document}")
    L.append(r"\begin{center}")
    L.append(r"{\Huge\bfseries\color{accent} " + render(day["topic"]) + r"}\\[4pt]")
    L.append(r"{\large FE Environmental \textemdash\ Day " + str(day["day"]) + r"}\\[2pt]")
    L.append(r"{\color{soft} Study set \textbullet\ " + render(day["date"]) +
             r" \textbullet\ " + str(len(day["questions"])) +
             r" questions \textbullet\ every numeric answer recomputed in Python}")
    L.append(r"\end{center}")
    L.append(r"\vspace{6pt}\hrule\vspace{10pt}")
    L.append(r"\markright{" + render(day["topic"]) + "}")

    if day.get("fidelityNote"):
        L.append(r"\par\noindent\colorbox{boxbg}{\parbox{\dimexpr\linewidth-2\fboxsep\relax}{%")
        L.append(r"\vspace{2pt}{\small\textbf{\color{accent}Handbook fidelity.}\ " +
                 render(day["fidelityNote"]) + r"}\vspace{2pt}}}")
        L.append(r"\vspace{10pt}")

    for i, q in enumerate(day["questions"], 1):
        qid = render(q.get("id", ""))
        concept = render(q.get("concept", ""))
        qtype = q.get("type", "MCQ")
        L.append(r"\filbreak")
        L.append(r"\textbf{\color{accent}Q%d.}\quad {\small\color{soft}[%s \textbullet\ %s \textbullet\ %s]}\par\vspace{2pt}"
                 % (i, qid, qtype, concept))
        L.append(render_block(q.get("stem", "")) + r"\par\vspace{3pt}")

        eqs = q.get("equations", []) or []
        if eqs:
            inner = r" \quad ".join(render(e) for e in eqs)
            L.append(r"{\small\color{soft}Relevant:}\ " + inner + r"\par\vspace{3pt}")

        if qtype == "MCQ" and "options" in q:
            ans = q.get("answer", -1)
            for j, opt in enumerate(q["options"]):
                letter = chr(ord("A") + j)
                txt = render(opt)
                body = (r"\correct{" + txt + r"}") if j == ans else txt
                L.append(r"\optline{%s}{%s}" % (letter, body))
            L.append(r"\par\vspace{3pt}")
        else:
            L.append(r"{\small\color{soft}Numeric entry.}\par\vspace{3pt}")

        if qtype == "MCQ" and "options" in q and isinstance(q.get("answer"), int):
            letter = chr(ord("A") + q["answer"])
            ans_line = r"\textbf{Answer:} (" + letter + r")"
        else:
            ans_line = r"\textbf{Answer:} " + render(str(q.get("answer", "")))
        sol = render_block(q.get("solution", ""))
        L.append(r"\vspace{2pt}\par\noindent\colorbox{boxbg}{\parbox{\dimexpr\linewidth-2\fboxsep\relax}{%")
        L.append(r"\vspace{2pt}" + ans_line + r"\par\vspace{2pt}")
        L.append(r"{\small " + sol + r"}\par\vspace{2pt}")
        L.append(r"{\footnotesize\color{soft}Handbook: " + render(q.get("handbook", "")) +
                 r" \textbullet\ " + render(q.get("references", "")) + r"}\vspace{2pt}")
        L.append(r"}}")
        L.append(r"\vspace{9pt}")

    L.append(r"\end{document}")
    return "\n".join(L)


def main():
    src = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else "materials"
    with open(src) as f:
        day = json.load(f)
    tex = build_tex(day)
    os.makedirs(outdir, exist_ok=True)
    base = "FE_Day%02d_%s" % (day["day"], re.sub(r"[^A-Za-z0-9]+", "_", day["topic"]).strip("_"))
    texpath = os.path.join(outdir, base + ".tex")
    with open(texpath, "w") as f:
        f.write(tex)
    print("Wrote", texpath)


if __name__ == "__main__":
    main()
