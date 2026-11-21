import { describe, expect, it } from "vitest";
import { PROVIDER_CATALOGS, PROVIDER_PORTALS } from "./catalog";
import { providers } from "./providers";
import { DEFAULT_PROVIDER_MODELS } from "./state";

const catalogIds = (providerId: string) =>
  PROVIDER_CATALOGS[providerId].categories.flatMap((c) => c.models.map((m) => m.id));

describe("provider catalog integrity", () => {
  const providerIds = providers.map((p) => p.id).sort();

  it("has a catalog, a key portal and a default model list for every routable provider", () => {
    expect(Object.keys(PROVIDER_CATALOGS).sort()).toEqual(providerIds);
    expect(Object.keys(PROVIDER_PORTALS).sort()).toEqual(providerIds);
    expect(Object.keys(DEFAULT_PROVIDER_MODELS).sort()).toEqual(providerIds);
  });

  it("uses unique provider ids", () => {
    expect(new Set(providerIds).size).toBe(providerIds.length);
  });

  it.each(Object.keys(PROVIDER_CATALOGS))("%s: model ids are unique and every model has the required fields", (id) => {
    const models = PROVIDER_CATALOGS[id].categories.flatMap((c) => c.models);
    expect(models.length).toBeGreaterThan(0);
    const ids = models.map((m) => m.id);
    expect(ids.filter((m, i) => ids.indexOf(m) !== i)).toEqual([]);
    for (const m of models) {
      for (const field of ["id", "name", "rpm", "latency", "ctx", "maxOut"] as const) {
        expect(m[field], `${id}/${m.id}.${field}`).toBeTruthy();
      }
    }
  });

  it.each(Object.keys(DEFAULT_PROVIDER_MODELS))("%s: every default model exists in the catalog", (id) => {
    const missing = DEFAULT_PROVIDER_MODELS[id].filter((m) => !catalogIds(id).includes(m));
    expect(missing).toEqual([]);
  });

  it.each(providers.map((p) => [p.id, p.model] as const))("%s: built-in model %s exists in the catalog", (id, model) => {
    expect(catalogIds(id)).toContain(model);
  });

  it("links key portals over https", () => {
    for (const url of Object.values(PROVIDER_PORTALS)) expect(url).toMatch(/^https:\/\//);
  });
});
