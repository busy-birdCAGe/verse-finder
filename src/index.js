import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";
import {
  statusBox,
  verseDisplay,
  audioChunkToText,
  canRecord,
  loadBibleVerses,
  loadEmbeddings,
  getClosestVerseIndices,
  recorder,
  queryBox,
} from "./functions.js";

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
statusBox.success("Ready!");

recorder.element.addEventListener("click", async () => {
  recorder.toggleRecording();
});

document.getElementById("5s").addEventListener("click", async () => {
  if (!canRecord()) {
    statusBox.error("Cannot use microphone without https");
    return;
  }
  if (!recorder.last5Seconds) {
    statusBox.error("Recording is less than 5 seconds...");
    return;
  }

  statusBox.busy("Processing audio...");
  queryBox.input = await audioChunkToText(recorder.last5Seconds, transcriber);
  statusBox.busy("Processing text...");
  const indices = await getClosestVerseIndices(extractor, queryBox.input, embeddings);
  verseDisplay.byIndices(indices, bibleVerses);
  statusBox.success("Ready!");
});

document.getElementById("10s").addEventListener("click", async () => {
  if (!canRecord()) {
    statusBox.error("Cannot use microphone without https");
    return;
  }
  if (!recorder.last10Seconds) {
    statusBox.error("Recording is less than 10 seconds...");
    return;
  }

  statusBox.busy("Processing audio...");
  queryBox.input = await audioChunkToText(recorder.last10Seconds, transcriber);
  statusBox.busy("Processing text...");
  const indices = await getClosestVerseIndices(extractor, queryBox.input, embeddings);
  verseDisplay.byIndices(indices, bibleVerses);
  statusBox.success("Ready!");
});

document.getElementById("submit").addEventListener("click", async () => {
  if (queryBox.input.trim() === "") {
    statusBox.error("Please enter a query.");
    return;
  }

  statusBox.busy("Processing text...");
  const indices = await getClosestVerseIndices(extractor, queryBox.input, embeddings);
  verseDisplay.byIndices(indices, bibleVerses);
  statusBox.success("Ready!");
});
