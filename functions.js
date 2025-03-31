export async function getClosestVerses(
  extractor,
  query,
  embeddings,
  statusBox,
  verseDisplay
) {
  if (query.input.trim() === "") {
    statusBox.error("Please enter a query.");
    return;
  }
  statusBox.busy("Processing text...");
  await new Promise((resolve) => setTimeout(resolve, 0)); //Allow UI to update
  let output = await extractor(`clustering: ${query.input}`, {
    pooling: "mean",
    normalize: true,
  });
  const queryEmbedding = output.data;

  const similarityScores = embeddings.map((embedding, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, embedding),
  }));
  similarityScores.sort((a, b) => b.similarity - a.similarity);
  const top3Indexes = similarityScores.slice(0, 3).map((item) => item.index);
  statusBox.success("Ready!");
  verseDisplay.byIndices(top3Indexes);
}

export async function loadEmbeddings() {
  const response = await cachedFetch("embeddings.bin");
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
  const rows = view.getInt32(0, true);
  const cols = view.getInt32(4, true);
  const embeddings2D = [];
  const floatArray = new Float32Array(buffer, 8);
  for (let i = 0; i < rows; i++) {
    embeddings2D.push(floatArray.slice(i * cols, (i + 1) * cols));
  }
  return embeddings2D;
}

export async function loadBibleVerses() {
  const response = await cachedFetch("bible.txt");
  const text = await response.text();
  return text.split("\n");
}

export function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function cachedFetch(url) {
  if (location.protocol !== "https:") {
    return fetch(url);
  }
  const cache = await caches.open(url);
  const cachedResponse = await cache.match(url);
  if (cachedResponse) {
    return cachedResponse;
  }
  const response = await fetch(url);
  await cache.put(url, response.clone());
  return response;
}

export async function audioChunkToText(chunk, transcriber) {
  const audioBlob = new Blob([chunk], {
    type: "audio/webm",
  });
  const audioUrl = URL.createObjectURL(audioBlob);
  const transcript = await transcriber(audioUrl);
  return transcript.text;
}

export class VerseDisplay {
  constructor(bibleVerses) {
    this.element = document.getElementById("result");
    this.bibleVerses = bibleVerses;
  }

  byIndices(verseIndices) {
    this.element.innerHTML = "";

    verseIndices.forEach((index) => {
      const verseText = this.bibleVerses[index];
      const verseMatch = verseText.match(/(.+?\s*\d+:\d+)\s+(.+)/);
      const reference = verseMatch ? verseMatch[1] : "";
      const extractedVerse = verseMatch ? verseMatch[2] : verseText;

      const verseCard = document.createElement("div");
      verseCard.className =
        "p-4 bg-white border border-gray-300 rounded-lg shadow-md";

      verseCard.innerHTML = `
        <h3 class="text-lg font-bold text-blue-700">${reference}</h3>
        <p class="mt-1 text-gray-700 text-sm font-serif leading-tight">${extractedVerse}</p>
    `;

      this.element.appendChild(verseCard);
    });
  }
}

export class StatusBox {
  constructor() {
    this.element = document.getElementById("status");
    this.statusClasses = {
      success: "bg-green-100 border-green-400 text-green-700",
      busy: "bg-yellow-100 border-yellow-400 text-yellow-700",
      error: "bg-red-100 border-red-400 text-red-700",
    };
  }

  update(message, type) {
    this.element.className = `p-3 mb-4 border rounded-lg text-center ${this.statusClasses[type]}`;
    this.element.textContent = message;
  }

  success(message) {
    this.update(message, "success");
  }

  busy(message) {
    this.update(message, "busy");
  }

  error(message) {
    this.update(message, "error");
  }
}

export class Recorder {
  constructor(statusBox) {
    this.element = document.getElementById("record");
    this.statusBox = statusBox;
    this.isRecording = false;
    this.audioStream = null;
    this.recordingInterval = null;
    this.last5Seconds = null;
    this.last10Seconds = null;
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  displayRecordingStatus() {
    this.element.textContent = "Stop";
    this.element.classList.remove("bg-gray-600", "hover:bg-gray-700");
    this.element.classList.add("bg-red-600", "hover:bg-red-700");
  }
  displayStoppedStatus() {
    this.element.textContent = "Record";
    this.element.classList.remove("bg-red-600", "hover:bg-red-700");
    this.element.classList.add("bg-gray-600", "hover:bg-gray-700");
  }

  async startRecording() {
    if (!navigator.mediaDevices) {
        this.statusBox.error("Cannot use microphone without https");
        return
    }
    this.isRecording = true;
    this.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    this.recordingInterval = setInterval(() => {
      this.recorderGenerator(5, this.audioStream).ondataavailable = (event) => {
        if (!this.isRecording) {
          return;
        }
        this.last5Seconds = event.data;
      };
      this.recorderGenerator(10, this.audioStream).ondataavailable = (
        event
      ) => {
        if (!this.isRecording) {
          return;
        }
        this.last10Seconds = event.data;
      };
    }, 500);
    this.displayRecordingStatus();
  }

  async stopRecording() {
    this.isRecording = false;
    this.displayStoppedStatus();
    clearInterval(this.recordingInterval);
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }

  recorderGenerator(seconds) {
    const mediaRecorder = new MediaRecorder(this.audioStream);
    mediaRecorder.start(seconds * 1000);
    setTimeout(() => mediaRecorder.stop(), seconds * 1000);
    return mediaRecorder;
  }
}

export class QueryBox {
  constructor() {
    this.element = document.getElementById("query");
    this.value = this.element.value;
  }

  get input() {
    return this.element.value;
  }

  set input(newValue) {
    this.element.value = newValue;
  }
}
