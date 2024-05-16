/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios, { AxiosRequestConfig } from 'axios';

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export interface Header {
  name: string;
  value: string;
}

export type RequestConfig = Pick<AxiosRequestConfig, 'url' | 'method' | 'params' | 'data' | 'timeout'> & {
  headers: Array<Header>;
  contentType: string;
  ignoreFail: boolean;
};

const ContentTypeTransformers = {
  'application/json'(data) {
    return data;
  },
  'application/x-www-form-urlencoded'(data: { name: string; value: string }[]) {
    return new URLSearchParams(
      data.filter(({ name, value }) => name && typeof value !== 'undefined').map(({ name, value }) => [name, value]),
    ).toString();
  },
};

async function request(config) {
  // default headers
  const { url, method = 'POST', contentType = 'application/json', data, timeout = 5000 } = config;
  const headers = (config.headers ?? []).reduce((result, header) => {
    if (header.name.toLowerCase() === 'content-type') {
      // header.value = ['application/json', 'application/x-www-form-urlencoded'].includes(header.value)
      //   ? header.value
      //   : 'application/json';
      return result;
    }
    return Object.assign(result, { [header.name]: header.value });
  }, {});
  const params = (config.params ?? []).reduce(
    (result, param) => Object.assign(result, { [param.name]: param.value }),
    {},
  );

  // TODO(feat): only support JSON type for now, should support others in future
  headers['Content-Type'] = contentType;

  return axios.request({
    url,
    method,
    headers,
    params,
    timeout,
    ...(method.toLowerCase() !== 'get' && data != null
      ? {
          data: ContentTypeTransformers[contentType](data),
        }
      : {}),
  });
}

export default class extends Instruction {
  async run(node: FlowNodeModel, prevJob, processor: Processor) {
    const config = processor.getParsedValue(node.config, node.id) as RequestConfig;

    const { workflow } = processor.execution;
    const sync = this.workflow.isWorkflowSync(workflow);

    if (sync) {
      try {
        const response = await request(config);
        return {
          status: JOB_STATUS.RESOLVED,
          result: response.data,
        };
      } catch (error) {
        return {
          status: config.ignoreFail ? JOB_STATUS.RESOLVED : JOB_STATUS.FAILED,
          result: error.isAxiosError ? error.toJSON() : error.message,
        };
      }
    }

    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // eslint-disable-next-line promise/catch-or-return
    request(config)
      .then((response) => {
        job.set({
          status: JOB_STATUS.RESOLVED,
          result: response.data,
        });
        processor.logger.info(`request (#${node.id}) response success, status: ${response.status}`);
      })
      .catch((error) => {
        job.set({
          status: JOB_STATUS.FAILED,
          result: error.isAxiosError ? error.toJSON() : error.message,
        });
        if (error.response) {
          processor.logger.info(`request (#${node.id}) response failed, status: ${error.response.status}`);
        } else {
          processor.logger.error(`request (#${node.id}) response failed: ${error.message}`);
        }
      })
      .finally(() => {
        this.workflow.resume(job);
      });

    processor.logger.info(`request (#${node.id}) sent to "${config.url}", waiting for response...`);

    return processor.exit();
  }

  async resume(node: FlowNodeModel, job, processor: Processor) {
    const { ignoreFail } = node.config as RequestConfig;
    if (ignoreFail) {
      job.set('status', JOB_STATUS.RESOLVED);
    }
    return job;
  }
}
