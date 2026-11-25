import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { WordPairModel } from '../models/WordPair.js';
import { connectDatabase, disconnectDatabase } from '../utils/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CSVRow {
  id: string;
  word1: string;
  word2: string;
  category: string;
  difficulty: string;
  relationshipType: string;
  relatedness: string;
  hint: string;
  isActive: string;
  tags: string;
  wordLanguage: string;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function importWordPairsFromCSV(filePath: string): Promise<{
  totalRead: number;
  accepted: number;
  rejected: number;
  reasons: string[];
}> {
  console.log(`Reading dataset from: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset file not found at: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CSVRow[];

  console.log(`Total rows read: ${records.length}`);

  let accepted = 0;
  let rejected = 0;
  const reasons: string[] = [];
  const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);
  const validRelTypes = new Set(['similar', 'contextual', 'indirect', 'contrast']);
  const validWordLangs = new Set(['en', 'hi-Latn', 'mixed']);

  const seenIds = new Set<string>();
  const seenPairs = new Set<string>();

  const docsToInsert = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;

    if (!row.id || !row.word1 || !row.word2) {
      rejected++;
      reasons.push(`Row ${rowNum}: Missing mandatory fields (id, word1, or word2)`);
      continue;
    }

    if (seenIds.has(row.id)) {
      rejected++;
      reasons.push(`Row ${rowNum}: Duplicate pair id ${row.id}`);
      continue;
    }
    seenIds.add(row.id);

    const w1Norm = row.word1.trim().toLowerCase();
    const w2Norm = row.word2.trim().toLowerCase();

    if (w1Norm === w2Norm) {
      rejected++;
      reasons.push(`Row ${rowNum}: word1 and word2 are identical (${row.word1})`);
      continue;
    }

    // Direct and reverse duplicate detection
    const pairKey1 = `${w1Norm}::${w2Norm}`;
    const pairKey2 = `${w2Norm}::${w1Norm}`;
    if (seenPairs.has(pairKey1) || seenPairs.has(pairKey2)) {
      rejected++;
      reasons.push(`Row ${rowNum}: Duplicate or reversed word pair (${row.word1}, ${row.word2})`);
      continue;
    }
    seenPairs.add(pairKey1);
    seenPairs.add(pairKey2);

    if (!validDifficulties.has(row.difficulty)) {
      rejected++;
      reasons.push(`Row ${rowNum}: Invalid difficulty ${row.difficulty}`);
      continue;
    }

    if (!validRelTypes.has(row.relationshipType)) {
      rejected++;
      reasons.push(`Row ${rowNum}: Invalid relationshipType ${row.relationshipType}`);
      continue;
    }

    const relatednessNum = parseFloat(row.relatedness);
    if (isNaN(relatednessNum) || relatednessNum < 0 || relatednessNum > 1) {
      rejected++;
      reasons.push(`Row ${rowNum}: Invalid relatedness ${row.relatedness}`);
      continue;
    }

    // Parse tags
    let tagsList: string[] = [];
    if (row.tags) {
      try {
        if (row.tags.startsWith('[') && row.tags.endsWith(']')) {
          tagsList = JSON.parse(row.tags);
        } else {
          tagsList = row.tags.split(',').map((t) => t.trim().replace(/^"|"$/g, ''));
        }
      } catch {
        tagsList = row.tags.split(',').map((t) => t.trim().replace(/^"|"$/g, ''));
      }
    }

    const wordLang = row.wordLanguage || 'en';
    const langNormalized = validWordLangs.has(wordLang) ? wordLang : 'en';

    docsToInsert.push({
      id: row.id,
      word1: row.word1.trim(),
      word2: row.word2.trim(),
      category: row.category ? row.category.trim() : 'General',
      difficulty: row.difficulty as any,
      relationshipType: row.relationshipType as any,
      relatedness: relatednessNum,
      hint: row.hint || '',
      isActive: row.isActive === 'True' || row.isActive === 'true' || row.isActive === '1',
      tags: tagsList,
      wordLanguage: langNormalized as any,
      language: row.language || 'en',
    });

    accepted++;
  }

  // Bulk upsert into MongoDB
  if (docsToInsert.length > 0) {
    const bulkOps = docsToInsert.map((doc) => ({
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true,
      },
    }));

    await WordPairModel.bulkWrite(bulkOps);
  }

  console.log(`Import summary: ${accepted} accepted, ${rejected} rejected.`);
  return { totalRead: records.length, accepted, rejected, reasons };
}

/**
 * Robustly find the dataset CSV file across various execution environments
 */
export function resolveDatasetPath(): string | null {
  const candidates = [
    process.env.DATASET_PATH,
    path.resolve(process.cwd(), 'imposter_game_dataset_1500.csv'),
    path.resolve(process.cwd(), '../imposter_game_dataset_1500.csv'),
    path.resolve(__dirname, '../../imposter_game_dataset_1500.csv'),
    path.resolve(__dirname, '../../../imposter_game_dataset_1500.csv'),
    path.resolve(__dirname, '../data/imposter_game_dataset_1500.csv'),
    path.resolve(__dirname, '../../data/imposter_game_dataset_1500.csv'),
  ].filter((p): p is string => Boolean(p && p.trim() !== ''));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// Standalone seed runner
async function run() {
  try {
    await connectDatabase();
    const csvPath = resolveDatasetPath();
    if (!csvPath) {
      throw new Error(
        'Could not locate imposter_game_dataset_1500.csv. Please verify file exists or set DATASET_PATH.'
      );
    }
    const result = await importWordPairsFromCSV(csvPath);
    console.log('Seed completed successfully:', result);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('importDataset.ts')) {
  run();
}
