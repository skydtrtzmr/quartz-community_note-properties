import { describe, expect, it } from "vitest";
import {
  basenameOf,
  buildDownloadProps,
  downloadNameFor,
  fileExtensionOf,
  isAttachmentTarget,
} from "../src/util/attachments";

describe("fileExtensionOf", () => {
  it("取扩展名并小写化", () => {
    expect(fileExtensionOf("assets/DCOM手册.PDF")).toBe(".pdf");
    expect(fileExtensionOf("./assets/x.docx")).toBe(".docx");
  });

  it("忽略 query / hash", () => {
    expect(fileExtensionOf("assets/x.pdf?v=2")).toBe(".pdf");
    expect(fileExtensionOf("assets/x.pdf#page=3")).toBe(".pdf");
  });

  it("无扩展名 / 隐藏文件返回空串", () => {
    expect(fileExtensionOf("组织/index")).toBe("");
    expect(fileExtensionOf("assets/.gitignore")).toBe("");
  });
});

describe("isAttachmentTarget", () => {
  it("默认规则：带扩展名且不是页面 → 附件", () => {
    expect(isAttachmentTarget("assets/x.pdf")).toBe(true);
    expect(isAttachmentTarget("assets/x.docx")).toBe(true);
    expect(isAttachmentTarget("assets/x.zip")).toBe(true);
  });

  it("页面（.md/.html/.htm）不是附件", () => {
    expect(isAttachmentTarget("组织/index.md")).toBe(false);
    expect(isAttachmentTarget("组织/index.html")).toBe(false);
  });

  it("无扩展名的站内链接不是附件", () => {
    expect(isAttachmentTarget("组织/org-00001")).toBe(false);
    expect(isAttachmentTarget("组织")).toBe(false);
  });

  it("配了白名单时只认白名单", () => {
    const exts = ["pdf", ".docx"];
    expect(isAttachmentTarget("assets/x.pdf", exts)).toBe(true);
    expect(isAttachmentTarget("assets/x.docx", exts)).toBe(true);
    expect(isAttachmentTarget("assets/x.zip", exts)).toBe(false);
  });
});

describe("downloadNameFor", () => {
  const target = "assets/垃圾环保发电厂智慧运营管控平台解决方案v3.0(1)(1).docx";

  it("别名带扩展名时用别名（默认 alias 模式）", () => {
    expect(downloadNameFor(target, "垃圾方案.docx")).toBe("垃圾方案.docx");
  });

  it("别名不含扩展名（UI 文案）时回退目标文件名", () => {
    expect(downloadNameFor(target, "下载")).toBe(basenameOf(target));
  });

  it("basename 模式始终用目标文件名", () => {
    expect(downloadNameFor(target, "垃圾方案.docx", "basename")).toBe(basenameOf(target));
  });
});

describe("buildDownloadProps", () => {
  it("命中附件时给出 download + data-router-ignore", () => {
    expect(buildDownloadProps("assets/x.pdf", "x.pdf")).toEqual({
      download: "x.pdf",
      "data-router-ignore": "",
    });
  });

  it("非附件返回空对象（普通站内链接不受影响）", () => {
    expect(buildDownloadProps("组织/org-00001", "组织-00001")).toEqual({});
  });

  it("开关关闭时不加属性", () => {
    expect(buildDownloadProps("assets/x.pdf", "x.pdf", { downloadAttachments: false })).toEqual({});
  });
});
