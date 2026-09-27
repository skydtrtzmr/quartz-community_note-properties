/**
 * 「属性显示链」的最小解析实现 —— 与 `configuration.aggregation` **同构**：
 * - 文件夹恒为第一层，只设 `folderDepth`（不再写 `type: folder`）
 * - 字段链写纯字段名（`string[]`），不再写 `{ type: field, field }`
 * - 未配置的目录逐层向上回退到 `branches.default`；空数组等价于未配置（**没有**「显式中断」态）
 *
 * 与 aggregation-pro 的 compiler 保持同款口径（`directoryKey` / `resolveChain`），
 * 但这里跑在**构建期**、按每个文件的 `file.data.slug` 求链，因此不需要产物。
 *
 * 容错策略：非法配置**直接抛错**（与 aggregation-pro 一致），构建期即暴露问题。
 */
import { slugifyPath } from "@quartz-community/utils/path";

export interface PropertiesChain {
  /** 目录上下文层数 */
  depth: number;
  /** 未命中任何目录覆盖时使用的字段链 */
  default: string[];
  /** 目录 → 字段链（键已按 slug 拼写规范化） */
  folders: Record<string, string[]>;
}

const base = "options.properties";

function fail(path: string, message: string): never {
  throw new Error(`[NoteProperties] ${path}: ${message}`);
}

function warn(message: string): void {
  console.warn(`[NoteProperties] ${message}`);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, allowed: string[], path: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${path}.${key}`, "unknown key");
  }
}

/** 字段链：纯字段名数组 */
function fieldNames(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array of field names");
  }
  return value.map((item, index) => {
    if (typeof item !== "string" || !item.trim()) {
      fail(`${path}[${index}]`, "expected a non-empty field name");
    }
    return item.trim();
  });
}

/** 目录键规范化：与 aggregation-pro 的 directoryKey 同口径；拒绝 `.` / `..` / 空段 */
function directoryKey(value: string, path: string): string {
  if (value === "/") return "/";
  const clean = value.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    fail(path, "expected a content-relative directory path");
  }
  const normalized = slugifyPath(clean);
  if (normalized.split("/").some((part) => !part)) {
    fail(path, "directory becomes empty after normalization");
  }
  return normalized;
}

export function normalizePropertiesChain(value: unknown): PropertiesChain {
  const input = object(value, base);
  keys(input, ["folderDepth", "branches"], base);

  const rawDepth = input.folderDepth;
  const depth = rawDepth === undefined ? 1 : rawDepth;
  if (typeof depth !== "number" || !Number.isInteger(depth) || depth < 1) {
    fail(`${base}.folderDepth`, "expected an integer >= 1");
  }

  const branches = input.branches === undefined ? {} : object(input.branches, `${base}.branches`);
  keys(branches, ["default", "folders"], `${base}.branches`);

  const foldersRaw =
    branches.folders === undefined ? {} : object(branches.folders, `${base}.branches.folders`);
  const entries = new Map<string, string[]>();
  // 归一化后的目录键全集：查重用它而不是 entries（空链会被丢弃，不能只看结果表）
  const seen = new Set<string>();
  for (const [key, value] of Object.entries(foldersRaw)) {
    const path = `${base}.branches.folders[${JSON.stringify(key)}]`;
    const normalized = directoryKey(key, path);
    if (seen.has(normalized)) fail(path, `duplicate normalized directory: ${normalized}`);
    seen.add(normalized);
    const chain = fieldNames(value, path);
    // 目录级只有两态：「配了字段」与「未配置」。空数组按未配置丢弃（不再表示「隐藏全部属性」）
    if (chain.length === 0) {
      warn(`${path} 是空数组，等价于未配置该目录，将逐层向上继承（最终用 ${base}.branches.default）`);
      continue;
    }
    entries.set(normalized, chain);
  }

  return {
    depth,
    default:
      branches.default === undefined ? [] : fieldNames(branches.default, `${base}.branches.default`),
    folders: Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  };
}

/** 目录（而非文件）所属的上下文：按 depth 截断；根目录返回 "/" */
export function contextOfFolder(folder: string, depth: number): string {
  const parts = folder
    .split("/")
    .filter((part) => part.length > 0)
    .slice(0, Math.max(1, depth));
  return parts.join("/") || "/";
}

/**
 * 源文件 slug → 显示链（`null` 表示未配置显示链，调用方沿用旧行为）。
 * 与 aggregation-pro 一致：用**完整 slug（保留 `/index`）**推导目录，因此目录页归属它自己的目录。
 */
export function propertiesChainOf(config: PropertiesChain | null, slug: string): string[] | null {
  if (!config) return null;
  const folder = slug.split("/").slice(0, -1).join("/");
  let current = contextOfFolder(folder, config.depth);
  while (current) {
    // 目录级没有「显式中断」态：空链在归一化阶段已被丢弃，这里再按长度兜一层
    const chain = config.folders[current];
    if (chain && chain.length > 0) return chain;
    const slash = current.lastIndexOf("/");
    current = slash > 0 ? current.slice(0, slash) : "";
  }
  return config.default;
}
