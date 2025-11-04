import { wrap, type Remote } from "comlink";

export type WorkerBridge<T> = Remote<T>;

export const createWorkerBridge = <T>(url: URL): WorkerBridge<T> => {
  const worker = new Worker(url, { type: "module" });
  return wrap<T>(worker);
};
