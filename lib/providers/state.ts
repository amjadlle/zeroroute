import { providers, isProviderConfigured } from "./providers";
import type { ProviderRuntimeState } from "./types";

export const DEFAULT_PROVIDER_MODELS: Record<string, string[]> = {
  groq: [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "allam-2-7b",
    "groq/compound-mini"
  ],
  cerebras: [
    "gpt-oss-120b",
    "qwen-3.8-27b"
  ],
  sambanova: [
    "MiniMax-M2.7",
    "gemma-4-31B-it",
    "Meta-Llama-3.3-70B-Instruct",
    "gpt-oss-120b",
    "DeepSeek-V3.2",
    "DeepSeek-V3.1",
    "MiniMax-M3"
  ],
  mistral: [
    "open-mistral-nemo",
    "ministral-3b-2512",
    "codestral-latest",
    "ministral-14b-2512",
    "open-mistral-7b"
  ],
  cohere: [
    "command-r-plus-08-2024",
    "command-a-03-2025",
    "command-r7b-12-2024",
    "command-a-plus-05-2026",
    "c4ai-aya-expanse-32b",
    "command-r-08-2024"
  ],
  gemini: [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemma-4-26b-a4b-it",
    "gemini-3.7-flash"
  ],
  openrouter: [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "cohere/north-mini-code:free",
    "openrouter/free"
  ],
  nvidia: [
    "nvidia/nemotron-3.5-lightning-30b-a3b",
    "nvidia/nemotron-3-super-120b-a12b",
    "deepseek-ai/deepseek-r1",
    "deepseek-ai/deepseek-v3",
    "meta/llama-3.2-11b-vision-instruct",
    "mistralai/mistral-large-2-instruct",
    "google/gemma-4-31b-it"
  ],
  cloudflare: [
    "@cf/meta/llama-3.1-8b-instruct",
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "@cf/meta/llama-3.2-3b-instruct",
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    "@cf/mistralai/mistral-small-3.1-24b-instruct",
    "@cf/qwen/qwen2.5-coder-32b-instruct"
  ],
  huggingface: [
    "meta-llama/Llama-3.1-8B-Instruct",
    "meta-llama/Llama-3.2-3B-Instruct",
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
    "Qwen/Qwen2.5-72B-Instruct",
    "BAAI/bge-large-en-v1.5"
  ],
  bazaarlink: [
    "qwen/qwen3.7-flash:free",
    "auto:free"
  ]
};

export const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 12000);
export const COOLDOWN_MS = Number(process.env.COOLDOWN_MS ?? 60000);

export const runtimeStateMap = new Map<string, ProviderRuntimeState>();

providers.forEach((p, idx) => {
  const defaultModels = DEFAULT_PROVIDER_MODELS[p.id] || [p.model];
  const primaryModel = defaultModels[0] || p.model;

  runtimeStateMap.set(p.id, {
    id: p.id,
    name: p.name,
    model: primaryModel,
    models: [...defaultModels],
    enabled: true,
    order: idx + 1,
    configured: isProviderConfigured(p.id),
    consecutiveFailures: 0,
    cooldownUntil: 0
  });
});

export const getRuntimeProviders = (): ProviderRuntimeState[] =>
  Array.from(runtimeStateMap.values())
    .map(p => {
      p.configured = isProviderConfigured(p.id);
      return p;
    })
    .sort((a, b) => a.order - b.order);

export async function loadSavedProviderConfigs(): Promise<void> {
  try {
    const { getDb, initDb } = await import("../db");
    await initDb();
    const db = getDb();
    const res = await db.execute("SELECT * FROM provider_configs");
    if (res && res.rows && res.rows.length > 0) {
      res.rows.forEach((row: any) => {
        const existing = runtimeStateMap.get(row.id as string);
        if (existing) {
          if (row.enabled !== undefined) existing.enabled = Boolean(row.enabled);
          const sortOrder = row.sort_order ?? row.priority ?? row.order;
          if (typeof sortOrder === "number" && !isNaN(sortOrder)) existing.order = sortOrder;
          const primaryModel = row.primary_model ?? row.model;
          if (primaryModel && typeof primaryModel === "string" && primaryModel.trim()) {
            existing.model = primaryModel.trim();
          }
          const modelsVal = row.models;
          if (modelsVal) {
            try {
              const parsed = typeof modelsVal === "string" ? JSON.parse(modelsVal) : modelsVal;
              if (Array.isArray(parsed) && parsed.length > 0) {
                existing.models = parsed.map((m: any) => String(m).trim()).filter(Boolean);
                if (existing.models.length > 0 && !existing.model) {
                  existing.model = existing.models[0];
                }
              }
            } catch {}
          }
          const p = providers.find(x => x.id === row.id);
          if (p) p.model = existing.model;
        }
      });
    }
  } catch (e) {
    console.error("Could not load provider configs from db:", e);
  }
}

