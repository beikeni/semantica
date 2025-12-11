import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { config } from "../config";

const DEFAULT_LANGUAGE = "pt-BR";

let speechConfig: sdk.SpeechConfig | null = null;

export function getSpeechConfig(): sdk.SpeechConfig {
  if (!speechConfig) {
    speechConfig = sdk.SpeechConfig.fromSubscription(
      config.azure.speechKey,
      config.azure.speechRegion
    );
    speechConfig.speechRecognitionLanguage = DEFAULT_LANGUAGE;
    speechConfig.setProfanity(sdk.ProfanityOption.Raw);
  }
  return speechConfig;
}

export function setLanguage(languageCode: string): void {
  getSpeechConfig().speechRecognitionLanguage = languageCode;
}

export { sdk };

