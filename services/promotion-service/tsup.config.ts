import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"],
  clean: true,
  noExternal: [/^@shop\//], // bundle our workspace packages, keep npm deps external
});
