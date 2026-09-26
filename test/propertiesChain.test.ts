import { describe, expect, it } from "vitest";
import {
  contextOfFolder,
  normalizePropertiesChain,
  propertiesChainOf,
} from "../src/util/propertiesChain";

const config = normalizePropertiesChain({
  folderDepth: 1,
  branches: {
    default: ["date", "type"],
    folders: { 项目: ["阶段", "type"], 任务: [], "组织/子": ["x"] },
  },
});

describe("属性显示链（与 configuration.aggregation 同构）", () => {
  it("命中目录覆盖；未配置的目录逐层回退到 default", () => {
    expect(propertiesChainOf(config, "项目/proj-00001")).toEqual(["阶段", "type"]);
    // 目录页保留 /index → 归属自己的目录
    expect(propertiesChainOf(config, "项目/index")).toEqual(["阶段", "type"]);
    expect(propertiesChainOf(config, "人员/person-00001")).toEqual(["date", "type"]);
    expect(propertiesChainOf(config, "index")).toEqual(["date", "type"]);
  });

  it("显式 [] 停止继承，不落到父目录 / default", () => {
    expect(propertiesChainOf(config, "任务/task-00001")).toEqual([]);
    expect(propertiesChainOf(config, "任务/子/x")).toEqual([]);
  });

  it("folderDepth > 1 时按更深目录命中", () => {
    const deep = normalizePropertiesChain({
      folderDepth: 2,
      branches: { default: [], folders: { "组织/子": ["x"] } },
    });
    expect(contextOfFolder("组织/子", 2)).toBe("组织/子");
    expect(propertiesChainOf(deep, "组织/子/a")).toEqual(["x"]);
    expect(propertiesChainOf(deep, "组织/其他/a")).toEqual([]);
  });

  it("未配置 properties 时返回 null（调用方沿用旧行为）", () => {
    expect(propertiesChainOf(null, "项目/a")).toBeNull();
  });

  it("缺省：folderDepth=1、default=[]（该目录不显示任何属性）", () => {
    const empty = normalizePropertiesChain({});
    expect(empty.depth).toBe(1);
    expect(empty.default).toEqual([]);
    expect(propertiesChainOf(empty, "任意/a")).toEqual([]);
  });

  it.each([
    [{ typo: true }, "unknown key"],
    [{ folderDepth: 0 }, "folderDepth"],
    [{ folderDepth: 1.5 }, "folderDepth"],
    [{ branches: { default: "a" } }, "expected an array"],
    [{ branches: { default: [""] } }, "non-empty field name"],
    [{ branches: { default: [123] } }, "non-empty field name"],
    [{ branches: { folders: { "../a": [] } } }, "directory path"],
    [{ branches: { folders: { "A B": [], "a-b": [] } } }, "duplicate normalized"],
  ] as Array<[unknown, string]>)("非法配置直接抛错", (value, message) => {
    expect(() => normalizePropertiesChain(value)).toThrow(String(message));
  });
});
