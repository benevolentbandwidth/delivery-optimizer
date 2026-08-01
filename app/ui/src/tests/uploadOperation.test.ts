import { describe, expect, it, vi } from "vitest";
import { createUploadOperation } from "@/app/utils/uploadOperation";

describe("createUploadOperation", () => {
  it("prevents a cancelled upload from committing after its file read resolves", async () => {
    const operation = createUploadOperation();
    const pendingUpload = operation.start();
    let resolveFileRead!: (content: string) => void;
    const fileRead = new Promise<string>((resolve) => {
      resolveFileRead = resolve;
    });
    const writeStorage = vi.fn();

    operation.invalidate();
    resolveFileRead("file contents");

    await fileRead.then((content) => {
      if (operation.isCurrent(pendingUpload)) {
        writeStorage(content);
      }
    });

    expect(writeStorage).not.toHaveBeenCalled();
  });

  it("keeps only the latest upload operation current", () => {
    const operation = createUploadOperation();
    const firstUpload = operation.start();
    const latestUpload = operation.start();

    expect(operation.isCurrent(firstUpload)).toBe(false);
    expect(operation.isCurrent(latestUpload)).toBe(true);
  });

  it("prevents a cancelled upload from reporting error after its file read rejects", async () => {
    const operation = createUploadOperation();
    const pendingUpload = operation.start();
    let rejectFileRead!: (error: Error) => void;
    const fileRead = new Promise<string>((_resolve, reject) => {
      rejectFileRead = reject;
    });
    const setError = vi.fn();

    operation.invalidate();
    rejectFileRead(new Error("read failed"));

    await fileRead.catch((error: Error) => {
      if (operation.isCurrent(pendingUpload)) {
        setError(error.message);
      }
    });

    expect(setError).not.toHaveBeenCalled();
  });
});
