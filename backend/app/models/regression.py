import numpy as np
import pandas as pd
import statsmodels.api as sm
from sklearn.metrics import mean_squared_error
from typing import Dict, Any, List, Tuple


class LinearRegression:
    """
    Implementation of multifactor linear regression
    """

    def __init__(self):
        self.model = None
        self.X = None
        self.y = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
        """
        Fit the regression model and return comprehensive results

        Parameters:
        -----------
        X : pd.DataFrame
            Independent variables
        y : pd.Series
            Dependent variable

        Returns:
        --------
        Dict[str, Any]
            Dictionary with model results
        """
        # Store data
        self.X = X
        self.y = y

        # Add constant for intercept
        X_with_const = sm.add_constant(X)

        # Fit the model
        self.model = sm.OLS(y, X_with_const).fit()

        # Make predictions
        y_pred = self.model.predict(X_with_const)

        # Calculate MSE
        mse = mean_squared_error(y, y_pred)

        # Create a dataframe with actual vs predicted values
        pred_vs_actual = pd.DataFrame({
            'actual': y,
            'predicted': y_pred,
            'residual': y - y_pred
        })

        # Correlation matrix including dependent variable
        all_data = pd.concat([X, y], axis=1)
        correlation_matrix = all_data.corr()

        # Extract coefficients with indices as variable names
        coefficients = self.model.params[1:].to_dict()  # Skip constant/intercept
        intercept = self.model.params[0]

        # Extract p-values
        p_values = self.model.pvalues[1:].to_dict()  # Skip constant/intercept

        # Extract R-squared
        r_squared = self.model.rsquared

        return {
            "coefficients": coefficients,
            "intercept": intercept,
            "r_squared": r_squared,
            "mse": mse,
            "p_values": p_values,
            "predicted_vs_actual": pred_vs_actual,
            "residuals": pred_vs_actual[['residual']],
            "correlation_matrix": correlation_matrix,
            "model_summary": self.model.summary()
        }

    def predict(self, X_new: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the fitted model

        Parameters:
        -----------
        X_new : pd.DataFrame
            New independent variables

        Returns:
        --------
        np.ndarray
            Predicted values
        """
        if self.model is None:
            raise ValueError("Model not fitted yet")

        # Add constant for intercept
        X_new_with_const = sm.add_constant(X_new)

        # Make predictions
        return self.model.predict(X_new_with_const)