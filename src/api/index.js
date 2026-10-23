// The only module pages import for data. It builds the exact request bodies
// from the backend contract and hands them to either the mock or the real API.
import { config } from '../config.js';
import { camelizeKeys } from '../utils/keys.js';
import { toWritePayload } from '../utils/providerConfig.js';
import * as mockApi from './mockApi.js';
import * as realApi from './realApi.js';

export { ApiError } from './ApiError.js';

const impl = config.useMockApi ? mockApi : realApi;

// An empty provider means "use the primary provider": the field is omitted.
export function buildSmsRequest({ provider, to, body }) {
  return { type: 'SMS', ...(provider ? { provider } : {}), to, body };
}

export function buildBatchRequest({ provider, recipients, body }) {
  return { type: 'SMS', ...(provider ? { provider } : {}), recipients, body };
}

export const api = {
  listProviders: () => impl.listProviders(),
  getProvider: (id) => impl.getProvider(id),
  registerProvider: (cfg) => impl.registerProvider(toWritePayload(cfg)),
  updateProvider: (id, cfg) => impl.updateProvider(id, toWritePayload(cfg)),
  // The backend has no PATCH: enabling or disabling sends the full config.
  // Masked secrets (****) in the fetched config tell the backend to keep the stored values.
  async setProviderEnabled(id, enabled) {
    const current = await impl.getProvider(id);
    return impl.updateProvider(id, toWritePayload({ ...current, enabled }));
  },
  deleteProvider: (id) => impl.deleteProvider(id),
  sendSms: (input) => impl.sendSms(buildSmsRequest(input)),
  sendBatchSms: (input) => impl.sendBatchSms(buildBatchRequest(input)),
  // Runs of the backend's scheduled job, newest first. Read-only.
  listJobRuns: async () => camelizeKeys(await impl.listJobRuns()),
  getJobRun: async (runId) => camelizeKeys(await impl.getJobRun(runId)),
};
