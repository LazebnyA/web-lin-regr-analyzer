import subprocess

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, List, Tuple
import os
import tempfile
import datetime
import matplotlib as mpl
import matplotlib.font_manager as fm
import shutil

# Налаштування шрифтів для matplotlib, які підтримують кирилицю
# Спроба знайти шрифт, що підтримує кирилицю
cyrillic_fonts = [f.name for f in fm.fontManager.ttflist if
                  'DejaVu' in f.name or 'Liberation' in f.name or 'Ubuntu' in f.name or 'Arial' in f.name]
if cyrillic_fonts:
    mpl.rcParams['font.family'] = cyrillic_fonts[0]
else:
    mpl.rcParams['font.family'] = 'DejaVu Sans'

# Налаштування для підтримки UTF-8 в matplotlib
plt.rcParams['pdf.fonttype'] = 42
plt.rcParams['ps.fonttype'] = 42


class ReportGenerator:
    """
    Генерація звітів з результатами регресійного аналізу використовуючи LaTeX
    """

    def generate_report(
            self,
            results: Dict[str, Any],
            format_type: str,
            dependent_variable: str,
            independent_variables: List[str],
            output_path: str = None
    ) -> str:
        """
        Згенерувати звіт у вказаному форматі

        Параметри:
        -----------
        results : Dict[str, Any]
            Результати регресійного аналізу
        format_type : str
            Формат звіту (pdf, tex або xlsx)
        dependent_variable : str
            Назва залежної змінної
        independent_variables : List[str]
            Назви незалежних змінних
        output_path : str, optional
            Шлях для збереження файлу. Якщо не вказано, буде створено шлях за замовчуванням.

        Повертає:
        --------
        str
            Шлях до згенерованого файлу звіту
        """
        if format_type.lower() == "tex":
            return self._generate_latex_file(results, dependent_variable, independent_variables, output_path)
        elif format_type.lower() == "pdf":
            return self._generate_pdf_file(results, dependent_variable, independent_variables, output_path)
        elif format_type.lower() == "xlsx":
            return self._generate_excel_report(results, dependent_variable, independent_variables, output_path)
        else:
            raise ValueError(f"Непідтримуваний формат: {format_type}")

    def _generate_pdf_file(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str],
            output_path: str = None
    ) -> str:
        """
        Згенерувати PDF файл із результатами регресійного аналізу

        Повертає:
        --------
        str
            Шлях до згенерованого PDF файлу
        """
        # Визначення імені файлу та директорій
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_dir = os.path.join(os.getcwd(), f"temp_latex_{timestamp}")
        os.makedirs(temp_dir, exist_ok=True)

        # Визначення шляху для збереження PDF файлу
        if output_path is None:
            output_dir = os.getcwd()
            output_filename = f"regression_report_{timestamp}.pdf"
            output_path = os.path.join(output_dir, output_filename)
        else:
            output_dir = os.path.dirname(output_path)
            output_filename = os.path.basename(output_path)

        # Перевірка розширення файлу
        if not output_path.lower().endswith('.pdf'):
            output_path = f"{output_path}.pdf"

        # Створення імені для проміжного файлу LaTeX
        tex_filename = os.path.splitext(output_filename)[0] + ".tex"
        tex_path = os.path.join(temp_dir, tex_filename)

        try:
            # Створення зображень для графіків
            img_paths = self._create_visualization_images(results, dependent_variable, independent_variables, temp_dir)

            # Створення LaTeX документу з оновленими пакетами
            latex_content = self._create_latex_content_updated(results, dependent_variable, independent_variables,
                                                               img_paths)

            # Збереження LaTeX вмісту в файл
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_content)

            # Компіляція LaTeX файлу в PDF
            current_dir = os.getcwd()
            os.chdir(temp_dir)  # Змінюємо поточну директорію на тимчасову для коректної компіляції

            # Запуск pdflatex двічі для правильної обробки посилань
            for _ in range(2):
                process = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", tex_filename],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=False
                )

                # Перевірка на помилки
                if process.returncode != 0:
                    print(f"Помилка при компіляції LaTeX в PDF: {process.stderr}")
                    # Продовжуємо, незважаючи на помилки, щоб спробувати створити PDF

            os.chdir(current_dir)  # Повертаємось до вихідної директорії

            # Перевірка, чи був створений PDF
            compiled_pdf_path = os.path.join(temp_dir, os.path.splitext(tex_filename)[0] + ".pdf")
            if not os.path.exists(compiled_pdf_path):
                raise RuntimeError(f"PDF файл не було створено при компіляції LaTeX")

            # Копіювання PDF файлу до кінцевого шляху
            shutil.copy(compiled_pdf_path, output_path)

            return output_path

        except Exception as e:
            raise RuntimeError(f"Помилка при створенні PDF файлу: {str(e)}")

        # finally:
            # Видалення створеного тимчасового каталогу після завершення всіх операцій
            # if os.path.exists(temp_dir):
            #     shutil.rmtree(temp_dir)

    def _generate_latex_file(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str],
            output_path: str = None
    ) -> str:
        """Згенерувати LaTeX файл без компіляції в PDF"""
        # Створення власного тимчасового каталогу замість використання tempfile
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_dir = os.path.join(os.getcwd(), f"temp_latex_{timestamp}")
        os.makedirs(temp_dir, exist_ok=True)

        try:
            # Створення зображень для графіків
            img_paths = self._create_visualization_images(results, dependent_variable, independent_variables, temp_dir)

            # Створення LaTeX документу з оновленими пакетами
            latex_content = self._create_latex_content_updated(results, dependent_variable, independent_variables,
                                                               img_paths)

            # Визначення шляху для збереження LaTeX файлу
            if output_path is None:
                output_path = os.path.join(os.getcwd(),
                                           f"regression_report_{timestamp}.tex")

            # Збереження LaTeX вмісту в файл
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(latex_content)

            # Копіювання зображень в каталог з .tex файлом
            output_dir = os.path.dirname(output_path)
            for img_path, _ in img_paths:
                img_name = os.path.basename(img_path)
                shutil.copy(img_path, os.path.join(output_dir, img_name))

            return output_path

        finally:
            # Видалення створеного тимчасового каталогу після завершення всіх операцій
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

    import os
    import pandas as pd
    from typing import Dict, Any, List

    def _create_latex_content_updated(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str],
            img_paths: List[Tuple[str, str]]
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

   \renewcommand{\arraystretch}{1.5} % Increase row height by 50%
    \begin{center}
    \begin{tabular}{lccc}
    \toprule
    \textbf{Змінна} & \textbf{Коефіцієнт} & \textbf{P-значення} & \textbf{Значущість (p < 0.05)} \\
     & \textbf{[95\% довірчий інтервал]} & & \\
    \midrule
    Вільний член & """ + f"{results['intercept']:.4f}" + r""" & Н/Д & Н/Д \\
     & """ + f"[{results['intercept_confidence_interval']['lower']:.4f}, {results['intercept_confidence_interval']['upper']:.4f}]" + r""" & & \\
    """
        # Додавання коефіцієнтів регресії
        for var, coef in results["coefficients"].items():
            p_value = results["p_values"].get(var, 0)
            p_value_str = f"{p_value:.4e}" if p_value < 0.0001 else f"{p_value:.4f}"
            is_significant = "Так" if p_value < 0.05 else "Ні"
            conf_int = results["confidence_intervals"].get(var, {"lower": 0, "upper": 0})
            conf_int_str = f"[{conf_int['lower']:.4f}, {conf_int['upper']:.4f}]"
            latex_content += f"{var} & {coef:.4f} & {p_value_str} & {is_significant} \\\\\n"
            latex_content += f" & {conf_int_str} & & \\\\\n"
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

    \section{Інтерпретація результатів}

    Дана модель багатофакторної лінійної регресії показує залежність змінної \textbf{""" + dependent_variable + r"""} від змінних """ + ", ".join(
            [f"\\textbf{{{var}}}" for var in independent_variables]) + r""".

    Коефіцієнт детермінації $R^2$ дорівнює """ + f"{results['r_squared']:.4f}" + rf""", що означає, що {results['r_squared'] * 100:.1f}\% варіації залежної змінної пояснюється включеними у модель незалежними змінними.

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

    def _create_visualization_images(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str],
            output_dir: str
    ) -> List[tuple]:
        """
        Створити зображення візуалізацій для звіту

        Повертає:
        --------
        List[tuple]
            Список кортежів (шлях_до_зображення, заголовок)
        """
        image_paths = []

        # Налаштування шрифту для підтримки кирилиці в matplotlib
        plt.rcParams['font.family'] = 'DejaVu Sans'
        plt.rcParams['pdf.fonttype'] = 42
        plt.rcParams['ps.fonttype'] = 42

        # Фактичні проти передбачених
        plt.figure(figsize=(10, 6))
        pred_actual = pd.DataFrame(results["predicted_vs_actual"])
        plt.scatter(pred_actual["actual"], pred_actual["predicted"], alpha=0.7)
        min_val = min(pred_actual["actual"].min(), pred_actual["predicted"].min())
        max_val = max(pred_actual["actual"].max(), pred_actual["predicted"].max())
        plt.plot([min_val, max_val], [min_val, max_val], 'k--', lw=2)
        plt.xlabel("Фактичні значення")
        plt.ylabel("Передбачені значення")
        plt.title(f"Фактичні проти передбачених значень для {dependent_variable}")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "actual_vs_predicted.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Фактичні проти передбачених значень"))

        # Графік залишків
        plt.figure(figsize=(10, 6))
        residuals = pd.DataFrame(results["residuals"])
        plt.scatter(pred_actual["predicted"], residuals["residual"], alpha=0.7)
        plt.axhline(y=0, color='r', linestyle='-')
        plt.xlabel("Передбачені значення")
        plt.ylabel("Залишки")
        plt.title("Залишки проти передбачених значень")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "residuals.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Графік залишків"))

        # Нормальний Q-Q графік залишків
        plt.figure(figsize=(10, 6))
        from scipy import stats
        stats.probplot(residuals["residual"], plot=plt)
        plt.title("Q-Q графік залишків")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "qq_plot.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Нормальний Q-Q графік залишків"))

        # Теплова карта кореляцій (коеф. Пірсона)
        plt.figure(figsize=(10, 8))
        corr_matrix = pd.DataFrame(results["correlation_matrix"])
        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
        cmap = sns.diverging_palette(230, 20, as_cmap=True)
        sns.heatmap(corr_matrix, mask=mask, annot=True, cmap=cmap, vmin=-1, vmax=1,
                    square=True, linewidths=.5, fmt=".2f", center=0)
        plt.title("Матриця кореляцій (коеф. Пірсона)")
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "correlation_heatmap.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Теплова карта кореляцій (коеф. Пірсона)"))

        # Теплова карта кореляцій (коеф. Спірмена)
        plt.figure(figsize=(10, 8))
        corr_matrix = pd.DataFrame(results["spearman_correlation"])
        mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
        cmap = sns.diverging_palette(230, 20, as_cmap=True)
        sns.heatmap(corr_matrix, mask=mask, annot=True, cmap=cmap, vmin=-1, vmax=1,
                    square=True, linewidths=.5, fmt=".2f", center=0)
        plt.title("Матриця кореляцій (коеф. Спірмена)")
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "correlation_heatmap_spearman.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Теплова карта кореляцій (коеф. Спірмена)"))

        # Гістограма залишків
        plt.figure(figsize=(10, 6))
        sns.histplot(residuals["residual"], kde=True)
        plt.xlabel("Залишки")
        plt.ylabel("Частота")
        plt.title("Розподіл залишків")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        # Збереження зображення
        img_path = os.path.join(output_dir, "residuals_hist.png")
        plt.savefig(img_path, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((img_path, "Гістограма залишків"))

        return image_paths

    def _generate_excel_report(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str],
            output_path: str = None
    ) -> str:
        """
        Згенерувати звіт Excel
        """
        # Визначення шляху для збереження Excel файлу
        if output_path is None:
            output_path = os.path.join(os.getcwd(),
                                       f"regression_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")

        # Створення Excel writer
        with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
            # Аркуш зведення
            summary_data = {
                "Показник": ["Залежна змінна", "Незалежні змінні", "R²", "Середньоквадратична похибка", "Вільний член"],
                "Значення": [
                    dependent_variable,
                    ", ".join(independent_variables),
                    results["r_squared"],
                    results["mse"],
                    results["intercept"]
                ]
            }
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name="Результати", index=False)

            # Аркуш коефіцієнтів
            coef_data = []
            for var, coef in results["coefficients"].items():
                p_value = results["p_values"].get(var, 0)
                is_significant = "Так" if p_value < 0.05 else "Ні"
                coef_data.append({
                    "Змінна": var,
                    "Коефіцієнт": coef,
                    "P-значення": p_value,
                    "Статистична значущість": is_significant
                })
            coef_df = pd.DataFrame(coef_data)
            coef_df.to_excel(writer, sheet_name="Коефіцієнти", index=False)

            # Аркуш передбачених проти фактичних значень
            pred_actual_df = pd.DataFrame(results["predicted_vs_actual"])
            # Перейменування стовпців на українську мову
            renamed_pred_actual = pred_actual_df.rename(columns={
                "actual": "фактичні",
                "predicted": "передбачені"
            })
            renamed_pred_actual.to_excel(writer, sheet_name="Передбачені проти фактичних", index=False)

            # Аркуш залишків
            residuals_df = pd.DataFrame(results["residuals"])
            # Перейменування стовпців на українську мову
            renamed_residuals = residuals_df.rename(columns={
                "residual": "залишок"
            })
            renamed_residuals.to_excel(writer, sheet_name="Залишки", index=False)

            # Аркуш кореляційної матриці
            corr_df = pd.DataFrame(results["correlation_matrix"])
            corr_df.to_excel(writer, sheet_name="Матриця кореляцій")

        return output_path