import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceProcessingResult, AppTab, CreativeTone } from "../types.ts";

const SCRIPT_SYSTEM_INSTRUCTION = (tone: CreativeTone, targetLang: string) => `
You are a Professional Multilingual Screenplay Writer. Your task is to process audio or text provided by the user and transform it into a ${tone} genre professional script.
In convert page (textconverter), no need for image generation prompts or feature.

Critical Flow:
1. original_text: Raw transcription.
2. translated_text: Professional screenplay formatted in the SAME ORIGINAL LANGUAGE.
3. romanized_text: Phonetic romanization of that native script.
4. target_translation: Professional translation into ${targetLang}.
`;

const TRANSLATOR_SYSTEM_INSTRUCTION = (targetLang: string) => `
You are a Multilingual Voice Assistant. Your task is to process audio files provided by the user. 
Critical Flow:
1. original_text: Raw transcription.
2. translated_text: Refined version in the native language.
3. romanized_text: Phonetic guide.
4. target_translation: Translation into ${targetLang}.
`;

export async function processInput(
  data: string,
  mimeType: string,
  mode: 'voice' | 'visual' | 'text',
  tab: AppTab,
  targetLanguage: string = 'English',
  tone: CreativeTone = 'Neutral'
): Promise<VoiceProcessingResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isScriptOrConvert = tab === 'scriptwriter' || tab === 'textconverter';
  const modelName = isScriptOrConvert ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const systemInstruction = isScriptOrConvert 
    ? SCRIPT_SYSTEM_INSTRUCTION(tone, targetLanguage)
    : TRANSLATOR_SYSTEM_INSTRUCTION(targetLanguage);

  const inputPart = mode === 'text' 
    ? { text: `INPUT: ${data}` } 
    : { inlineData: { mimeType: mimeType, data: data } };

  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [inputPart, { text: `Process this for the ${tab} tab. Output native script in translated_text and translation to ${targetLanguage}. Genre: ${tone}.` }],
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original_language: { type: Type.STRING },
          original_text: { type: Type.STRING },
          translated_text: { type: Type.STRING },
          romanized_text: { type: Type.STRING },
          target_translation: { type: Type.STRING },
          confidence_score: { type: Type.NUMBER },
          storyboard_prompts: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
        required: ["original_language", "original_text", "translated_text", "target_translation", "confidence_score"],
      },
    },
  });

  const result = JSON.parse(response.text || '{}') as VoiceProcessingResult;

  // Image generation ONLY for Scriptwriter tab, strictly excluded for Convert/TextConverter
  if (tab === 'scriptwriter' && result.storyboard_prompts && result.storyboard_prompts.length > 0) {
    const imageResults = await Promise.allSettled(
      result.storyboard_prompts.map(prompt => generateStoryboardImage(prompt, tone))
    );
    result.storyboard_urls = imageResults.map((res) => res.status === 'fulfilled' ? res.value : "");
  }

  return result;
}

export async function generateStoryboardImage(prompt: string, tone: CreativeTone, isRetry: boolean = false): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalPrompt = `Cinematic film still, ${tone} movie style, highly detailed. ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("No image");
  } catch (error) {
    if (!isRetry) return generateStoryboardImage(prompt, 'Neutral', true);
    return "";
  }
}

export async function generateSpeech(text: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}