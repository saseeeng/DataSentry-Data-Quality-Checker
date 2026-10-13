import re
from typing import Any
import pandas as pd


def analyze_dataframe(df: pd.DataFrame, rules: list) -> tuple[dict, list[dict], float]:
    issues = []
    counts = {
        "missing_count": 0,
        "duplicate_count": 0,
        "invalid_count": 0,
        "inconsistent_count": 0,
    }

    def add_issue(kind, column, row, description, severity, suggestion):
        issues.append({
            "issue_type": kind,
            "column_name": str(column),
            "row_number": row,
            "description": description,
            "severity": severity,
            "suggestion": suggestion,
        })

    def row_numbers(mask):
        return [index + 2 for index, matched in enumerate(mask.fillna(False).tolist()) if matched]

    # Empty cells and duplicate records.
    for column in df.columns:
        missing = df[column].isna() | df[column].astype("string").str.strip().eq("").fillna(False)
        for row in row_numbers(missing):
            add_issue("missing_value", column, row, "Value is empty.", "medium", "Fill in or remove this value.")
        counts["missing_count"] += int(missing.sum())

    duplicates = df.duplicated(keep="first")
    for row in row_numbers(duplicates):
        add_issue("duplicate_record", "*", row, "Record duplicates an earlier row.", "medium", "Review and remove duplicate records.")
    counts["duplicate_count"] = int(duplicates.sum())

    # Email format checks for columns named "email".
    for column in df.columns:
        if "email" not in str(column).lower():
            continue
        values = df[column].astype("string").str.strip()
        invalid = values.notna() & values.ne("") & ~values.str.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", na=False)
        for row in row_numbers(invalid):
            add_issue("invalid_email", column, row, "Email address has an invalid format.", "high", "Check the email address.")
        counts["invalid_count"] += int(invalid.sum())

    # Flag case or whitespace variants in text columns.
    for column in df.select_dtypes(include=["object", "string"]).columns:
        values = df[column].dropna().astype(str)
        groups: dict[str, list] = {}
        for index, value in values.items():
            groups.setdefault(value.strip().casefold(), []).append((index, value))

        for variants in groups.values():
            if len({value for _, value in variants}) > 1:
                for index, _ in variants:
                    row = int(df.index.get_loc(index)) + 2
                    add_issue(
                        "inconsistent_value", column, row,
                        "Value differs by capitalization or surrounding whitespace.",
                        "low", "Standardize capitalization and whitespace.",
                    )
                    counts["inconsistent_count"] += 1

    # Apply active user-defined rules.
    for rule in rules:
        if rule.column_name not in df.columns:
            continue

        column = rule.column_name
        values = df[column].astype("string").str.strip()
        missing = df[column].isna() | values.eq("").fillna(False)
        rule_type = rule.rule_type

        if rule_type == "required":
            invalid = missing
            suggestion = "Provide a value for this field."
        elif rule_type == "unique":
            invalid = df[column].duplicated(keep=False) & ~missing
            suggestion = "Make this value unique."
        elif rule_type == "email":
            invalid = ~missing & ~values.str.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", na=False)
            suggestion = "Enter a valid email address."
        elif rule_type == "allowed_values":
            allowed = {str(value) for value in rule.rule_config.get("values", [])}
            invalid = ~missing & ~values.isin(allowed)
            suggestion = "Use one of the configured allowed values."
        elif rule_type == "regex":
            try:
                pattern = rule.rule_config["pattern"]
                invalid = ~missing & ~values.str.match(pattern, na=False)
                suggestion = "Update the value to match the configured format."
            except (KeyError, re.error):
                continue
        else:
            continue

        for row in row_numbers(invalid):
            add_issue(
                f"rule_{rule_type}", column, row,
                f"Value violates validation rule: {rule.name}.",
                rule.severity, suggestion,
            )

        if rule_type == "required":
            counts["missing_count"] += int(invalid.sum())
        elif rule_type == "unique":
            counts["duplicate_count"] += int(invalid.sum())
        else:
            counts["invalid_count"] += int(invalid.sum())

    total_cells = max(int(df.size), 1)
    percentages = {
        "missing_percentage": round(counts["missing_count"] / total_cells * 100, 2),
        "duplicate_percentage": round(counts["duplicate_count"] / total_cells * 100, 2),
        "invalid_percentage": round(counts["invalid_count"] / total_cells * 100, 2),
        "inconsistent_percentage": round(counts["inconsistent_count"] / total_cells * 100, 2),
    }
    issue_count = sum(counts.values())
    quality_score = round(max(0, 100 - issue_count / total_cells * 100), 2)

    return {**counts, **percentages}, issues, quality_score


def profile_columns(df: pd.DataFrame, issues: list[dict] | None = None) -> list[dict[str, Any]]:
    """Generate detailed column profiling metrics and health assessment."""
    column_issue_counts: dict[str, int] = {}
    if issues:
        for issue in issues:
            col = issue.get("column_name")
            if col and col != "*":
                column_issue_counts[col] = column_issue_counts.get(col, 0) + 1

    total_rows = len(df)
    profiles = []

    for col in df.columns:
        series = df[col]
        # Count null or blank strings
        if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
            null_count = int(series.isna().sum() + series.astype("string").str.strip().eq("").fillna(False).sum())
            non_null = series.dropna().astype("string").str.strip()
            non_null = non_null[non_null.ne("")]
        else:
            null_count = int(series.isna().sum())
            non_null = series.dropna()

        null_pct = round((null_count / max(total_rows, 1)) * 100, 1)
        unique_count = int(non_null.nunique())
        unique_pct = round((unique_count / max(len(non_null), 1)) * 100, 1) if len(non_null) > 0 else 0.0

        # Inferred type
        col_lower = str(col).lower()
        if pd.api.types.is_integer_dtype(series):
            inferred_type = "Integer"
        elif pd.api.types.is_numeric_dtype(series):
            inferred_type = "Float"
        elif "email" in col_lower:
            inferred_type = "Email"
        elif "date" in col_lower or "time" in col_lower:
            inferred_type = "DateTime"
        elif len(non_null) > 0 and non_null.astype(str).str.lower().isin(["true", "false", "yes", "no", "1", "0"]).all():
            inferred_type = "Boolean"
        else:
            inferred_type = "Text"

        # Numeric stats if available
        min_val = None
        max_val = None
        mean_val = None
        if pd.api.types.is_numeric_dtype(series) and len(non_null) > 0:
            try:
                min_val = round(float(non_null.min()), 2)
                max_val = round(float(non_null.max()), 2)
                mean_val = round(float(non_null.mean()), 2)
            except Exception:
                pass

        # Samples
        samples = [str(x) for x in non_null.drop_duplicates().head(3).tolist()]
        issue_count = column_issue_counts.get(str(col), 0)

        # Health status
        if null_pct > 25 or issue_count > 5:
            health = "critical"
        elif null_pct > 5 or issue_count > 0:
            health = "warning"
        else:
            health = "healthy"

        profiles.append({
            "column_name": str(col),
            "inferred_type": inferred_type,
            "total_rows": total_rows,
            "null_count": null_count,
            "null_percentage": null_pct,
            "unique_count": unique_count,
            "unique_percentage": unique_pct,
            "sample_values": samples,
            "min_val": min_val,
            "max_val": max_val,
            "mean_val": mean_val,
            "issue_count": issue_count,
            "health_status": health,
        })

    return profiles