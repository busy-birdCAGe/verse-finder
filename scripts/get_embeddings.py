from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("nomic-ai/nomic-embed-text-v1", trust_remote_code=True)
with open("src/nkjv.csv", "r") as f:
    lines = f.readlines()
search_documents = ["clustering: " + line.split("|")[-1] for line in lines]
embeddings = model.encode(search_documents, precision="float32", normalize_embeddings=True)
embeddings_array = np.array(embeddings, dtype=np.float32)
shape = np.array(embeddings_array.shape, dtype=np.int32)

with open("src/nkjv_embeddings.bin", "wb") as f:
    f.write(shape.tobytes())
    f.write(embeddings_array.tobytes())