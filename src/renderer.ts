// Software renderers draw on the CPU, so the game crawls. Basic Render Driver
// is the Windows one, SwiftShader is Chrome's, llvmpipe and softpipe are Linux ones.
const SOFTWARE_RENDERERS = /basic render driver|swiftshader|llvmpipe|softpipe/i;

export function isSoftwareRenderer(renderer: string): boolean {
  return SOFTWARE_RENDERERS.test(renderer);
}
