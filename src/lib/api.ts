const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const apiUrl = (path: string) => `${BASE_PATH}${path}`;
export const apiFetch = (path: string, init?: RequestInit) => fetch(apiUrl(path), init);
