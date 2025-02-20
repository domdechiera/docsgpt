import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { db } from './db';
import { documents, documentChunks } from './db/schema/embeddings';
import { generateId } from 'ai';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// Initialize the embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Text splitter for chunking documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function processFile(filePath: string) {
  console.log(`Processing ${filePath}`);
  
  try {
    // Read the file content
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter and content
    const { content, data: metadata } = matter(fileContent);
    
    // Create document record
    const documentId = generateId();
    const documentEmbedding = await embeddings.embedQuery(content);
    
    await db.insert(documents).values({
      id: documentId,
      content,
      metadata: JSON.stringify(metadata),
      embedding: documentEmbedding,
    });
    
    // Split content into chunks
    const chunks = await textSplitter.createDocuments([content]);
    
    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      const chunkEmbedding = await embeddings.embedQuery(chunk.pageContent);
      
      await db.insert(documentChunks).values({
        id: generateId(),
        documentId,
        content: chunk.pageContent,
        metadata: JSON.stringify({ ...metadata, ...chunk.metadata }),
        embedding: chunkEmbedding,
      });
    }
    
    console.log(`Successfully processed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function ingestDocs() {
  const docsPath = join(process.cwd(), 'docs');
  
  try {
    // Get all MDX files recursively
    function getMdxFiles(dir: string): string[] {
      const files = readdirSync(dir, { withFileTypes: true });
      
      return files.reduce<string[]>((allFiles, file) => {
        const filePath = join(dir, file.name);
        
        if (file.isDirectory()) {
          return [...allFiles, ...getMdxFiles(filePath)];
        }
        
        if (file.name.endsWith('.mdx')) {
          return [...allFiles, filePath];
        }
        
        return allFiles;
      }, []);
    }
    
    const mdxFiles = getMdxFiles(docsPath);
    console.log(`Found ${mdxFiles.length} MDX files`);
    
    for (const file of mdxFiles) {
      await processFile(file);
    }
    
    console.log('Finished processing all files');
  } catch (error) {
    console.error('Error during ingestion:', error);
  } finally {
    // Exit after all processing is done
    process.exit(0);
  }
}

// Run the ingestion
ingestDocs().catch((error) => {
  console.error('Fatal error during ingestion:', error);
  process.exit(1);
}); 