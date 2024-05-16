/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import React, { FC, useCallback, useMemo } from 'react';
import { useActionContext, SchemaComponent } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { SchemaInitializerItem } from './SchemaInitializerItem';

export interface SchemaInitializerActionModalProps {
  title: string;
  schema: any;
  onCancel?: () => void;
  onSubmit?: (values: any) => void;
  buttonText?: any;
  component?: any;
  isItem?: boolean;
}

const SchemaInitializerActionModalItemComponent = React.forwardRef((props: any, ref) => {
  const { onClick, title, ...others } = props;
  return (
    <SchemaInitializerItem
      ref={ref}
      {...others}
      onClick={(e) => {
        onClick?.(e.event);
      }}
    ></SchemaInitializerItem>
  );
});

export const SchemaInitializerActionModal: FC<SchemaInitializerActionModalProps> = (props) => {
  const { title, schema, buttonText, isItem, component, onCancel, onSubmit } = props;
  const useCancelAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await onCancel?.();
        ctx.setVisible(false);
        void form.reset();
      },
    };
  }, [onCancel]);

  const useSubmitAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await form.validate();
        await onSubmit?.(form.values);
        ctx.setVisible(false);
        void form.reset();
      },
    };
  }, [onSubmit]);
  const defaultSchema = useMemo(() => {
    return {
      type: 'void',
      properties: {
        action1: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': component
            ? {
                component,
              }
            : isItem
              ? {
                  title: buttonText,
                  component: SchemaInitializerActionModalItemComponent,
                }
              : {
                  icon: 'PlusOutlined',
                  style: {
                    borderColor: 'var(--colorSettings)',
                    color: 'var(--colorSettings)',
                  },
                  title: buttonText,
                  type: 'dashed',
                },
          properties: {
            drawer1: {
              'x-decorator': 'Form',
              'x-component': 'Action.Modal',
              'x-component-props': {
                style: {
                  maxWidth: '520px',
                  width: '100%',
                },
              },
              type: 'void',
              title,
              properties: {
                ...(schema?.properties || schema),
                footer: {
                  'x-component': 'Action.Modal.Footer',
                  type: 'void',
                  properties: {
                    cancel: {
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction: useCancelAction,
                      },
                    },
                    submit: {
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: useSubmitAction,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }, [buttonText, component, schema, title, useCancelAction, useSubmitAction]);

  return <SchemaComponent schema={defaultSchema as any} />;
};

export const SchemaInitializerActionModalInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerActionModalProps>();
  return <SchemaInitializerActionModal {...itemConfig} />;
};
