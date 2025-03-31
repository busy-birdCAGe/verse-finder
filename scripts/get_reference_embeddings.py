from sentence_transformers import SentenceTransformer
import numpy as np
import re

def format_reference(verse: str) -> str:
    _, book, numbers, _ = re.split(r"(.*)\s+(\d+:\d+)", verse)
    chapter, verse = numbers.split(":")
    return f"{book} chapter {chapter} verse {verse}"

model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
with open("src/bible.txt", "r") as f:
    verses = f.readlines()
search_documents = ["clustering: " + format_reference(verse) for verse in verses]
embeddings = model.encode(search_documents, precision="float32", normalize_embeddings=True)
embeddings_array = np.array(embeddings, dtype=np.float32)
shape = np.array(embeddings_array.shape, dtype=np.int32)

with open("src/ref_embeddings.bin", "wb") as f:
    f.write(shape.tobytes())
    f.write(embeddings_array.tobytes())