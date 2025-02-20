import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { documentChunks } from '../db/schema/embeddings';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  
  // Calculate cosine similarity between query and document chunks
  const similarity = sql<number>`1 - (${cosineDistance(
    documentChunks.embedding,
    userQueryEmbedded,
  )})`;
  
  // Find similar chunks with metadata
  const similarChunks = await db
    .select({
      content: documentChunks.content,
      metadata: documentChunks.metadata,
      similarity,
    })
    .from(documentChunks)
    .where(gt(similarity, 0.7)) // Increased similarity threshold for better matches
    .orderBy(desc(similarity))
    .limit(4);
    
  // Format the results
  return similarChunks.map(chunk => ({
    name: chunk.content,
    similarity: chunk.similarity,
    metadata: chunk.metadata ? JSON.parse(chunk.metadata) : null,
  }));
};