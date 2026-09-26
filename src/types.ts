export type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
  QuartzFilterPlugin,
  QuartzFilterPluginInstance,
  QuartzPluginData,
  QuartzTransformerPlugin,
  QuartzTransformerPluginInstance,
  StaticResources,
  PageMatcher,
  PageGenerator,
  VirtualPage,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  FullSlug,
  FilePath,
} from "@quartz-community/types";

/**
 * 「属性显示链」配置：与 `configuration.aggregation` 同构 ——
 * 文件夹恒为第一层（只设 `folderDepth`），字段链写纯字段名（`string[]`）。
 * 语义：链 = **有序白名单**；链外字段仍可作为聚合维度，只是不在属性面板显示。
 */
export interface PropertiesChainConfiguration {
  /** 目录上下文层数（文件夹恒为第一层） */
  folderDepth?: number;
  branches?: {
    /** 字段名列表，顺序即面板行序；`[]` 表示该目录不显示任何属性 */
    default?: string[];
    /** 目录覆盖：未配置的目录逐层向上回退到 `default` */
    folders?: Record<string, string[]>;
  };
}

export interface NotePropertiesOptions {
  /** Include all frontmatter properties in the display. When false, only `includedProperties` are shown. */
  includeAll: boolean;
  /** Properties to include when `includeAll` is false. Ignored when `includeAll` is true. */
  includedProperties: string[];
  /** Properties to exclude from display. Applied after inclusion logic. */
  excludedProperties: string[];
  /** Hide the visual properties panel while still processing frontmatter and resolving links. */
  hidePropertiesView: boolean;
  /**
   * 按目录指定「显示哪些属性」（有序白名单）。配置后与 `includeAll: true` 互斥。
   * 未配置时沿用 `includeAll` / `includedProperties` / `excludedProperties` 的旧行为。
   */
  properties?: PropertiesChainConfiguration;
  /** Frontmatter delimiters. Defaults to "---". */
  delimiters: string | [string, string];
  /** Frontmatter language. Defaults to "yaml". */
  language: "yaml" | "toml";
  /**
   * Render HTML anchors (`<a ...>...</a>`) written inside frontmatter values instead of escaping
   * them as plain text. Lets a value carry `href` / `download` / link text independently.
   * Defaults to true.
   */
  htmlInProperties: boolean;
  /** Add `download` (+ `data-router-ignore`) to links whose target is an attachment. Defaults to true. */
  downloadAttachments: boolean;
  /** Explicit attachment extensions (with or without dot). Empty = "has an extension and is not a page". */
  attachmentExtensions: string[];
  /** Where the download file name comes from. Defaults to "alias". */
  downloadNameFrom: "alias" | "basename";
}
