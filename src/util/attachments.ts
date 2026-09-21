/**
 * 附件（资源文件）判定与下载属性拼装。
 *
 * ⚠️ 本文件在 `note-properties-pro` 与 `crawl-links-pro` 两个 fork 里各存一份、内容同源
 * （避免跨仓依赖，同时保证 frontmatter 与正文两条渲染路径行为一致）。
 *
 * 规则：
 * - 目标是"资源文件"（带扩展名、且不是页面 `.md/.html/.htm`）即视为附件
 * - `attachmentExtensions` 非空时改为按显式白名单判定
 * - 命中即给 `<a>` 挂 `download`（另存名）+ `data-router-ignore`（跳过 SPA 路由）
 */

const PAGE_EXTENSIONS = new Set([".md", ".html", ".htm"]);

export type DownloadNameSource = "alias" | "basename";

export interface AttachmentOptions {
  /** 是否给附件链接挂 download 属性（默认 true） */
  downloadAttachments?: boolean;
  /** 显式附件扩展名（可带或不带点）。为空 = 用"带扩展名且非页面"的宽松判定 */
  attachmentExtensions?: string[];
  /** download 的另存名来源：alias（别名优先，回退 basename）或 basename（始终用目标文件名） */
  downloadNameFrom?: DownloadNameSource;
}

/** 去掉 query / hash，取路径最后一段 */
function lastSegment(target: string): string {
  const clean = target.split("#")[0]!.split("?")[0]!;
  return clean.split("/").pop() ?? "";
}

/** 取扩展名（小写，含点）；无扩展名或隐藏文件返回空串 */
export function fileExtensionOf(target: string): string {
  const base = lastSegment(target);
  const idx = base.lastIndexOf(".");
  if (idx <= 0) return "";
  return base.slice(idx).toLowerCase();
}

/** 目标路径的文件名（用于另存名），已解码百分号编码 */
export function basenameOf(target: string): string {
  const base = lastSegment(target);
  try {
    return decodeURIComponent(base) || "download";
  } catch {
    return base || "download";
  }
}

/** 是否附件：显式白名单优先；否则"带扩展名且不是页面" */
export function isAttachmentTarget(target: string, exts?: string[]): boolean {
  if (!target) return false;
  const ext = fileExtensionOf(target);
  if (!ext) return false;
  if (exts && exts.length > 0) {
    const wanted = new Set(
      exts.map((e) => (e.startsWith(".") ? e : `.${e}`)).map((e) => e.toLowerCase()),
    );
    return wanted.has(ext);
  }
  return !PAGE_EXTENSIONS.has(ext);
}

/**
 * 另存名：`alias` 模式下，别名只有"看起来像文件名"（自带扩展名）时才采用，
 * 否则回退目标文件名 —— 避免把"下载"这类 UI 文案当文件名，下载出没有后缀的文件。
 */
export function downloadNameFor(
  target: string,
  label?: string,
  nameFrom: DownloadNameSource = "alias",
): string {
  if (nameFrom === "alias" && label && fileExtensionOf(label)) {
    // 别名可能是路径形态（`assets/x.pdf`）→ 只取文件名
    return basenameOf(label.trim());
  }
  return basenameOf(target);
}

/** 生成要挂到 `<a>` 上的属性；判定不命中或已关闭时返回空对象 */
export function buildDownloadProps(
  target: string,
  label?: string,
  opts?: AttachmentOptions,
): Record<string, string> {
  if (opts?.downloadAttachments === false) return {};
  if (!isAttachmentTarget(target, opts?.attachmentExtensions)) return {};
  return {
    download: downloadNameFor(target, label, opts?.downloadNameFrom ?? "alias"),
    "data-router-ignore": "",
  };
}
