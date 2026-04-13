# Complete AI and ML Stack Specification for Sohojatra

## 1. FOUNDATION MODEL + FINE-TUNING (LoRA ON LLAMA 3)

**Base model: LLaMA 3 8B / 70B**
- Base: Meta LLaMA 3 8B for inference speed on constrained BD servers; 70B for research matching.
- 4-bit GPTQ quantisation for deployment. Served via vLLM.

**Fine-tuning: LoRA adapters (rank 16–64)**
Separate LoRA adapters per task:
1. Bangla urgency classifier
2. Concern-category tagger
3. Constructiveness scorer
4. Constitutional Q&A

Trained on Hugging Face PEFT. Hot-swappable at inference.

**Training data: Bangla civic corpus**
Sources:
- BanglaLM
- CC-100 Bangla
- Scraped BD govt circulars
- Prothom Alo / Daily Star archives
- Sohojatra synthetic concern data
- 100 Days Nepal translated proposals

*Total: 50K+ labelled examples*

## 2. RAG PIPELINE (LANGCHAIN + VECTOR DATABASE)

**Pipeline flow:**
Source docs (BD Constitution, laws, ministry circulars, Sohojatra concern DB)
→ Chunk + embed (LangChain TextSplitter + sentence-transformers / LaBSE)
→ Store in ChromaDB / Qdrant (cosine similarity index)
→ User query → embed → top-k retrieval
→ LangChain RetrievalQA → LLaMA 3 + LoRA Q&A adapter → grounded answer

**Components:**

**LangChain: RetrievalQA chain**
LangChain orchestrates:
- Document loader
- Splitter
- Vector retriever
- Prompt template
- LLM call
- Output parser

Supports multi-turn memory (ConversationBufferWindowMemory)

**Vector DB: ChromaDB (primary) + Qdrant (scale)**
Collections:
- `constitutional_docs`
- `concern_embeddings`
- `solution_plans`
- `research_papers`
- `assembly_minutes`

Metadata filters on division/category/date. Qdrant for >1M vectors at production scale.

**Embeddings: LaBSE + sentence-transformers**
- Language-agnostic BERT Sentence Embeddings (LaBSE)
- Supports Bangla + English jointly
- 768-dimensional vectors
- Duplicate detection via cosine similarity threshold: 0.82

## 3. BANGLA NLP PIPELINE (XLM-RoBERTA + BNLP)

**Sentiment analysis: XLM-RoBERTa (fine-tuned)**
Trained on:
- SentNoB
- Custom Bangla civic dataset

Output classes:
- Anger
- Urgency
- Helplessness
- Neutral
- Positive

Used for concern severity and comment tone scoring.

**Speech-to-text (STT): Bangla STT (Whisper fine-tune)**
OpenAI Whisper large-v3 fine-tuned on:
- BNST
- Prothom Alo audio

Supports accents:
- Dhaka
- Chittagong
- Sylheti

Target WER: <12%. Runs on-device for low-connectivity fallback.

**NER + classification: BNLP + custom classifier**
Named Entity Recognition (BNLP NER):
- Location extraction
- Ministry names
- Person names

Topic classifier (8 categories):
- Infrastructure
- Health
- Education
- Environment
- Corruption
- Safety
- Rights
- Economy

## 4. MODEL REGISTRY, VERSIONING + MLOPS

**MLOps: MLflow — experiment tracking + registry**
- Tracks all LoRA adapter versions
- A/B testing before production deployment

Metrics:
- F1 score
- BLEU
- WER
- Latency (p95)

Automatic rollback on performance degradation.

**Monitoring: Drift monitor + monthly retraining**
- Evidently AI monitors feature drift on incoming embeddings.
- Retraining trigger: Jensen-Shannon divergence > 0.15

Retraining strategy:
- Monthly scheduled retraining
- Uses new labelled data from human moderator feedback loop
