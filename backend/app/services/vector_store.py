import os
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

_CHROMA_PATH = os.path.join(os.path.expanduser("~"), ".chroma")

_client: Optional[chromadb.PersistentClient] = None
_ef = DefaultEmbeddingFunction()


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=_CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _collection_name(repo_id: str) -> str:
    return f"repo_{repo_id}"


def store_documents(
    repo_id: str,
    texts: List[str],
    metadatas: List[Dict[str, str]],
) -> None:
    client = _get_client()
    name = _collection_name(repo_id)

    try:
        client.delete_collection(name)
    except Exception:
        pass

    collection = client.create_collection(
        name=name,
        embedding_function=_ef,
        metadata={"hnsw:space": "cosine"},
    )

    ids = [f"{repo_id}_{i}" for i in range(len(texts))]

    batch_size = 100
    for start in range(0, len(texts), batch_size):
        end = start + batch_size
        collection.add(
            ids=ids[start:end],
            documents=texts[start:end],
            metadatas=metadatas[start:end],
        )


def query_documents(
    repo_id: str,
    query_text: str,
    n_results: int = 5,
) -> List[Dict[str, Any]]:
    client = _get_client()
    name = _collection_name(repo_id)

    try:
        collection = client.get_collection(name, embedding_function=_ef)
    except Exception:
        return []

    count = collection.count()
    if count == 0:
        return []
    n = min(n_results, count)

    results = collection.query(
        query_texts=[query_text],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return [
        {"content": doc, "path": meta.get("path", ""), "distance": dist}
        for doc, meta, dist in zip(docs, metas, distances)
    ]
