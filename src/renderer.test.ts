import { describe, expect, it } from "vitest";
import { isSoftwareRenderer } from "./renderer";

describe("isSoftwareRenderer", () => {
  it("detects software renderers", () => {
    expect(
      isSoftwareRenderer(
        "ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      ),
    ).toBe(true);
    expect(
      isSoftwareRenderer(
        "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
      ),
    ).toBe(true);
    expect(isSoftwareRenderer("llvmpipe (LLVM 17.0.6, 256 bits)")).toBe(true);
  });

  it("accepts graphics cards", () => {
    expect(
      isSoftwareRenderer(
        "ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      ),
    ).toBe(false);
    expect(
      isSoftwareRenderer(
        "ANGLE (AMD, AMD Radeon(TM) Graphics (0x000013C0) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      ),
    ).toBe(false);
  });
});
