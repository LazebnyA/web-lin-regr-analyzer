import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, Any, List
import os
import tempfile
from fpdf import FPDF
import datetime


class ReportGenerator:
    """
    Generate reports with regression analysis results
    """

    def generate_report(
            self,
            results: Dict[str, Any],
            format_type: str,
            dependent_variable: str,
            independent_variables: List[str]
    ) -> str:
        """
        Generate a report in the specified format

        Parameters:
        -----------
        results : Dict[str, Any]
            Regression analysis results
        format_type : str
            Report format (pdf or xlsx)
        dependent_variable : str
            Name of the dependent variable
        independent_variables : List[str]
            Names of the independent variables

        Returns:
        --------
        str
            Path to the generated report file
        """
        if format_type.lower() == "pdf":
            return self._generate_pdf_report(results, dependent_variable, independent_variables)
        elif format_type.lower() == "xlsx":
            return self._generate_excel_report(results, dependent_variable, independent_variables)
        else:
            raise ValueError(f"Unsupported format: {format_type}")

    def _generate_pdf_report(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str]
    ) -> str:
        """
        Generate a PDF report
        """
        # Create visualization images
        img_paths = self._create_visualization_images(results, dependent_variable, independent_variables)

        # Create PDF
        pdf = FPDF()
        pdf.add_page()

        # Title
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "Multifactor Linear Regression Report", ln=True, align="C")
        pdf.ln(5)

        # Date
        pdf.set_font("Arial", "", 12)
        pdf.cell(0, 10, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
        pdf.ln(5)

        # Model summary
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Model Summary", ln=True)
        pdf.set_font("Arial", "", 12)
        pdf.cell(0, 10, f"Dependent Variable: {dependent_variable}", ln=True)
        pdf.cell(0, 10, f"Independent Variables: {', '.join(independent_variables)}", ln=True)
        pdf.cell(0, 10, f"R-squared: {results['r_squared']:.4f}", ln=True)
        pdf.cell(0, 10, f"Mean Squared Error: {results['mse']:.4f}", ln=True)
        pdf.ln(5)

        # Coefficients
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, "Regression Coefficients", ln=True)
        pdf.set_font("Arial", "", 12)
        pdf.cell(40, 10, "Variable", border=1)
        pdf.cell(40, 10, "Coefficient", border=1)
        pdf.cell(40, 10, "P-value", border=1)
        pdf.cell(40, 10, "Significant", border=1)
        pdf.ln()

        # Intercept
        pdf.cell(40, 10, "Intercept", border=1)
        pdf.cell(40, 10, f"{results['intercept']:.4f}", border=1)
        pdf.cell(40, 10, "N/A", border=1)
        pdf.cell(40, 10, "N/A", border=1)
        pdf.ln()

        # Other coefficients
        for var, coef in results["coefficients"].items():
            p_value = results["p_values"].get(var, 0)
            is_significant = "Yes" if p_value < 0.05 else "No"
            pdf.cell(40, 10, str(var), border=1)
            pdf.cell(40, 10, f"{coef:.4f}", border=1)
            pdf.cell(40, 10, f"{p_value:.4f}", border=1)
            pdf.cell(40, 10, is_significant, border=1)
            pdf.ln()

        pdf.ln(10)

        # Add visualizations
        for img_path, title in img_paths:
            pdf.add_page()
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 10, title, ln=True)
            pdf.image(img_path, x=10, y=30, w=190)

        # Save PDF to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf").name
        pdf.output(temp_file)

        # Clean up image files
        for img_path, _ in img_paths:
            if os.path.exists(img_path):
                os.remove(img_path)

        return temp_file

    def _generate_excel_report(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str]
    ) -> str:
        """
        Generate an Excel report
        """
        # Create a temporary Excel file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx").name

        # Create Excel writer
        with pd.ExcelWriter(temp_file, engine='xlsxwriter') as writer:
            # Summary sheet
            summary_data = {
                "Metric": ["Dependent Variable", "Independent Variables", "R-squared", "MSE", "Intercept"],
                "Value": [
                    dependent_variable,
                    ", ".join(independent_variables),
                    results["r_squared"],
                    results["mse"],
                    results["intercept"]
                ]
            }
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name="Summary", index=False)

            # Coefficients sheet
            coef_data = []
            for var, coef in results["coefficients"].items():
                p_value = results["p_values"].get(var, 0)
                is_significant = "Yes" if p_value < 0.05 else "No"
                coef_data.append({
                    "Variable": var,
                    "Coefficient": coef,
                    "P-value": p_value,
                    "Significant": is_significant
                })
            coef_df = pd.DataFrame(coef_data)
            coef_df.to_excel(writer, sheet_name="Coefficients", index=False)

            # Predicted vs Actual sheet
            pred_actual_df = pd.DataFrame(results["predicted_vs_actual"])
            pred_actual_df.to_excel(writer, sheet_name="Predicted vs Actual", index=False)

            # Residuals sheet
            residuals_df = pd.DataFrame(results["residuals"])
            residuals_df.to_excel(writer, sheet_name="Residuals", index=False)

            # Correlation Matrix sheet
            corr_df = pd.DataFrame(results["correlation_matrix"])
            corr_df.to_excel(writer, sheet_name="Correlation Matrix")

        return temp_file

    def _create_visualization_images(
            self,
            results: Dict[str, Any],
            dependent_variable: str,
            independent_variables: List[str]
    ) -> List[tuple]:
        """
        Create visualization images for the report

        Returns:
        --------
        List[tuple]
            List of tuples (image_path, title)
        """
        image_paths = []

        # Actual vs Predicted
        plt.figure(figsize=(10, 6))
        pred_actual = pd.DataFrame(results["predicted_vs_actual"])
        plt.scatter(pred_actual["actual"], pred_actual["predicted"])
        plt.plot([pred_actual["actual"].min(), pred_actual["actual"].max()],
                 [pred_actual["actual"].min(), pred_actual["actual"].max()],
                 'k--', lw=2)
        plt.xlabel("Actual Values")
        plt.ylabel("Predicted Values")
        plt.title(f"Actual vs Predicted Values for {dependent_variable}")
        plt.grid(True)

        # Save figure to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png").name
        plt.savefig(temp_file, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((temp_file, "Actual vs Predicted Values"))

        # Residuals Plot
        plt.figure(figsize=(10, 6))
        residuals = pd.DataFrame(results["residuals"])
        plt.scatter(pred_actual["predicted"], residuals["residual"])
        plt.axhline(y=0, color='r', linestyle='-')
        plt.xlabel("Predicted Values")
        plt.ylabel("Residuals")
        plt.title("Residuals vs Predicted Values")
        plt.grid(True)

        # Save figure to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png").name
        plt.savefig(temp_file, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((temp_file, "Residuals Plot"))

        # Correlation Heatmap
        plt.figure(figsize=(10, 8))
        corr_matrix = pd.DataFrame(results["correlation_matrix"])
        sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", vmin=-1, vmax=1)
        plt.title("Correlation Matrix")

        # Save figure to temp file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png").name
        plt.savefig(temp_file, dpi=300, bbox_inches="tight")
        plt.close()
        image_paths.append((temp_file, "Correlation Heatmap"))

        return image_paths