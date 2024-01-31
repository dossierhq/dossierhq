export default {
  onwarn(warning, warn) {
    if (
      warning.code === "MODULE_LEVEL_DIRECTIVE" &&
      warning.message.includes(`"use client"`)
    ) {
      return;
    }
    warn(warning);
  },
};
