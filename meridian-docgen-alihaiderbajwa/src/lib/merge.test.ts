import { describe, expect, it } from "vitest";
import { mergeTemplate, slugifyLabel } from "@/lib/merge";

describe("mergeTemplate", () => {
  it("replaces a present token with its value", () => {
    expect(mergeTemplate("Hi {{name}}", { name: "Ali" })).toBe("Hi Ali");
  });

  it("uses [Not provided] for a known token with no answer", () => {
    expect(mergeTemplate("Hi {{name}}", { name: "" })).toBe("Hi [Not provided]");
  });

  it("uses the inline fallback when the answer is missing", () => {
    expect(mergeTemplate("I am {{spouse|not married}} married", {})).toBe(
      "I am not married married",
    );
  });

  it("uses the answer over the inline fallback when both exist", () => {
    expect(mergeTemplate("I am {{spouse|not married}} married", { spouse: "Ayesha" })).toBe(
      "I am Ayesha married",
    );
  });

  it("leaves unknown tokens untouched", () => {
    expect(mergeTemplate("Body {{unknown_token}} end", { name: "Ali" })).toBe(
      "Body {{unknown_token}} end",
    );
  });

  it("returns empty string for a null body", () => {
    expect(mergeTemplate(null, { name: "Ali" })).toBe("");
  });

  it("replaces multiple tokens in one pass", () => {
    const body = "{{a}} and {{b}} and {{a}}";
    expect(mergeTemplate(body, { a: "1", b: "2" })).toBe("1 and 2 and 1");
  });
});

describe("slugifyLabel", () => {
  it("lowercases and converts spaces to underscores", () => {
    expect(slugifyLabel("Client Name")).toBe("client_name");
  });

  it("strips punctuation", () => {
    expect(slugifyLabel("Duration (Years)")).toBe("duration_years");
  });
});
