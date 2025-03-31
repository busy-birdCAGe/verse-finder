import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";
import {
  StatusBox,
  VerseDisplay,
  audioChunkToText,
  loadBibleVerses,
  loadEmbeddings,
  getClosestVerses,
  Recorder,
  QueryBox
} from "./functions.js";

const queryBox = new QueryBox();
const statusBox = new StatusBox();
const recorder = new Recorder(statusBox);

env.allowLocalModels = false;
statusBox.busy("Loading text model...");
const extractor = await pipeline(
  "feature-extraction",
  "nomic-ai/nomic-embed-text-v1.5"
);
statusBox.busy("Loading audio model...");
const transcriber = await pipeline(
  "automatic-speech-recognition",
  "Xenova/whisper-tiny.en"
);

statusBox.busy("Loading embeddings...");
const embeddings = await loadEmbeddings();
statusBox.busy("Loading bible verses...");
const bibleVerses = await loadBibleVerses();
const verseDisplay = new VerseDisplay(bibleVerses);
statusBox.success("Ready!");

recorder.element.addEventListener("click", async () => {
  recorder.toggleRecording();
});

document.getElementById("5s").addEventListener("click", async () => {
  if (!recorder.last5Seconds) {
    statusBox.error("Recording is less than 5 seconds...");
    return;
  }
  statusBox.busy("Processing audio...");
  queryBox.input = await audioChunkToText(recorder.last5Seconds, transcriber);
  getClosestVerses(extractor, queryBox, embeddings, statusBox, verseDisplay);
});

document.getElementById("10s").addEventListener("click", async () => {
  if (!recorder.last10Seconds) {
    statusBox.error("Recording is less than 10 seconds...");
    return;
  }
  statusBox.busy("Processing audio...");
  queryBox.input = await audioChunkToText(recorder.last10Seconds, transcriber);
  getClosestVerses(extractor, queryBox, embeddings, statusBox, verseDisplay);
});

document.getElementById("submit").addEventListener("click", () => {
  getClosestVerses(extractor, queryBox, embeddings, statusBox, verseDisplay);
});
