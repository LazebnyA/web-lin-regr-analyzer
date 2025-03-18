from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

class RegressionInput(BaseModel):
    session_id: str
    dependent_variable: str
    independent_variables: List[str]
    report_format: Optional[str] = "pdf"  # pdf or xlsx

class CoefficientInfo(BaseModel):
    variable: str
    value: float
    p_value: float
    significance: bool

class RegressionResult(BaseModel):
    coefficients: Dict[str, float]
    intercept: float
    r_squared: float
    mse: float
    p_values: Dict[str, float]
    predicted_vs_actual: List[Dict[str, float]]
    residuals: List[Dict[str, float]]
    correlation_matrix: Dict[str, Dict[str, float]]