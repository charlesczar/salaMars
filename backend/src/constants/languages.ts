export const languages = ["english", "filipino", "taglish", "bisaya"] as const;

export type Language = (typeof languages)[number];