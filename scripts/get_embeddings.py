from sentence_transformers import SentenceTransformer
import numpy as np
import re

model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
with open("bible.txt", "r") as f:
    verses = f.readlines()
search_documents = ["clustering: " + re.split(r"(\d+:\d+)\s+", verse, maxsplit=1)[-1] for verse in verses]
embeddings = model.encode(search_documents, precision="float32", normalize_embeddings=True)
embeddings_array = np.array(embeddings, dtype=np.float32)
shape = np.array(embeddings_array.shape, dtype=np.int32)

with open("embeddings.bin", "wb") as f:
    f.write(shape.tobytes())
    f.write(embeddings_array.tobytes())