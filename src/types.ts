
export type AppTab = 'translator' | 'scriptwriter' | 'textconverter' | 'settings';

export type CreativeTone = 'Neutral' | 'Action' | 'Noir' | 'Comedy' | 'Drama' | 'Sci-Fi' | 'Horror';

export interface AppSettings {
  autoPlayVoice: boolean;
  defaultTargetLanguage: string;
  defaultTone: CreativeTone;
  hapticFeedback: boolean;
  uiIntensity: 'Soft' | 'High';
}

export interface VoiceProcessingResult {
  original_language: string;
  original_text: string;
  translated_text: string; // Used for Native Script / Screenplay
  romanized_text?: string;
  target_translation?: string; // The translation into the selected target language
  confidence_score: number;
  storyboard_prompts?: string[];
  storyboard_urls?: string[];
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  result: VoiceProcessingResult | null;
}

export type InputMode = 'voice' | 'visual' | 'text';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'or', name: 'Odia' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'as', name: 'Assamese' },
  { code: 'mai', name: 'Maithili' },
  { code: 'sat', name: 'Santali' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'ne', name: 'Nepali' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'doi', name: 'Dogri' },
  { code: 'kok', name: 'Konkani' },
  { code: 'mni', name: 'Manipuri' },
  { code: 'brx', name: 'Bodo' },
  { code: 'sa', name: 'Sanskrit' }
].sort((a, b) => a.name.localeCompare(b.name));
