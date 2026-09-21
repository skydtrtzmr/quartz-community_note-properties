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

export interface NotePropertiesOptions {
  /** Include all frontmatter properties in the display. When false, only `includedProperties` are shown. */
  includeAll: boolean;
  /** Properties to include when `includeAll` is false. Ignored when `includeAll` is true. */
  includedProperties: string[];
  /** Properties to exclude from display. Applied after inclusion logic. */
  excludedProperties: string[];
  /** Hide the visual properties panel while still processing frontmatter and resolving links. */
  hidePropertiesView: boolean;
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
