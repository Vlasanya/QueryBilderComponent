import React from "react";
import QueryBuilderComponentMUI from "./components/QueryBuilderComponent";

export type ConditionModel = {
  condition: "and" | "or";
  rules: Array<RuleModel | ConditionModel>;
};

export type RuleType = {
  id: string;
  field: string;
  operator: string;
  value: any;
  label?: string;
  type?: string;
};

type RuleModel = {
  condition?: "and" | "or";
  rules?: Array<RuleModel | ConditionModel>;
  field?: string;
  operator?: string;
  value?: any;
};

type RuleGroupType = {
  id: string;
  combinator: "and" | "or";
  rules: Array<RuleGroupType | RuleType>;
};

function App() {
  const normalizeOperator = (field: string, operator: string, columnData: any[]) => {
    const column = columnData.find((col) => col.field === field);
  
    if (!column) {
      console.warn(`Field ${field} not found in columnData`);
      return operator;
    }
  
    const operatorMapping: Record<string, string> = {
      equal: "is",
      notequal: "is not",
      greaterthan: "greater than",
      lessthan: "less than",
      between: "between",
      notbetween: "not between",
      isin: "is", 
      isnotin: "is not"
    };
  
    const normalizedOperator = operatorMapping[operator] || operator;
    const validOperators = column.operators.map((op: any) => op.value);
    return validOperators.includes(normalizedOperator) ? normalizedOperator : "";
  };
  
  const transformRuleModelToRuleGroupType = (ruleModel: RuleModel): RuleGroupType => {
    return {
      id: `rule-${Math.random().toString(36).slice(2, 9)}`,
      combinator: ruleModel.condition || "and",
      rules: ruleModel.rules
        ? ruleModel.rules.map((childRule) =>
            "rules" in childRule
              ? transformRuleModelToRuleGroupType(childRule)
              : {
                  id: `rule-${Math.random().toString(36).slice(2, 9)}`,
                  field: childRule.field || "",
                  operator: normalizeOperator(childRule.field || "", childRule.operator || "", columnData),
                  value: childRule.value || null,
                }
          )
        : [],
    };
  };
  

  const importRules: RuleModel = {
    condition: "and",
    rules: [
      {
        field: "employeeId",
        operator: "equal",
        value: 123,
      },
      {
        condition: "or",
        rules: [
          {
            field: "sensitivityLevel",
            operator: "greaterthan",
            value: 5,
          },
        ],
      },
    ],
  };

  const columnData = [
    {
      field: "employeeId",
      label: "User",
      category: "Employee Related",
      type: "number",
      operators: [
        { key: "is", value: "isin" },
        { key: "is not", value: "isnotin" },
      ],
      template: ({ rule, ruleID }: { rule: any; ruleID: string }) => {
        const values = rule.value || [];
        return (
          <div>
            <input
              type="text"
              value={values}
              onChange={(e) => console.log('Changed:', e.target.value)}
            />
          </div>
        );
      },
    },
    {
      field: "employeeTagId",
      label: "User Tag",
      category: "Employee Related",
      type: "number",
      operators: [
        { key: "is", value: "isin" },
        { key: "is not", value: "isnotin" },
        { key: "greater than", value: "greaterthan" },
        { key: "less than", value: "lessthan" },
        { key: "between", value: "between" },
        { key: "not between", value: "notbetween" },
      ],
    },
    {
      field: "sensitivityLevel",
      label: "Sensitivity Level",
      category: "Data Related",
      type: "number",
      operators: [
        { key: "is", value: "isin" },
        { key: "is not", value: "isnotin" },
        { key: "greater than", value: "greaterthan" },
        { key: "less than", value: "lessthan" },
      ],
    },
  ];

  const transformedRules: Partial<RuleGroupType> | null = importRules
    ? transformRuleModelToRuleGroupType(importRules)
    : null;

  return (
    <div className="App">
      <QueryBuilderComponentMUI
        columnData={columnData}
        rule={transformedRules}
        id="query-builder"
        componentKey="query-builder-key"
      />
    </div>
  );
}

export default App;
