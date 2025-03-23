import os
import pandas as pd
from typing import Dict, Any, List


def _create_latex_content_updated(
        self,
        results: Dict[str, Any],
        dependent_variable: str,
        independent_variables: List[str],
        img_paths: List[tuple]
) -> str:
    """Створити LaTeX вміст для звіту з оновленими пакетами"""

    latex_content = r"""
\documentclass{article}
\usepackage{amsmath, amssymb}
\usepackage[T2A]{fontenc} % Cyrillic font encoding
\usepackage[utf8]{inputenc} % UTF-8 input encoding
\usepackage{paratype} % PT Serif/Sans fonts with good Cyrillic support
\usepackage[ukrainian]{babel} % Ukrainian language support
\usepackage[a4paper, margin=2.5cm]{geometry}
\usepackage{mathtools}
\usepackage{xcolor}
\usepackage{graphicx}
\usepackage{float}
\usepackage{enumitem}
\usepackage{tikz}
\usetikzlibrary{matrix}
\usepackage{amsthm}
\usepackage{booktabs}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage{array}
\usepackage{longtable}
\usepackage{siunitx}

\titleformat{\section}{\Large\bfseries}{\thesection}{1em}{}
\titleformat{\subsection}{\large\bfseries}{\thesubsection}{1em}{}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[C]{\textbf{Звіт багатофакторної лінійної регресії}}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}

\begin{document}

\begin{center}
\Large\textbf{Звіт багатофакторної лінійної регресії}
\end{center}

\vspace{1cm}

\textbf{Дата:} \today

\vspace{0.5cm}

\section{Опис моделі}

\begin{itemize}
   \item Залежна змінна: \textbf{""" + dependent_variable + r"""}
   \item Незалежні змінні: \textbf{""" + ", ".join(independent_variables) + r"""}
   \item Коефіцієнт детермінації $R^2$: \textbf{""" + f"{results['r_squared']:.4f}" + r"""}
   \item Середньоквадратична похибка: \textbf{""" + f"{results['mse']:.4f}" + r"""}
\end{itemize}

\vspace{0.5cm}

\section{Коефіцієнти регресії}

\begin{center}
\begin{tabular}{lcccc}
\toprule
\textbf{Змінна} & \textbf{Коефіцієнт} & \textbf{P-значення} & \textbf{Значущість (p < 0.05)} \\
\midrule
Вільний член & """ + f"{results['intercept']:.4f}" + r""" & Н/Д & Н/Д \\
"""
    # Додавання коефіцієнтів регресії
    for var, coef in results["coefficients"].items():
        p_value = results["p_values"].get(var, 0)
        is_significant = "Так" if p_value < 0.05 else "Ні"
        latex_content += f"{var} & {coef:.4f} & {p_value:.4f} & {is_significant} \\\\\n"
    latex_content += r"""
\bottomrule
\end{tabular}
\end{center}

\vspace{1cm}
"""
    # Додавання зображень
    for img_path, title in img_paths:
        img_filename = os.path.basename(img_path)
        latex_content += r"""
\begin{figure}[H]
   \centering
   \includegraphics[width=0.8\textwidth]{""" + img_filename + r"""}
   \caption{""" + title + r"""}
   \label{fig:""" + title.lower().replace(" ", "_") + r"""}
\end{figure}

\vspace{0.5cm}
"""
    # Кореляційна матриця
    latex_content += r"""
\section{Кореляційна матриця}

\begin{center}
\begin{tabular}{l"""
    # Додаємо стовпці для таблиці залежно від кількості колонок
    corr_matrix = pd.DataFrame(results["correlation_matrix"])
    for _ in range(len(corr_matrix.columns)):
        latex_content += "c"
    latex_content += r"""}
\toprule
& """ + " & ".join(corr_matrix.columns) + r""" \\
\midrule
"""
    # Додавання даних кореляційної матриці
    for idx, row in corr_matrix.iterrows():
        latex_content += f"{idx}"
        for val in row:
            if abs(val) > 0.7:
                if val > 0:
                    latex_content += f" & \\textcolor{{blue}}{{{val:.2f}}}"
                else:
                    latex_content += f" & \\textcolor{{red}}{{{val:.2f}}}"
            else:
                latex_content += f" & {val:.2f}"
        latex_content += r" \\" + "\n"
    latex_content += r"""
\bottomrule
\end{tabular}
\end{center}

\vspace{0.5cm}

\section{Інтерпретація результатів}

Дана модель багатофакторної лінійної регресії показує залежність змінної \textbf{""" + dependent_variable + r"""} від змінних """ + ", ".join(
        [f"\\textbf{{{var}}}" for var in independent_variables]) + r""".

Коефіцієнт детермінації $R^2$ дорівнює """ + f"{results['r_squared']:.4f}" + r""", що означає, що {results['r_squared'] * 100:.1f}\% варіації залежної змінної пояснюється включеними у модель незалежними змінними.

Середньоквадратична похибка (MSE) становить """ + f"{results['mse']:.4f}" + r""", що є мірою середнього квадратичного відхилення спостережуваних значень від передбачених.

\vspace{0.5cm}

\section{Висновки}

Результати аналізу показують, що модель має """ + (
                         "достатню" if results['r_squared'] > 0.7 else "помірну" if results[
                                                                                        'r_squared'] > 0.5 else "низьку"
                     ) + r""" пояснювальну здатність.
"""
    significant_coefs = []
    for var, coef in results["coefficients"].items():
        p_value = results["p_values"].get(var, 0)
        if p_value < 0.05:
            significant_coefs.append((var, coef))
    if significant_coefs:
        sorted_significant_coefs = sorted(significant_coefs, key=lambda x: abs(x[1]), reverse=True)
        latex_content += r"""
Найбільший вплив на залежну змінну мають фактори:
\begin{itemize}
"""
        for var, coef in sorted_significant_coefs[:3]:
            sign = "збільшує" if coef > 0 else "зменшує"
            latex_content += f"    \\item \\textbf{{{var}}}: {sign} значення залежної змінної на {abs(coef):.4f} одиниць при зміні на одну одиницю\n"
        latex_content += r"""\end{itemize}
"""
    else:
        latex_content += r"""
Аналіз не виявив статистично значущих факторів (p < 0.05), що впливають на залежну змінну.
"""
    latex_content += r"""
\end{document}
"""
    return latex_content
