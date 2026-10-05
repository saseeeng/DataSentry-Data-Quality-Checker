import re

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
        groups = {}
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