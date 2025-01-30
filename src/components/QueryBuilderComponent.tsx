import React, { useState, useEffect } from "react";
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  QueryBuilder,
  RuleGroupType,
  RuleType,
  ValidationMap,
  QueryValidator,
} from "react-querybuilder";
// eslint-disable-next-line import/no-extraneous-dependencies
import { QueryBuilderMaterial } from "@react-querybuilder/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { IconButton, Typography, Box } from "@mui/material";
import { ConditionModel } from "../App";
import "../styles/queryBuilder.css";

interface QueryBuilderComponentMUIProps {
  columnData: any[];
  rule: Partial<RuleGroupType> | null;
  id: string;
  componentKey: string | number;
}

const QueryBuilderComponentMUI: React.FC<QueryBuilderComponentMUIProps> = ({
  columnData,
  rule,
  id,
  componentKey,
}) => {
  const [query, setQuery] = useState<RuleGroupType>({
    combinator: "and",
    rules: [],
  });
  const [validation, setValidation] = useState<ValidationMap>({});
  const [transformedConditionModel, setTransformedConditionModel] =
    useState<ConditionModel | null>(null);

  useEffect(() => {
    if (rule) {
      const initialQuery = {
        combinator: rule.combinator || "and",
        rules: Array.isArray(rule.rules) ? rule.rules : [],
        ...rule,
      };
      setQuery(initialQuery);

      const initialValidation = validator(initialQuery);
      if (typeof initialValidation === "object") {
        setValidation(initialValidation);
      } else {
        setValidation({});
      }
    } else {
      setQuery({ combinator: "and", rules: [] });
      setValidation({});
    }
  }, [rule]);

  const validator: QueryValidator = (ruleGroup): ValidationMap => {
    const validateRules = (
      rules: Array<any>,
      validationMap: ValidationMap = {}
    ): ValidationMap => {
      rules.forEach((validationRule) => {
        if (validationRule.rules && Array.isArray(validationRule.rules)) {
          validationMap[validationRule.id] = true;
          validateRules(validationRule.rules, validationMap);
        } else if (
          !validationRule.value ||
          (typeof validationRule.value === "string" &&
            validationRule.value.trim() === "")
        ) {
          validationMap[validationRule.id] = {
            valid: false,
            reasons: ["Value cannot be empty"],
          };
        } else {
          validationMap[validationRule.id] = true;
        }
      });
      return validationMap;
    };

    return validateRules(ruleGroup.rules || {});
  };

  const handleQueryChange = (newQuery: RuleGroupType) => {
    setQuery(newQuery);
    const newValidation = validator(newQuery);
    if (typeof newValidation === "object") {
      setValidation(newValidation);
    } else {
      setValidation({});
    }

    const transformedConditionModel = transformToConditionModel(
      newQuery,
      columnData
    );
    setTransformedConditionModel(transformedConditionModel);
  };

  const fields = columnData.map((column) => ({
    name: column.field,
    label: column.label,
    valueEditorType: column.type === "boolean" ? "checkbox" : "text",
    inputType: column.type === "number" ? "number" : "text",
    operators: column.operators.map((op: any) => ({
      name: op.key,
      label: op.value,
    })),
    category: column.category,
  }));

  const CombinatorButton: React.FC<{
    options: { name: string; label: string }[];
    value: string;
    // title?: string;
    handleOnChange: (value: string) => void;
  }> = ({ options, value, handleOnChange }) => {
    return (
      <div className="combinator-button">
        {options.map((option) => (
          <button
            type="button"
            key={option.name}
            className={`half-button ${value === option.name ? "active" : ""}`}
            onClick={() => handleOnChange(option.name)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  };

  const customControlElements = {
    valueEditor: (props: any) => {
      const field = columnData.find((col) => col.field === props.field);

      if (field?.template) {
        return field.template({
          rule: props.rule,
          ruleID: props.rule.id,
        });
      }

      return (
        <input
          type={props.inputType || "text"}
          value={props.value || ""}
          onChange={(e) => props.handleOnChange(e.target.value)}
          placeholder={props.placeholder || ""}
          disabled={props.disabled}
        />
      );
    },
    combinatorSelector: (props: any) => (
      <CombinatorButton
        options={props.options}
        value={props.value}
        // title={props.title || ''}
        handleOnChange={props.handleOnChange}
      />
    ),
    removeGroupAction: (props: any) => (
      <IconButton
        onClick={props.handleOnClick}
        className={`${props.className} custom-remove-group`}
        title={props.title || "Remove group"}
      >
        <CloseOutlinedIcon />
      </IconButton>
    ),
    removeRuleAction: (props: any) => (
      <IconButton
        onClick={props.handleOnClick}
        className={`${props.className} custom-remove-rule`}
        title={props.title || "Remove rule"}
      >
        <CloseOutlinedIcon />
      </IconButton>
    ),
  };

  const renderValidationErrors = (
    rules: any[],
    validationMap: ValidationMap
  ): string[] => {
    const errors: string[] = [];

    rules.forEach((validationRule) => {
      if (validationRule.rules && Array.isArray(validationRule.rules)) {
        errors.push(
          ...renderValidationErrors(validationRule.rules, validationMap)
        );
      } else if (validationRule.id && validationRule.field) {
        const status = validationMap[validationRule.id];
        if (status && typeof status !== "boolean" && status.reasons) {
          const fieldName =
            fields.find((field) => field.name === validationRule.field)
              ?.label || validationRule.field;
          errors.push(`Field "${fieldName}": ${status.reasons.join(", ")}`);
        }
      }
    });

    return errors;
  };

  const transformToConditionModel = (
    query: RuleGroupType,
    columnData: any[]
  ): ConditionModel => {
    const mapFieldToLabelAndType = (field: string) => {
      const column = columnData.find((col) => col.field === field);
      return {
        label: column?.label || field,
        type: column?.type || "string",
      };
    };

    const transformRules = (
      rules: Array<RuleGroupType | RuleType>
    ): Array<RuleType | ConditionModel> => {
      return rules.map((rule) => {
        if ("rules" in rule) {
          return {
            condition: rule.combinator as "and" | "or",
            rules: transformRules(rule.rules),
          };
        } else {
          const { label, type } = mapFieldToLabelAndType(rule.field || "");
          return {
            field: rule.field,
            label,
            operator: rule.operator,
            type,
            value: rule.value,
          };
        }
      });
    };

    return {
      condition: query.combinator as "and" | "or",
      rules: transformRules(query.rules),
    };
  };

  return (
    <div>
      <h2>Query Builder</h2>
      <QueryBuilderMaterial>
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={handleQueryChange}
          controlElements={customControlElements}
          validator={validator}
        />
      </QueryBuilderMaterial>
      <div className="validation-errors">
        {renderValidationErrors(query.rules || [], validation).map(
          (error, index) => (
            <Typography key={index} color="error">
              {error}
            </Typography>
          )
        )}
      </div>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alighItems: "center",
          width: "100%",
          mt: 2,
          p: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography>Query model</Typography>
          <pre>{JSON.stringify(query, null, 2)}</pre>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography>Transformed condition model</Typography>
          <pre style={{ flex: 1 }}>
            {JSON.stringify(transformedConditionModel, null, 2)}
          </pre>
        </Box>
      </Box>
    </div>
  );
};

export default QueryBuilderComponentMUI;
