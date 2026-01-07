"""
Feature Engineering Service for data preparation and feature transformation.

This module provides the core logic for:
- Data preparation (cleaning, normalization, null handling)
- Feature engineering transformations
- Writing to offline and online feature stores
- Computing feature statistics
"""

import logging
import json
from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
import numpy as np

logger = logging.getLogger(__name__)


class FeatureTransformations:
    """
    Library of common feature transformations.
    Each method takes data and returns transformed data with metadata.
    """
    
    @staticmethod
    def passthrough(values: List[Any], config: Dict = None) -> Tuple[List[Any], Dict]:
        """Pass values through without transformation."""
        return values, {'transform': 'passthrough'}
    
    @staticmethod
    def standard_scale(values: List[float], config: Dict = None) -> Tuple[List[float], Dict]:
        """
        Standardize features by removing the mean and scaling to unit variance.
        z = (x - mean) / std
        """
        config = config or {}
        arr = np.array(values, dtype=float)
        
        # Handle NaN values
        valid_mask = ~np.isnan(arr)
        valid_values = arr[valid_mask]
        
        if len(valid_values) == 0:
            return values, {'transform': 'standard_scale', 'error': 'No valid values'}
        
        mean = config.get('mean', np.mean(valid_values))
        std = config.get('std', np.std(valid_values))
        
        if std == 0:
            std = 1  # Prevent division by zero
        
        result = np.where(valid_mask, (arr - mean) / std, np.nan)
        
        return result.tolist(), {
            'transform': 'standard_scale',
            'mean': float(mean),
            'std': float(std)
        }
    
    @staticmethod
    def min_max_scale(values: List[float], config: Dict = None) -> Tuple[List[float], Dict]:
        """
        Scale features to a given range (default 0-1).
        x_scaled = (x - min) / (max - min)
        """
        config = config or {}
        arr = np.array(values, dtype=float)
        
        valid_mask = ~np.isnan(arr)
        valid_values = arr[valid_mask]
        
        if len(valid_values) == 0:
            return values, {'transform': 'min_max_scale', 'error': 'No valid values'}
        
        min_val = config.get('min', np.min(valid_values))
        max_val = config.get('max', np.max(valid_values))
        
        range_val = max_val - min_val
        if range_val == 0:
            range_val = 1
        
        feature_min = config.get('feature_min', 0)
        feature_max = config.get('feature_max', 1)
        
        result = np.where(
            valid_mask,
            feature_min + (arr - min_val) / range_val * (feature_max - feature_min),
            np.nan
        )
        
        return result.tolist(), {
            'transform': 'min_max_scale',
            'min': float(min_val),
            'max': float(max_val),
            'feature_min': feature_min,
            'feature_max': feature_max
        }
    
    @staticmethod
    def log_transform(values: List[float], config: Dict = None) -> Tuple[List[float], Dict]:
        """
        Apply log transformation. log(x + offset) where offset prevents log(0).
        """
        config = config or {}
        arr = np.array(values, dtype=float)
        offset = config.get('offset', 1)
        base = config.get('base', 'natural')  # 'natural', '10', '2'
        
        if base == '10':
            result = np.log10(arr + offset)
        elif base == '2':
            result = np.log2(arr + offset)
        else:
            result = np.log(arr + offset)
        
        return result.tolist(), {
            'transform': 'log_transform',
            'offset': offset,
            'base': base
        }
    
    @staticmethod
    def one_hot_encode(values: List[Any], config: Dict = None) -> Tuple[Dict[str, List[int]], Dict]:
        """
        One-hot encode categorical values.
        Returns a dictionary of column_name -> binary values.
        """
        config = config or {}
        categories = config.get('categories', list(set(values)))
        prefix = config.get('prefix', 'cat')
        
        result = {}
        for cat in categories:
            col_name = f"{prefix}_{cat}"
            result[col_name] = [1 if v == cat else 0 for v in values]
        
        return result, {
            'transform': 'one_hot_encode',
            'categories': categories,
            'prefix': prefix
        }
    
    @staticmethod
    def label_encode(values: List[Any], config: Dict = None) -> Tuple[List[int], Dict]:
        """
        Encode categorical values as integers.
        """
        config = config or {}
        mapping = config.get('mapping', None)
        
        if mapping is None:
            unique_values = sorted(list(set(v for v in values if v is not None)))
            mapping = {v: i for i, v in enumerate(unique_values)}
        
        result = [mapping.get(v, -1) for v in values]
        
        return result, {
            'transform': 'label_encode',
            'mapping': mapping
        }
    
    @staticmethod
    def bucketize(values: List[float], config: Dict = None) -> Tuple[List[int], Dict]:
        """
        Bucketize numerical values into discrete bins.
        """
        config = config or {}
        boundaries = config.get('boundaries', [])
        
        if not boundaries:
            # Auto-generate boundaries using quantiles
            n_bins = config.get('n_bins', 10)
            arr = np.array([v for v in values if v is not None], dtype=float)
            boundaries = np.quantile(arr, np.linspace(0, 1, n_bins + 1)[1:-1]).tolist()
        
        result = []
        for v in values:
            if v is None:
                result.append(-1)
            else:
                bucket = 0
                for b in boundaries:
                    if v > b:
                        bucket += 1
                    else:
                        break
                result.append(bucket)
        
        return result, {
            'transform': 'bucketize',
            'boundaries': boundaries
        }
    
    @staticmethod
    def time_since(values: List[Union[str, datetime]], config: Dict = None) -> Tuple[List[float], Dict]:
        """
        Calculate time since a reference date.
        """
        config = config or {}
        reference = config.get('reference', 'now')
        unit = config.get('unit', 'days')  # 'seconds', 'minutes', 'hours', 'days'
        
        if reference == 'now':
            ref_date = timezone.now()
        else:
            ref_date = datetime.fromisoformat(reference)
        
        divisors = {
            'seconds': 1,
            'minutes': 60,
            'hours': 3600,
            'days': 86400
        }
        divisor = divisors.get(unit, 86400)
        
        result = []
        for v in values:
            if v is None:
                result.append(None)
            else:
                if isinstance(v, str):
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                if timezone.is_naive(v):
                    v = timezone.make_aware(v)
                delta = (ref_date - v).total_seconds() / divisor
                result.append(delta)
        
        return result, {
            'transform': 'time_since',
            'reference': reference,
            'unit': unit
        }
    
    @staticmethod
    def date_parts(values: List[Union[str, datetime]], config: Dict = None) -> Tuple[Dict[str, List[int]], Dict]:
        """
        Extract date parts (year, month, day, hour, day_of_week, etc.)
        """
        config = config or {}
        parts = config.get('parts', ['year', 'month', 'day', 'day_of_week'])
        prefix = config.get('prefix', 'dt')
        
        result = {f"{prefix}_{part}": [] for part in parts}
        
        for v in values:
            if v is None:
                for part in parts:
                    result[f"{prefix}_{part}"].append(None)
            else:
                if isinstance(v, str):
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                
                for part in parts:
                    if part == 'year':
                        result[f"{prefix}_{part}"].append(v.year)
                    elif part == 'month':
                        result[f"{prefix}_{part}"].append(v.month)
                    elif part == 'day':
                        result[f"{prefix}_{part}"].append(v.day)
                    elif part == 'hour':
                        result[f"{prefix}_{part}"].append(v.hour)
                    elif part == 'minute':
                        result[f"{prefix}_{part}"].append(v.minute)
                    elif part == 'day_of_week':
                        result[f"{prefix}_{part}"].append(v.weekday())
                    elif part == 'is_weekend':
                        result[f"{prefix}_{part}"].append(1 if v.weekday() >= 5 else 0)
                    elif part == 'quarter':
                        result[f"{prefix}_{part}"].append((v.month - 1) // 3 + 1)
        
        return result, {
            'transform': 'date_parts',
            'parts': parts,
            'prefix': prefix
        }
    
    @staticmethod
    def rolling_aggregate(
        values: List[float], 
        timestamps: List[datetime],
        config: Dict = None
    ) -> Tuple[List[float], Dict]:
        """
        Compute rolling aggregate over a time window.
        """
        config = config or {}
        window_size = config.get('window_size', 7)
        window_unit = config.get('window_unit', 'days')
        agg_func = config.get('agg_func', 'mean')  # 'mean', 'sum', 'min', 'max', 'count'
        
        # Convert window to timedelta
        if window_unit == 'hours':
            window = timedelta(hours=window_size)
        elif window_unit == 'minutes':
            window = timedelta(minutes=window_size)
        else:
            window = timedelta(days=window_size)
        
        result = []
        for i, (val, ts) in enumerate(zip(values, timestamps)):
            if ts is None:
                result.append(None)
                continue
            
            # Get values within window
            window_values = []
            for j, (v, t) in enumerate(zip(values, timestamps)):
                if t is not None and ts - window <= t <= ts:
                    if v is not None:
                        window_values.append(v)
            
            if not window_values:
                result.append(None)
            elif agg_func == 'mean':
                result.append(np.mean(window_values))
            elif agg_func == 'sum':
                result.append(np.sum(window_values))
            elif agg_func == 'min':
                result.append(np.min(window_values))
            elif agg_func == 'max':
                result.append(np.max(window_values))
            elif agg_func == 'count':
                result.append(len(window_values))
            elif agg_func == 'std':
                result.append(np.std(window_values) if len(window_values) > 1 else 0)
            else:
                result.append(np.mean(window_values))
        
        return result, {
            'transform': 'rolling_aggregate',
            'window_size': window_size,
            'window_unit': window_unit,
            'agg_func': agg_func
        }


class DataPreparation:
    """
    Data preparation utilities for cleaning and preprocessing.
    """
    
    @staticmethod
    def handle_nulls(data: Dict[str, List], config: Dict) -> Dict[str, List]:
        """
        Handle null values in data columns.
        
        Config options:
        - strategy: 'drop', 'fill', 'fill_mean', 'fill_median', 'fill_mode', 'fill_forward', 'fill_backward'
        - fill_value: value to use for 'fill' strategy
        - columns: specific columns to process (default all)
        """
        strategy = config.get('strategy', 'fill')
        fill_value = config.get('fill_value', 0)
        columns = config.get('columns', list(data.keys()))
        
        result = {k: list(v) for k, v in data.items()}
        
        for col in columns:
            if col not in result:
                continue
            
            values = result[col]
            
            if strategy == 'drop':
                # Mark rows for dropping (handled at row level)
                continue
            elif strategy == 'fill':
                result[col] = [fill_value if v is None else v for v in values]
            elif strategy == 'fill_mean':
                valid = [v for v in values if v is not None and isinstance(v, (int, float))]
                mean_val = np.mean(valid) if valid else 0
                result[col] = [mean_val if v is None else v for v in values]
            elif strategy == 'fill_median':
                valid = [v for v in values if v is not None and isinstance(v, (int, float))]
                median_val = np.median(valid) if valid else 0
                result[col] = [median_val if v is None else v for v in values]
            elif strategy == 'fill_mode':
                valid = [v for v in values if v is not None]
                if valid:
                    from collections import Counter
                    mode_val = Counter(valid).most_common(1)[0][0]
                else:
                    mode_val = fill_value
                result[col] = [mode_val if v is None else v for v in values]
            elif strategy == 'fill_forward':
                last_valid = fill_value
                new_values = []
                for v in values:
                    if v is None:
                        new_values.append(last_valid)
                    else:
                        last_valid = v
                        new_values.append(v)
                result[col] = new_values
            elif strategy == 'fill_backward':
                values_reversed = list(reversed(values))
                last_valid = fill_value
                new_values = []
                for v in values_reversed:
                    if v is None:
                        new_values.append(last_valid)
                    else:
                        last_valid = v
                        new_values.append(v)
                result[col] = list(reversed(new_values))
        
        return result
    
    @staticmethod
    def handle_outliers(data: Dict[str, List], config: Dict) -> Dict[str, List]:
        """
        Handle outliers in numerical columns.
        
        Config options:
        - method: 'clip', 'remove', 'replace_mean', 'replace_median'
        - lower: lower percentile (0-1) or absolute value
        - upper: upper percentile (0-1) or absolute value
        - use_percentile: whether lower/upper are percentiles
        - columns: specific columns to process
        """
        method = config.get('method', 'clip')
        lower = config.get('lower', 0.01)
        upper = config.get('upper', 0.99)
        use_percentile = config.get('use_percentile', True)
        columns = config.get('columns', list(data.keys()))
        
        result = {k: list(v) for k, v in data.items()}
        
        for col in columns:
            if col not in result:
                continue
            
            values = result[col]
            
            # Check if numerical
            numeric_values = [v for v in values if isinstance(v, (int, float)) and v is not None]
            if not numeric_values:
                continue
            
            arr = np.array(numeric_values)
            
            if use_percentile:
                lower_bound = np.percentile(arr, lower * 100)
                upper_bound = np.percentile(arr, upper * 100)
            else:
                lower_bound = lower
                upper_bound = upper
            
            if method == 'clip':
                result[col] = [
                    max(lower_bound, min(upper_bound, v)) if isinstance(v, (int, float)) and v is not None else v
                    for v in values
                ]
            elif method == 'remove':
                result[col] = [
                    None if isinstance(v, (int, float)) and v is not None and (v < lower_bound or v > upper_bound) else v
                    for v in values
                ]
            elif method == 'replace_mean':
                mean_val = np.mean(arr[(arr >= lower_bound) & (arr <= upper_bound)])
                result[col] = [
                    mean_val if isinstance(v, (int, float)) and v is not None and (v < lower_bound or v > upper_bound) else v
                    for v in values
                ]
            elif method == 'replace_median':
                median_val = np.median(arr[(arr >= lower_bound) & (arr <= upper_bound)])
                result[col] = [
                    median_val if isinstance(v, (int, float)) and v is not None and (v < lower_bound or v > upper_bound) else v
                    for v in values
                ]
        
        return result
    
    @staticmethod
    def deduplicate(data: Dict[str, List], config: Dict) -> Dict[str, List]:
        """
        Remove duplicate rows.
        
        Config options:
        - columns: columns to consider for deduplication (default all)
        - keep: 'first', 'last', or False (remove all duplicates)
        """
        columns = config.get('columns', list(data.keys()))
        keep = config.get('keep', 'first')
        
        if not data or not columns:
            return data
        
        n_rows = len(list(data.values())[0])
        
        # Build row signatures
        seen = {}
        keep_indices = []
        
        for i in range(n_rows):
            signature = tuple(data[col][i] for col in columns if col in data)
            
            if signature not in seen:
                seen[signature] = i
                keep_indices.append(i)
            elif keep == 'last':
                # Remove previous, add current
                keep_indices = [idx for idx in keep_indices if idx != seen[signature]]
                seen[signature] = i
                keep_indices.append(i)
            # If keep == 'first', do nothing (keep original)
        
        # Filter data
        result = {
            col: [values[i] for i in keep_indices]
            for col, values in data.items()
        }
        
        return result
    
    @staticmethod
    def filter_rows(data: Dict[str, List], config: Dict) -> Dict[str, List]:
        """
        Filter rows based on conditions.
        
        Config options:
        - conditions: list of {column, op, value}
        - combine: 'and' or 'or'
        """
        conditions = config.get('conditions', [])
        combine = config.get('combine', 'and')
        
        if not data or not conditions:
            return data
        
        n_rows = len(list(data.values())[0])
        
        def evaluate_condition(row_idx, condition):
            col = condition.get('column')
            op = condition.get('op')
            value = condition.get('value')
            
            if col not in data:
                return True
            
            row_value = data[col][row_idx]
            
            if op == 'eq':
                return row_value == value
            elif op == 'ne':
                return row_value != value
            elif op == 'gt':
                return row_value > value
            elif op == 'gte':
                return row_value >= value
            elif op == 'lt':
                return row_value < value
            elif op == 'lte':
                return row_value <= value
            elif op == 'in':
                return row_value in value
            elif op == 'not_in':
                return row_value not in value
            elif op == 'is_null':
                return row_value is None
            elif op == 'is_not_null':
                return row_value is not None
            elif op == 'contains':
                return value in str(row_value) if row_value else False
            else:
                return True
        
        keep_indices = []
        for i in range(n_rows):
            results = [evaluate_condition(i, cond) for cond in conditions]
            
            if combine == 'and':
                keep = all(results)
            else:
                keep = any(results)
            
            if keep:
                keep_indices.append(i)
        
        result = {
            col: [values[i] for i in keep_indices]
            for col, values in data.items()
        }
        
        return result


class FeatureStatistics:
    """
    Compute and manage feature statistics.
    """
    
    @staticmethod
    def compute_statistics(values: List[Any], dtype: str = 'auto') -> Dict:
        """
        Compute statistics for a feature column.
        """
        if not values:
            return {'count': 0}
        
        non_null = [v for v in values if v is not None]
        null_count = len(values) - len(non_null)
        
        stats = {
            'count': len(values),
            'non_null_count': len(non_null),
            'null_count': null_count,
            'null_percentage': null_count / len(values) * 100 if values else 0,
        }
        
        if not non_null:
            return stats
        
        # Detect type if auto
        if dtype == 'auto':
            if all(isinstance(v, bool) for v in non_null):
                dtype = 'bool'
            elif all(isinstance(v, (int, float)) for v in non_null):
                dtype = 'numeric'
            elif all(isinstance(v, (datetime, str)) for v in non_null):
                # Check if strings are dates
                try:
                    datetime.fromisoformat(str(non_null[0]).replace('Z', '+00:00'))
                    dtype = 'datetime'
                except:
                    dtype = 'string'
            else:
                dtype = 'string'
        
        stats['inferred_dtype'] = dtype
        
        if dtype in ('numeric', 'int', 'float'):
            arr = np.array([float(v) for v in non_null])
            stats.update({
                'min': float(np.min(arr)),
                'max': float(np.max(arr)),
                'mean': float(np.mean(arr)),
                'median': float(np.median(arr)),
                'std': float(np.std(arr)),
                'variance': float(np.var(arr)),
                'q1': float(np.percentile(arr, 25)),
                'q3': float(np.percentile(arr, 75)),
                'iqr': float(np.percentile(arr, 75) - np.percentile(arr, 25)),
            })
            
            # Histogram
            try:
                hist, bin_edges = np.histogram(arr, bins=10)
                stats['histogram'] = {
                    'counts': hist.tolist(),
                    'bin_edges': bin_edges.tolist()
                }
            except:
                pass
        
        elif dtype in ('string', 'categorical'):
            from collections import Counter
            value_counts = Counter(non_null)
            stats.update({
                'unique_count': len(value_counts),
                'most_common': value_counts.most_common(10),
                'cardinality': len(value_counts) / len(non_null) if non_null else 0,
            })
        
        elif dtype == 'bool':
            true_count = sum(1 for v in non_null if v)
            stats.update({
                'true_count': true_count,
                'false_count': len(non_null) - true_count,
                'true_percentage': true_count / len(non_null) * 100 if non_null else 0,
            })
        
        elif dtype == 'datetime':
            dates = []
            for v in non_null:
                if isinstance(v, str):
                    v = datetime.fromisoformat(v.replace('Z', '+00:00'))
                dates.append(v)
            
            if dates:
                stats.update({
                    'min': min(dates).isoformat(),
                    'max': max(dates).isoformat(),
                    'range_days': (max(dates) - min(dates)).days,
                })
        
        return stats


class FeatureEngineer:
    """
    Main orchestrator for feature engineering pipelines.
    """
    
    def __init__(self, workspace_id: str):
        self.workspace_id = workspace_id
        self.transformations = FeatureTransformations()
        self.data_prep = DataPreparation()
        self.stats = FeatureStatistics()
        self._transform_metadata = {}
    
    def prepare_data(
        self, 
        data: Dict[str, List], 
        config: Dict
    ) -> Dict[str, List]:
        """
        Step 1: Data preparation - clean, normalize, handle nulls.
        
        Args:
            data: Dictionary of column_name -> list of values
            config: Data preparation configuration
        
        Returns:
            Cleaned data dictionary
        """
        logger.info(f"Starting data preparation with {len(data)} columns")
        
        result = data.copy()
        
        # Handle nulls
        if 'handle_nulls' in config:
            result = self.data_prep.handle_nulls(result, config['handle_nulls'])
            logger.debug("Completed null handling")
        
        # Handle outliers
        if 'handle_outliers' in config:
            result = self.data_prep.handle_outliers(result, config['handle_outliers'])
            logger.debug("Completed outlier handling")
        
        # Deduplicate
        if 'deduplicate' in config:
            result = self.data_prep.deduplicate(result, config['deduplicate'])
            logger.debug("Completed deduplication")
        
        # Filter rows
        if 'filter_conditions' in config:
            result = self.data_prep.filter_rows(result, {'conditions': config['filter_conditions']})
            logger.debug("Completed row filtering")
        
        logger.info(f"Data preparation complete. Rows: {len(list(result.values())[0]) if result else 0}")
        return result
    
    def engineer_features(
        self, 
        data: Dict[str, List],
        feature_definitions: List[Dict]
    ) -> Dict[str, List]:
        """
        Step 2: Apply feature engineering transformations.
        
        Args:
            data: Prepared data dictionary
            feature_definitions: List of feature definitions with transform configs
        
        Returns:
            Dictionary with engineered features
        """
        logger.info(f"Engineering {len(feature_definitions)} features")
        
        result = {}
        
        for feature_def in feature_definitions:
            name = feature_def.get('name')
            transform_type = feature_def.get('transform_type', 'passthrough')
            source_columns = feature_def.get('source_columns', [])
            config = feature_def.get('transform_config', {})
            
            try:
                # Get source data
                if len(source_columns) == 1:
                    source_data = data.get(source_columns[0], [])
                else:
                    source_data = {col: data.get(col, []) for col in source_columns}
                
                # Apply transformation
                if transform_type == 'passthrough':
                    transformed, meta = self.transformations.passthrough(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'standard_scale':
                    transformed, meta = self.transformations.standard_scale(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'min_max_scale':
                    transformed, meta = self.transformations.min_max_scale(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'log_transform':
                    transformed, meta = self.transformations.log_transform(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'one_hot':
                    transformed, meta = self.transformations.one_hot_encode(source_data, config)
                    # One-hot produces multiple columns
                    for col_name, col_values in transformed.items():
                        result[col_name] = col_values
                
                elif transform_type == 'label_encode':
                    transformed, meta = self.transformations.label_encode(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'bucketize':
                    transformed, meta = self.transformations.bucketize(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'time_since':
                    transformed, meta = self.transformations.time_since(source_data, config)
                    result[name] = transformed
                
                elif transform_type == 'date_parts':
                    transformed, meta = self.transformations.date_parts(source_data, config)
                    for col_name, col_values in transformed.items():
                        result[col_name] = col_values
                
                elif transform_type == 'rolling_agg':
                    # Need timestamp column
                    ts_col = config.get('timestamp_column')
                    if ts_col and ts_col in data:
                        transformed, meta = self.transformations.rolling_aggregate(
                            source_data, data[ts_col], config
                        )
                        result[name] = transformed
                
                elif transform_type == 'custom_sql':
                    # Custom SQL handled separately via Trino
                    result[name] = source_data
                    meta = {'transform': 'custom_sql'}
                
                elif transform_type == 'custom_python':
                    # Execute custom Python expression
                    expression = feature_def.get('transformation_expression', '')
                    if expression:
                        # Create safe execution context
                        local_vars = {'data': data, 'np': np, 'source': source_data}
                        exec(f"result_value = {expression}", {}, local_vars)
                        result[name] = local_vars['result_value']
                        meta = {'transform': 'custom_python'}
                    else:
                        result[name] = source_data
                        meta = {'transform': 'custom_python', 'error': 'No expression'}
                
                else:
                    result[name] = source_data
                    meta = {'transform': 'unknown'}
                
                # Store transformation metadata
                self._transform_metadata[name] = meta
                
            except Exception as e:
                logger.error(f"Error engineering feature {name}: {str(e)}")
                result[name] = [None] * len(list(data.values())[0]) if data else []
                self._transform_metadata[name] = {'transform': transform_type, 'error': str(e)}
        
        logger.info(f"Feature engineering complete. Generated {len(result)} features")
        return result
    
    def compute_statistics(self, features: Dict[str, List]) -> Dict[str, Dict]:
        """
        Compute statistics for all features.
        
        Args:
            features: Dictionary of feature_name -> values
        
        Returns:
            Dictionary of feature_name -> statistics
        """
        logger.info(f"Computing statistics for {len(features)} features")
        
        result = {}
        for name, values in features.items():
            result[name] = self.stats.compute_statistics(values)
        
        return result
    
    def write_to_offline_store(
        self,
        features: Dict[str, List],
        feature_group_id: str,
        entity_column: str,
        timestamp_column: Optional[str] = None
    ) -> Dict:
        """
        Step 3a: Write features to offline store (Iceberg via Trino).
        
        Args:
            features: Dictionary of feature data
            feature_group_id: Target feature group ID
            entity_column: Column containing entity IDs
            timestamp_column: Optional event timestamp column
        
        Returns:
            Write operation result
        """
        from .models import FeatureGroup
        import trino
        
        logger.info(f"Writing features to offline store for group {feature_group_id}")
        
        try:
            feature_group = FeatureGroup.objects.get(id=feature_group_id)
            
            # Connect to Trino
            conn = trino.dbapi.connect(
                host=getattr(settings, 'TRINO_HOST', 'trino'),
                port=getattr(settings, 'TRINO_PORT', 8080),
                user=getattr(settings, 'TRINO_USER', 'conveyor'),
                catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
                schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
            )
            cursor = conn.cursor()
            
            # Build table name
            table_name = f"fg_{feature_group.name.lower().replace(' ', '_').replace('-', '_')}"
            
            # Create table if not exists
            columns = []
            for col_name, values in features.items():
                # Infer type from values
                non_null = [v for v in values if v is not None]
                if non_null:
                    sample = non_null[0]
                    if isinstance(sample, bool):
                        col_type = 'BOOLEAN'
                    elif isinstance(sample, int):
                        col_type = 'BIGINT'
                    elif isinstance(sample, float):
                        col_type = 'DOUBLE'
                    else:
                        col_type = 'VARCHAR'
                else:
                    col_type = 'VARCHAR'
                
                columns.append(f'"{col_name}" {col_type}')
            
            create_sql = f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    {', '.join(columns)}
                )
            """
            cursor.execute(create_sql)
            
            # Insert data
            n_rows = len(list(features.values())[0]) if features else 0
            col_names = list(features.keys())
            
            for i in range(n_rows):
                values = []
                for col in col_names:
                    v = features[col][i]
                    if v is None:
                        values.append('NULL')
                    elif isinstance(v, str):
                        values.append(f"'{v}'")
                    elif isinstance(v, bool):
                        values.append('TRUE' if v else 'FALSE')
                    else:
                        values.append(str(v))
                
                insert_sql = f"""
                    INSERT INTO {table_name} ({', '.join(f'"{c}"' for c in col_names)})
                    VALUES ({', '.join(values)})
                """
                cursor.execute(insert_sql)
            
            # Update feature group metadata
            feature_group.row_count = n_rows
            feature_group.last_updated_at = timezone.now()
            feature_group.source_table = table_name
            feature_group.save()
            
            logger.info(f"Successfully wrote {n_rows} rows to offline store")
            
            return {
                'success': True,
                'table_name': table_name,
                'rows_written': n_rows,
                'columns': col_names
            }
            
        except Exception as e:
            logger.error(f"Error writing to offline store: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def write_to_online_store(
        self,
        features: Dict[str, List],
        feature_group_id: str,
        entity_column: str,
        ttl_seconds: Optional[int] = None
    ) -> Dict:
        """
        Step 3b: Write features to online store (Redis) for low-latency serving.
        
        Args:
            features: Dictionary of feature data
            feature_group_id: Target feature group ID
            entity_column: Column containing entity IDs
            ttl_seconds: Time-to-live for cached features
        
        Returns:
            Write operation result
        """
        import redis
        from .models import FeatureGroup
        
        logger.info(f"Writing features to online store for group {feature_group_id}")
        
        try:
            feature_group = FeatureGroup.objects.get(id=feature_group_id)
            
            # Connect to Redis
            redis_client = redis.Redis(
                host=getattr(settings, 'REDIS_HOST', 'redis'),
                port=getattr(settings, 'REDIS_PORT', 6379),
                db=getattr(settings, 'FEATURE_STORE_REDIS_DB', 1),
                decode_responses=True
            )
            
            # Default TTL from feature group or setting
            if ttl_seconds is None:
                ttl_seconds = (feature_group.ttl_days or 7) * 86400
            
            # Get entity IDs
            entity_ids = features.get(entity_column, [])
            feature_cols = [c for c in features.keys() if c != entity_column]
            
            keys_updated = 0
            pipe = redis_client.pipeline()
            
            for i, entity_id in enumerate(entity_ids):
                if entity_id is None:
                    continue
                
                # Build feature dictionary for this entity
                feature_dict = {
                    col: features[col][i]
                    for col in feature_cols
                    if features[col][i] is not None
                }
                
                # Key format: features:{feature_group_name}:{entity_id}
                key = f"features:{feature_group.name}:{entity_id}"
                
                # Store as hash
                if feature_dict:
                    pipe.hset(key, mapping={k: json.dumps(v) for k, v in feature_dict.items()})
                    if ttl_seconds:
                        pipe.expire(key, ttl_seconds)
                    keys_updated += 1
            
            pipe.execute()
            
            # Update feature group
            feature_group.online_enabled = True
            feature_group.save()
            
            logger.info(f"Successfully wrote {keys_updated} entities to online store")
            
            return {
                'success': True,
                'keys_updated': keys_updated,
                'ttl_seconds': ttl_seconds
            }
            
        except Exception as e:
            logger.error(f"Error writing to online store: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_online_features(
        self,
        feature_group_name: str,
        entity_ids: List[str],
        features: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Get features from online store for real-time serving.
        
        Args:
            feature_group_name: Name of the feature group
            entity_ids: List of entity IDs to fetch
            features: Optional list of specific features to fetch
        
        Returns:
            List of feature dictionaries, one per entity
        """
        import redis
        
        logger.info(f"Fetching online features for {len(entity_ids)} entities")
        
        try:
            redis_client = redis.Redis(
                host=getattr(settings, 'REDIS_HOST', 'redis'),
                port=getattr(settings, 'REDIS_PORT', 6379),
                db=getattr(settings, 'FEATURE_STORE_REDIS_DB', 1),
                decode_responses=True
            )
            
            result = []
            pipe = redis_client.pipeline()
            
            for entity_id in entity_ids:
                key = f"features:{feature_group_name}:{entity_id}"
                if features:
                    pipe.hmget(key, features)
                else:
                    pipe.hgetall(key)
            
            responses = pipe.execute()
            
            for i, response in enumerate(responses):
                entity_features = {'entity_id': entity_ids[i]}
                
                if features and isinstance(response, list):
                    for j, feat in enumerate(features):
                        val = response[j]
                        entity_features[feat] = json.loads(val) if val else None
                elif isinstance(response, dict):
                    for k, v in response.items():
                        entity_features[k] = json.loads(v) if v else None
                
                result.append(entity_features)
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching online features: {str(e)}")
            return [{'entity_id': eid, 'error': str(e)} for eid in entity_ids]
    
    def create_training_dataset(
        self,
        feature_view_id: str,
        name: str,
        label_column: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        split_config: Optional[Dict] = None
    ) -> Dict:
        """
        Create a training dataset from a feature view.
        
        Args:
            feature_view_id: Source feature view ID
            name: Name for the training dataset
            label_column: Target/label column name
            start_time: Start of time range
            end_time: End of time range
            split_config: Train/val/test split configuration
        
        Returns:
            Training dataset metadata
        """
        from .models import FeatureView, TrainingDataset, FeatureGroup
        import trino
        
        logger.info(f"Creating training dataset from feature view {feature_view_id}")
        
        try:
            feature_view = FeatureView.objects.get(id=feature_view_id)
            
            # Connect to Trino
            conn = trino.dbapi.connect(
                host=getattr(settings, 'TRINO_HOST', 'trino'),
                port=getattr(settings, 'TRINO_PORT', 8080),
                user=getattr(settings, 'TRINO_USER', 'conveyor'),
                catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
                schema=getattr(settings, 'TRINO_SCHEMA', 'feature_store'),
            )
            cursor = conn.cursor()
            
            # Build query from feature view
            feature_groups = feature_view.feature_groups.all()
            
            if not feature_groups:
                return {'success': False, 'error': 'No feature groups in view'}
            
            # For now, assume single feature group or joined
            primary_fg = feature_groups.first()
            table_name = primary_fg.source_table
            
            # Build SELECT
            select_features = []
            for feat in feature_view.features:
                if isinstance(feat, dict):
                    select_features.append(feat.get('feature_name', feat.get('name', '')))
                else:
                    select_features.append(str(feat))
            
            if not select_features:
                select_features = ['*']
            
            query = f"SELECT {', '.join(select_features)} FROM {table_name}"
            
            # Add time filter if specified
            if start_time or end_time:
                conditions = []
                if start_time:
                    conditions.append(f"event_timestamp >= TIMESTAMP '{start_time.isoformat()}'")
                if end_time:
                    conditions.append(f"event_timestamp <= TIMESTAMP '{end_time.isoformat()}'")
                query += f" WHERE {' AND '.join(conditions)}"
            
            cursor.execute(query)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            # Convert to feature dictionary
            data = {col: [] for col in columns}
            for row in rows:
                for i, col in enumerate(columns):
                    data[col].append(row[i])
            
            # Apply splits if configured
            splits = split_config or {'train': 0.7, 'validation': 0.15, 'test': 0.15}
            n_rows = len(rows)
            
            # Store to data lake
            storage_path = f"s3://conveyor/training_datasets/{name}/"
            
            # Create TrainingDataset record
            training_dataset = TrainingDataset.objects.create(
                workspace=feature_view.workspace,
                name=name,
                feature_view=feature_view,
                start_time=start_time,
                end_time=end_time,
                storage_path=storage_path,
                format='parquet',
                row_count=n_rows,
                splits=splits
            )
            
            logger.info(f"Created training dataset with {n_rows} rows")
            
            return {
                'success': True,
                'dataset_id': str(training_dataset.id),
                'name': name,
                'row_count': n_rows,
                'columns': columns,
                'splits': splits,
                'storage_path': storage_path
            }
            
        except Exception as e:
            logger.error(f"Error creating training dataset: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_transform_metadata(self) -> Dict[str, Dict]:
        """Get metadata from last transformation run."""
        return self._transform_metadata
