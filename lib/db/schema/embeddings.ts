import { generateId } from 'ai';
import { index, pgTable, text, varchar, vector, timestamp } from 'drizzle-orm/pg-core';
import { resources } from './resources';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => generateId()),
    resourceId: varchar('resource_id', { length: 191 }).references(
      () => resources.id,
      { onDelete: 'cascade' },
    ),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  table => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);

export const documents = pgTable('documents', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => generateId()),
  content: text('content').notNull(),
  metadata: text('metadata'),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => generateId()),
  documentId: varchar('document_id', { length: 191 }).references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  metadata: text('metadata'),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});