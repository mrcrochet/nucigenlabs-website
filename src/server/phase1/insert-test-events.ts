/**
 * Script pour insérer 10 articles de test dans la table events
 * 
 * Usage: npx tsx src/server/phase1/insert-test-events.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\nPlease ensure these are set in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const testEvents = [
  {
    source: 'manual',
    source_id: 'test-1',
    title: 'EU Announces New Sanctions on Russian Energy',
    description: 'The European Union has announced expanded sanctions targeting Russian energy exports, including refined petroleum products.',
    content: 'The European Union has announced expanded sanctions targeting Russian energy exports, including refined petroleum products. The measures are expected to impact global energy markets and supply chains. Energy prices are likely to adjust as markets price in reduced supply from Russia. The sanctions will take effect within 30 days.',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    url: 'https://example.com/article1',
    author: 'Reuters',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-2',
    title: 'Taiwan Semiconductor Factory Closure',
    description: 'Major TSMC facility halts operations due to power grid instability.',
    content: 'Major TSMC facility halts operations due to power grid instability. Supply chain disruption expected across consumer electronics and automotive sectors within 12-24 hours. The closure affects production of advanced chips used in smartphones and electric vehicles.',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    url: 'https://example.com/article2',
    author: 'Bloomberg',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-3',
    title: 'Shanghai Port Capacity Reduction',
    description: 'Port authorities announce 30% capacity reduction due to infrastructure maintenance.',
    content: 'Port authorities announce 30% capacity reduction due to infrastructure maintenance. Logistics delays expected to ripple through global supply chains within 24-48 hours. The reduction will affect shipping routes connecting Asia to Europe and North America.',
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    url: 'https://example.com/article3',
    author: 'Financial Times',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-4',
    title: 'US Federal Reserve Signals Rate Cut',
    description: 'Fed Chair indicates potential interest rate reduction in next meeting.',
    content: 'Fed Chair indicates potential interest rate reduction in next meeting. Markets respond with immediate currency adjustments. The signal suggests a shift in monetary policy stance due to economic indicators showing cooling inflation.',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    url: 'https://example.com/article4',
    author: 'Wall Street Journal',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-5',
    title: 'China Imposes Export Restrictions on Rare Earth Metals',
    description: 'New regulations limit exports of critical minerals used in technology manufacturing.',
    content: 'New regulations limit exports of critical minerals used in technology manufacturing. The restrictions affect global supply of materials essential for electric vehicles, wind turbines, and consumer electronics. Companies dependent on Chinese rare earths face supply chain challenges.',
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    url: 'https://example.com/article5',
    author: 'South China Morning Post',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-6',
    title: 'OPEC+ Agrees to Production Cuts',
    description: 'Oil cartel announces coordinated reduction in output to stabilize prices.',
    content: 'Oil cartel announces coordinated reduction in output to stabilize prices. The cuts amount to 2 million barrels per day. Energy markets react with immediate price increases. The decision reflects concerns about global demand and inventory levels.',
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    url: 'https://example.com/article6',
    author: 'Reuters',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-7',
    title: 'EU Digital Services Act Enforcement Begins',
    description: 'New regulations require tech platforms to implement content moderation and transparency measures.',
    content: 'New regulations require tech platforms to implement content moderation and transparency measures. Large tech companies face compliance deadlines with significant penalties for violations. The act affects how platforms handle user data and algorithmic recommendations.',
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    url: 'https://example.com/article7',
    author: 'TechCrunch',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-8',
    title: 'Major Cyberattack on European Banking System',
    description: 'Coordinated attack disrupts payment processing across multiple countries.',
    content: 'Coordinated attack disrupts payment processing across multiple countries. Security experts identify state-sponsored actors. Financial institutions implement emergency protocols. The incident highlights vulnerabilities in critical infrastructure.',
    published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    url: 'https://example.com/article8',
    author: 'BBC News',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-9',
    title: 'US-China Trade Talks Resume',
    description: 'High-level negotiations restart after months of diplomatic freeze.',
    content: 'High-level negotiations restart after months of diplomatic freeze. Both sides express cautious optimism. Key topics include tariffs, intellectual property, and market access. The talks could signal a shift in bilateral economic relations.',
    published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    url: 'https://example.com/article9',
    author: 'Associated Press',
    status: 'pending',
  },
  {
    source: 'manual',
    source_id: 'test-10',
    title: 'Global Shipping Costs Surge Due to Red Sea Disruptions',
    description: 'Houthi attacks force major carriers to reroute vessels around Africa.',
    content: 'Houthi attacks force major carriers to reroute vessels around Africa. Shipping costs increase by 40% as routes extend by thousands of miles. The disruption affects trade between Asia and Europe. Insurance premiums rise for vessels in the region.',
    published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    url: 'https://example.com/article10',
    author: 'Maritime Executive',
    status: 'pending',
  },
];

async function insertTestEvents() {
  console.log('Inserting 10 test events...\n');

  let inserted = 0;
  let skipped = 0;

  for (const event of testEvents) {
    // Vérifier si l'événement existe déjà
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('source', event.source)
      .eq('source_id', event.source_id)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  Skipped: ${event.title.substring(0, 50)}... (already exists)`);
      skipped++;
      continue;
    }

    // Insérer l'événement
    const { error } = await supabase.from('events').insert(event);

    if (error) {
      console.error(`❌ Error inserting: ${event.title.substring(0, 50)}... - ${error.message}`);
    } else {
      console.log(`✅ Inserted: ${event.title.substring(0, 50)}...`);
      inserted++;
    }
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${skipped} skipped`);
  console.log(`\nYou can now run: npm run phase1:validate`);
}

// Exécuter si appelé directement
// En ES modules, on vérifie si c'est le module principal via import.meta.url
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('insert-test-events')) {
  insertTestEvents()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { insertTestEvents };

