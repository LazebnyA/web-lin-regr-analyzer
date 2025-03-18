import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from sklearn.preprocessing import StandardScaler
from pandas.api.types import is_numeric_dtype


class DataProcessor:
    """
    Processing and preparing data for regression analysis
    """

    def prepare_data(
            self,
            df: pd.DataFrame,
            dependent_variable: str,
            independent_variables: List[str]
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for regression analysis

        Parameters:
        -----------
        df : pd.DataFrame
            Input data frame
        dependent_variable : str
            Name of the dependent variable column
        independent_variables : List[str]
            Names of the independent variable columns

        Returns:
        --------
        Tuple[pd.DataFrame, pd.Series]
            Prepared X and y data
        """
        # Check if all specified columns exist
        all_vars = independent_variables + [dependent_variable]
        missing_cols = [col for col in all_vars if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columns not found in dataset: {', '.join(missing_cols)}")

        # Check for non-numeric columns and handle them
        for col in all_vars:
            if not is_numeric_dtype(df[col]):
                raise ValueError(f"Column {col} is not numeric")

        # Check for missing values
        if df[all_vars].isna().any().any():
            # Handle missing values by mean imputation
            df[all_vars] = df[all_vars].fillna(df[all_vars].mean())

        # Extract X and y
        X = df[independent_variables].copy()
        y = df[dependent_variable].copy()

        return X, y

    def normalize_data(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize features using StandardScaler

        Parameters:
        -----------
        X : pd.DataFrame
            Independent variables

        Returns:
        --------
        pd.DataFrame
            Normalized independent variables
        """
        scaler = StandardScaler()
        X_scaled = pd.DataFrame(
            scaler.fit_transform(X),
            columns=X.columns,
            index=X.index
        )
        return X_scaled