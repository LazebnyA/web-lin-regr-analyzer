from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import pandas as pd
import os
from app.schemas.models import RegressionInput, RegressionResult
from app.services.data_processor import DataProcessor
from app.models.regression import LinearRegression
from app.services.report import ReportGenerator
import time
import io

router = APIRouter(prefix="/api", tags=["regression"])


@router.post("/upload-csv", response_model=dict)
async def upload_csv_file(file: UploadFile = File(...)):
    """
    Upload a CSV file with data for regression analysis
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel")

    # Save the uploaded file to a temporary location
    content = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:  # Excel file
            df = pd.read_excel(io.BytesIO(content))

        # Get column names for frontend display
        columns = df.columns.tolist()

        # Create a unique ID for this session
        session_id = f"session_{int(time.time())}"

        upload_dir = r'\tmp'

        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)

        # Save the dataframe to a temp file
        temp_file = f"/tmp/{session_id}.pkl"
        df.to_pickle(temp_file)

        return {
            "status": "success",
            "message": "File uploaded successfully",
            "session_id": session_id,
            "columns": columns,
            "rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/analyze", response_model=RegressionResult)
async def analyze_data(regression_input: RegressionInput):
    """
    Perform regression analysis based on the provided parameters
    """
    try:
        # Retrieve the data from the temp file
        temp_file = f"/tmp/{regression_input.session_id}.pkl"
        if not os.path.exists(temp_file):
            raise HTTPException(status_code=400, detail="Session expired or invalid")

        df = pd.read_pickle(temp_file)

        # Process data
        data_processor = DataProcessor()
        X, y = data_processor.prepare_data(
            df,
            regression_input.dependent_variable,
            regression_input.independent_variables
        )

        # Create and fit regression model
        model = LinearRegression()
        results = model.fit(X, y)

        # Return the results
        return {
            "coefficients": results["coefficients"],
            "intercept": results["intercept"],
            "r_squared": results["r_squared"],
            "mse": results["mse"],
            "p_values": results["p_values"],
            "predicted_vs_actual": results["predicted_vs_actual"].to_dict(orient="records"),
            "residuals": results["residuals"].to_dict(orient="records"),
            "correlation_matrix": results["correlation_matrix"].to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during analysis: {str(e)}")


@router.post("/generate-report")
async def generate_report(background_tasks: BackgroundTasks, regression_input: RegressionInput):
    """
    Generate a PDF or Excel report with the regression results
    """
    try:
        # Retrieve the data
        temp_file = f"/tmp/{regression_input.session_id}.pkl"
        if not os.path.exists(temp_file):
            raise HTTPException(status_code=400, detail="Session expired or invalid")

        df = pd.read_pickle(temp_file)

        # Process data
        data_processor = DataProcessor()
        X, y = data_processor.prepare_data(
            df,
            regression_input.dependent_variable,
            regression_input.independent_variables
        )

        # Create and fit regression model
        model = LinearRegression()
        results = model.fit(X, y)

        # Generate report
        report_generator = ReportGenerator()
        report_file = report_generator.generate_report(
            results,
            regression_input.report_format,
            regression_input.dependent_variable,
            regression_input.independent_variables
        )

        # Background task to clean up the file after some time
        background_tasks.add_task(lambda x: os.remove(report_file) if os.path.exists(report_file) else None, 300)

        return FileResponse(
            path=report_file,
            filename=f"regression_report.{regression_input.report_format}",
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")