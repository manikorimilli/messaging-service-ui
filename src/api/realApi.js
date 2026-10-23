import { request } from './httpClient.js';

const providerPath = (id) => `/api/v1/providers/${encodeURIComponent(id)}`;

export const listProviders = () => request('GET', '/api/v1/providers');
export const getProvider = (id) => request('GET', providerPath(id));
export const registerProvider = (payload) => request('POST', '/api/v1/providers', payload);
export const updateProvider = (id, payload) => request('PUT', providerPath(id), payload);
export const deleteProvider = (id) => request('DELETE', providerPath(id));
export const sendSms = (payload) => request('POST', '/api/v1/messages', payload);
export const sendBatchSms = (payload) => request('POST', '/api/v1/messages/batch', payload);
export const listJobRuns = () => request('GET', '/api/v1/job-runs');
export const getJobRun = (runId) => request('GET', `/api/v1/job-runs/${encodeURIComponent(runId)}`);
