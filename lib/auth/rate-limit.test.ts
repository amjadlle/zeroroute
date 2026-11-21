import { afterEach, describe, expect, it } from "vitest";
import { getClientIp } from "./rate-limit";

describe("getClientIp", () => {
  afterEach(() => {
    delete process.env.CLIENT_IP_HEADER;
  });

  it("uses only the platform header (x-real-ip by default), ignoring spoofable ones", () => {
    const h = new Headers({ "x-real-ip": "1.1.1.1", "cf-connecting-ip": "6.6.6.6", "x-forwarded-for": "7.7.7.7" });
    expect(getClientIp(h)).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "cf-connecting-ip": "6.6.6.6", "x-forwarded-for": "7.7.7.7" }))).toBe("127.0.0.1");
  });

  it("reads the header named by CLIENT_IP_HEADER and takes the proxy-appended entry", () => {
    process.env.CLIENT_IP_HEADER = "x-forwarded-for";
    expect(getClientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 2.2.2.2" }))).toBe("2.2.2.2");
  });
});
