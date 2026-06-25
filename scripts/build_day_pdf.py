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
    "·": ("$\\cdot$", "\\cdot"),
    "½": ("$\\tfrac{1}{2}$", "\\tfrac{1}{2}"),
    "√": ("$\\surd$", "\\surd"),
    "α": ("$\\alpha$", "\\alpha"),
    "β": ("$\\beta$", "\\beta"),
    "Δ": ("$\\Delta$", "\\Delta"),
    "μ": ("$\\mu$", "\\mu"),
    "ρ": ("$\\rho$", "\\rho"),
    "γ": ("$\\gamma$", "\\gamma"),
    "π": ("$\\pi$", "\\pi"),
    "θ": ("$\\theta$", "\\theta"),
    "ε": ("$\\varepsilon$", "\\varepsilon"),
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


def render(s):
    """Render a mixed text/math string: split on $...$, escape text, keep math."""
    if s is None:
        return ""
    parts = re.split(r"(\$[^$]*\$)", str(s))
    res = []
    for p in parts:
        if len(p) >= 2 and p.startswith("$") and p.endswith("$"):
            res.append("$" + fix_math(p[1:-1]) + "$")
        else:
            res.append(esc_text(p))
    return "".join(res)


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
        L.append(render(q.get("stem", "")) + r"\par\vspace{3pt}")

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
        sol = render(q.get("solution", ""))
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