export async function persistProviderConfigs(items: ProviderRuntimeState[]): Promise<void> {
  try {
    const { getDb, initDb } = await import("../db");
    await initDb();
    const db = getDb();
    const now = Date.now();
    for (const item of items) {
      const pName = item.name || providers.find(x => x.id === item.id)?.name || item.id;
      const primaryModel = item.model || (item.models && item.models[0]) || "";
      const modelsJson = JSON.stringify(item.models && item.models.length > 0 ? item.models : [primaryModel]);
      
      try {
        await db.execute({
          sql: `INSERT INTO provider_configs (id, name, enabled, priority, sort_order, primary_model, models, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name,
                  enabled = excluded.enabled,
                  priority = excluded.priority,
                  sort_order = excluded.sort_order,
                  primary_model = excluded.primary_model,
                  models = excluded.models,
                  updated_at = excluded.updated_at`,
          args: [
            item.id,
            pName,
            item.enabled ? 1 : 0,
            item.order,
            item.order,
            primaryModel,
            modelsJson,
            now
          ]
        });
      } catch (insertErr: any) {
        console.warn(`[PersistProviderConfigs Warning for ${item.id}]:`, insertErr.message);
        try {
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN name TEXT DEFAULT '';`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN priority INTEGER DEFAULT 1;`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN sort_order INTEGER DEFAULT 1;`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN primary_model TEXT DEFAULT '';`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN models TEXT DEFAULT '[]';`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN updated_at INTEGER DEFAULT 0;`);
          await db.execute(`ALTER TABLE provider_configs ADD COLUMN enabled INTEGER DEFAULT 1;`);
          await db.execute({
            sql: `INSERT INTO provider_configs (id, name, enabled, priority, sort_order, primary_model, models, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    enabled = excluded.enabled,
                    priority = excluded.priority,
                    sort_order = excluded.sort_order,
                    primary_model = excluded.primary_model,
                    models = excluded.models,
                    updated_at = excluded.updated_at`,
            args: [
              item.id,
              pName,
              item.enabled ? 1 : 0,
              item.order,
              item.order,
              primaryModel,
              modelsJson,
              now
            ]
          });
        } catch (e2) {
          console.error(`[PersistProviderConfigs Fatal for ${item.id}]:`, e2);
        }
      }
    }
  } catch (e) {
    console.error("Could not persist provider configs to db:", e);
  }
}

export const getEligibleProviders = (requestedTarget?: string) => {
  const all = getRuntimeProviders().filter(p => p.enabled && p.configured);
  const now = Date.now();
  const ready = all.filter(p => !p.cooldownUntil || p.cooldownUntil <= now);
  const cooling = all.filter(p => p.cooldownUntil && p.cooldownUntil > now);
  cooling.sort((a, b) => a.cooldownUntil - b.cooldownUntil);

  const ordered = [...ready, ...cooling]
    .map(p => ({ state: p, provider: providers.find(x => x.id === p.id)! }))
    .filter(x => Boolean(x.provider));

  if (requestedTarget && requestedTarget !== "auto" && requestedTarget !== "default") {
    const idx = ordered.findIndex(
      x =>
        x.provider.id === requestedTarget ||
        x.provider.model.toLowerCase() === requestedTarget.toLowerCase() ||
        (x.state.models && x.state.models.some(m => m.toLowerCase() === requestedTarget.toLowerCase()))
    );
    if (idx !== -1) {
      const target = ordered.splice(idx, 1)[0];
      return [target, ...ordered];
    }
  }

  return ordered;
};
