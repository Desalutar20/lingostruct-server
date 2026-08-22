export const sleep = async (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

export const nowIso = () => new Date(Date.now()).toISOString();
