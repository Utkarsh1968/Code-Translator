export type Language = {
  name: string;
  value: string;
  icon: string;
};

export type TranslationResult = {
  translatedCode: string;
  error?: string;
};