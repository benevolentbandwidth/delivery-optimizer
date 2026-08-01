export type UploadOperation = {
  start: () => number;
  invalidate: () => void;
  isCurrent: (operation: number) => boolean;
};

export function createUploadOperation(): UploadOperation {
  let currentOperation = 0;

  return {
    start: () => {
      currentOperation += 1;
      return currentOperation;
    },
    invalidate: () => {
      currentOperation += 1;
    },
    isCurrent: (operation) => currentOperation === operation,
  };
}
