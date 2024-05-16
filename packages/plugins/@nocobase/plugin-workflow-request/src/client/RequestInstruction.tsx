/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useState } from 'react';
import { onFieldValueChange } from '@formily/core';
import { uid } from '@formily/shared';
import { useForm, useField, useFormEffects } from '@formily/react';
import { ArrayItems } from '@formily/antd-v5';

import {
  Instruction,
  WorkflowVariableJSON,
  WorkflowVariableTextArea,
  defaultFieldNames,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE } from '../locale';
import { SchemaComponent, css } from '@nocobase/client';

const BodySchema = {
  'application/json': {
    type: 'void',
    properties: {
      data: {
        type: 'object',
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'WorkflowVariableJSON',
        'x-component-props': {
          changeOnSelect: true,
          autoSize: {
            minRows: 10,
          },
          placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
        },
      },
    },
  },
  'application/x-www-form-urlencoded': {
    type: 'void',
    properties: {
      data: {
        type: 'array',
        'x-decorator': 'FormItem',
        'x-decorator-props': {},
        'x-component': 'ArrayItems',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component': 'Space',
              properties: {
                name: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-component-props': {
                    placeholder: `{{t("Name")}}`,
                  },
                },
                value: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'WorkflowVariableTextArea',
                  'x-component-props': {
                    useTypedConstant: true,
                  },
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: `{{t("Add key-value pairs", { ns: "${NAMESPACE}" })}}`,
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
    },
  },
};

function BodyComponent(props) {
  const f = useField();
  const { values, setValuesIn, clearFormGraph } = useForm();
  const { contentType } = values;
  const [schema, setSchema] = useState(BodySchema[contentType]);

  useFormEffects(() => {
    onFieldValueChange('contentType', (field) => {
      clearFormGraph(`${f.address}.*`);
      setSchema({ ...BodySchema[field.value], name: uid() });
      setValuesIn('data', null);
    });
  });

  return <SchemaComponent basePath={f.address} schema={schema} onlyRenderProperties />;
}

export default class extends Instruction {
  title = `{{t("HTTP request", { ns: "${NAMESPACE}" })}}`;
  type = 'request';
  group = 'extended';
  description = `{{t("Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.", { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    method: {
      type: 'string',
      required: true,
      title: `{{t("HTTP method", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        showSearch: false,
        allowClear: false,
        className: 'auto-width',
      },
      enum: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' },
      ],
      default: 'POST',
    },
    url: {
      type: 'string',
      required: true,
      title: `{{t("URL", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        placeholder: 'https://www.nocobase.com',
      },
    },
    contentType: {
      type: 'string',
      title: `{{t("Content-Type", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: false,
      },
      enum: [
        { label: 'application/json', value: 'application/json' },
        { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
      ],
      default: 'application/json',
    },
    headers: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Headers", { ns: "${NAMESPACE}" })}}`,
      description: `{{t('"Content-Type" will be ignored from headers.', { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableTextArea',
                'x-component-props': {
                  useTypedConstant: true,
                  placeholder: `{{t("Value")}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add request header", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    params: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      title: `{{t("Parameters", { ns: "${NAMESPACE}" })}}`,
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            'x-component-props': {
              style: {
                flexWrap: 'nowrap',
                maxWidth: '100%',
              },
              className: css`
                & > .ant-space-item:first-child,
                & > .ant-space-item:last-child {
                  flex-shrink: 0;
                }
              `,
            },
            properties: {
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: `{{t("Name")}}`,
                },
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'WorkflowVariableTextArea',
                'x-component-props': {
                  useTypedConstant: true,
                  placeholder: `{{t("Value")}}`,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: `{{t("Add parameter", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    data: {
      type: 'void',
      title: `{{t("Body", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'BodyComponent',
      // 'x-component-props': {
      //   changeOnSelect: true,
      //   autoSize: {
      //     minRows: 10,
      //   },
      //   placeholder: `{{t("Input request data", { ns: "${NAMESPACE}" })}}`,
      // },
      // description: `{{t("Only support standard JSON data", { ns: "${NAMESPACE}" })}}`,
    },
    timeout: {
      type: 'number',
      title: `{{t("Timeout config", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'InputNumber',
      'x-component-props': {
        addonAfter: `{{t("ms", { ns: "${NAMESPACE}" })}}`,
        min: 1,
        step: 1000,
        defaultValue: 5000,
      },
    },
    ignoreFail: {
      type: 'boolean',
      title: `{{t("Ignore failed request and continue workflow", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  };
  components = {
    ArrayItems,
    BodyComponent,
    WorkflowVariableTextArea,
    WorkflowVariableJSON,
  };
  useVariables({ key, title }, { types, fieldNames = defaultFieldNames }) {
    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }
}
