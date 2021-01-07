export enum OperationStatus {
  None,
  InProgress,
  Finished,
  Failed,
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const urls = {
  schema: `${baseUrl}/schema`,
  entity: (id: string): string => `${baseUrl}/entities/${id}`,
};

export async function fetchJsonAsync<T>(
  input: RequestInfo,
  init?: RequestInit,
  setOperationStatus?: (status: OperationStatus) => void
): Promise<T> {
  try {
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.InProgress);
    }
    const response = await fetch(input, init);
    if (!response.ok) {
      const responseText = await response.text();
      throw Error(`Failed request (${response.status}), ${responseText}`);
    }
    const json = await response.json();
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.Finished);
    }
    return json;
  } catch (error) {
    if (setOperationStatus) {
      setOperationStatus(OperationStatus.Failed);
    }
    throw error;
  }
}
