import { describe, expect, it } from "vitest";
import { checkSecret } from "./auth";

describe("checkSecret", () => {
  it("devuelve not_configured si no hay secret esperado", () => {
    expect(checkSecret({ provided: "abc", expected: null })).toBe("not_configured");
    expect(checkSecret({ provided: "abc", expected: "" })).toBe("not_configured");
    expect(checkSecret({ provided: null, expected: undefined })).toBe("not_configured");
  });

  it("devuelve invalid si no se envia secret", () => {
    expect(checkSecret({ provided: null, expected: "s3cret" })).toBe("invalid");
    expect(checkSecret({ provided: "", expected: "s3cret" })).toBe("invalid");
  });

  it("devuelve invalid si el secret no coincide", () => {
    expect(checkSecret({ provided: "otro", expected: "s3cret" })).toBe("invalid");
    expect(checkSecret({ provided: "s3cretX", expected: "s3cret" })).toBe("invalid");
  });

  it("devuelve ok si el secret coincide exactamente", () => {
    expect(checkSecret({ provided: "s3cret", expected: "s3cret" })).toBe("ok");
  });
});
