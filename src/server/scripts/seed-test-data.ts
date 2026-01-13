/**
 * Seed Test Data Script
 * 
 * Creates comprehensive test data for 10 testers:
 * - Events with causal chains
 * - Relationships between events
 * - Historical comparisons
 * - Scenario predictions
 * 
 * Usage: npx tsx src/server/scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

interface TestEvent {
  summary: string;
  event_type: string;
  sector: string;
  region: string;
  country: string | null;
  actors: string[];
  why_it_matters: string;
  impact_score: number;
  confidence: number;
}

const testEvents: TestEvent[] = [
  {
    summary: 'EU announces new sanctions on Russian energy exports, targeting refined petroleum products',
    event_type: 'Geopolitical',
    sector: 'Energy',
    region: 'EU',
    country: null,
    actors: ['European Union', 'Russia'],
    why_it_matters: 'Will impact global energy markets and supply chains within 30 days',
    impact_score: 0.85,
    confidence: 0.90,
  },
  {
    summary: 'Taiwan Semiconductor (TSMC) facility halts operations due to power grid instability',
    event_type: 'Industrial',
    sector: 'Technology',
    region: 'Asia Pacific',
    country: 'Taiwan',
    actors: ['TSMC', 'Taiwan Power Company'],
    why_it_matters: 'Supply chain disruption expected across consumer electronics and automotive sectors within 12-24 hours',
    impact_score: 0.80,
    confidence: 0.85,
  },
  {
    summary: 'Shanghai Port announces 30% capacity reduction due to infrastructure maintenance',
    event_type: 'SupplyChain',
    sector: 'Logistics',
    region: 'China',
    country: 'China',
    actors: ['Shanghai Port Authority'],
    why_it_matters: 'Logistics delays expected to ripple through global supply chains within 24-48 hours',
    impact_score: 0.75,
    confidence: 0.88,
  },
  {
    summary: 'US Federal Reserve signals potential interest rate cut in next meeting',
    event_type: 'Regulatory',
    sector: 'Finance',
    region: 'US',
    country: 'United States',
    actors: ['Federal Reserve', 'Jerome Powell'],
    why_it_matters: 'Markets respond with immediate currency adjustments and bond yield changes',
    impact_score: 0.70,
    confidence: 0.82,
  },
  {
    summary: 'China imposes export restrictions on rare earth metals used in technology manufacturing',
    event_type: 'Regulatory',
    sector: 'Technology',
    region: 'China',
    country: 'China',
    actors: ['Chinese Ministry of Commerce'],
    why_it_matters: 'Affects global supply of materials essential for electric vehicles, wind turbines, and consumer electronics',
    impact_score: 0.88,
    confidence: 0.90,
  },
  {
    summary: 'OPEC+ agrees to production cuts of 2 million barrels per day',
    event_type: 'Market',
    sector: 'Energy',
    region: 'Middle East',
    country: null,
    actors: ['OPEC+', 'Saudi Arabia'],
    why_it_matters: 'Energy markets react with immediate price increases, affecting global inflation',
    impact_score: 0.82,
    confidence: 0.92,
  },
  {
    summary: 'EU Digital Services Act enforcement begins, affecting major tech platforms',
    event_type: 'Regulatory',
    sector: 'Technology',
    region: 'EU',
    country: null,
    actors: ['European Commission', 'Tech Platforms'],
    why_it_matters: 'Platforms must comply with new content moderation and transparency requirements',
    impact_score: 0.65,
    confidence: 0.85,
  },
  {
    summary: 'Major cyberattack disrupts US healthcare system infrastructure',
    event_type: 'Security',
    sector: 'Healthcare',
    region: 'US',
    country: 'United States',
    actors: ['Unknown Threat Actor', 'US Healthcare Providers'],
    why_it_matters: 'Patient data security compromised, operations disrupted across multiple states',
    impact_score: 0.90,
    confidence: 0.88,
  },
  {
    summary: 'Brazil announces new environmental regulations for Amazon mining operations',
    event_type: 'Regulatory',
    sector: 'Commodities',
    region: 'Latin America',
    country: 'Brazil',
    actors: ['Brazilian Government', 'Mining Companies'],
    why_it_matters: 'Restrictions will reduce supply of key minerals, affecting global commodity markets',
    impact_score: 0.72,
    confidence: 0.80,
  },
  {
    summary: 'Japan announces semiconductor manufacturing investment package worth $10B',
    event_type: 'Industrial',
    sector: 'Technology',
    region: 'Japan',
    country: 'Japan',
    actors: ['Japanese Government', 'Semiconductor Companies'],
    why_it_matters: 'Strengthens global chip supply chain resilience, reduces dependency on Taiwan',
    impact_score: 0.68,
    confidence: 0.87,
  },
];

async function generateCausalChain(event: TestEvent): Promise<any> {
  if (!openai) {
    // Return a simple causal chain without OpenAI
    return {
      cause: `${event.event_type} event affecting ${event.sector} sector`,
      first_order_effect: `Immediate impact on ${event.region} markets`,
      second_order_effect: `Long-term implications for global supply chains`,
      affected_sectors: [event.sector],
      affected_regions: [event.region],
      time_horizon: 'weeks',
      confidence: event.confidence,
    };
  }

  try {
    const prompt = `Generate a causal chain for this event:

Event: ${event.summary}
Type: ${event.event_type}
Sector: ${event.sector}
Region: ${event.region}

Return ONLY valid JSON with this structure:
{
  "cause": "string (what caused this event)",
  "first_order_effect": "string (immediate consequences)",
  "second_order_effect": "string (longer-term ripple effects)",
  "affected_sectors": ["string"],
  "affected_regions": ["string"],
  "time_horizon": "hours" | "days" | "weeks",
  "confidence": ${event.confidence}
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a causal chain analyst. Return ONLY valid JSON, no markdown, no explanations.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.5,
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.warn(`Failed to generate causal chain for event, using fallback:`, error);
    return {
      cause: `${event.event_type} event affecting ${event.sector} sector`,
      first_order_effect: `Immediate impact on ${event.region} markets`,
      second_order_effect: `Long-term implications for global supply chains`,
      affected_sectors: [event.sector],
      affected_regions: [event.region],
      time_horizon: 'weeks',
      confidence: event.confidence,
    };
  }
}

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  const insertedEvents: string[] = [];

  for (const testEvent of testEvents) {
    try {
      // Insert event into nucigen_events
      const { data: eventData, error: eventError } = await supabase
        .from('nucigen_events')
        .insert({
          summary: testEvent.summary,
          event_type: testEvent.event_type,
          sector: testEvent.sector,
          region: testEvent.region,
          country: testEvent.country,
          actors: testEvent.actors,
          why_it_matters: testEvent.why_it_matters,
          impact_score: testEvent.impact_score,
          confidence: testEvent.confidence,
        })
        .select()
        .single();

      if (eventError) {
        console.error(`❌ Error inserting event "${testEvent.summary}":`, eventError.message);
        continue;
      }

      const eventId = eventData.id;
      insertedEvents.push(eventId);
      console.log(`✅ Inserted event: ${testEvent.summary.substring(0, 60)}...`);

      // Generate and insert causal chain
      const causalChain = await generateCausalChain(testEvent);
      
      const { error: chainError } = await supabase
        .from('nucigen_causal_chains')
        .insert({
          event_id: eventId,
          cause: causalChain.cause,
          first_order_effect: causalChain.first_order_effect,
          second_order_effect: causalChain.second_order_effect || null,
          affected_sectors: causalChain.affected_sectors || [testEvent.sector],
          affected_regions: causalChain.affected_regions || [testEvent.region],
          time_horizon: causalChain.time_horizon || 'weeks',
          confidence: causalChain.confidence || testEvent.confidence,
        });

      if (chainError) {
        console.warn(`⚠️  Error inserting causal chain:`, chainError.message);
      } else {
        console.log(`   ✅ Causal chain generated`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Error processing event:`, error.message);
    }
  }

  // Create some relationships between events
  if (insertedEvents.length >= 2) {
    console.log('\n🔗 Creating relationships between events...');
    
    // Create a few relationships (first event relates to second, etc.)
    for (let i = 0; i < Math.min(insertedEvents.length - 1, 5); i++) {
      const { error } = await supabase
        .from('event_relationships')
        .insert({
          event_id: insertedEvents[i],
          related_event_id: insertedEvents[i + 1],
          relationship_type: i % 2 === 0 ? 'causal' : 'temporal',
          direction: 'outgoing',
          strength: 0.6 + (Math.random() * 0.3),
          evidence: 'Test data relationship',
        });

      if (!error) {
        console.log(`   ✅ Relationship created between events ${i + 1} and ${i + 2}`);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - ${insertedEvents.length} events inserted`);
  console.log(`   - Causal chains generated`);
  console.log(`   - Relationships created`);
  console.log(`\n💡 Run 'npm run pipeline:process' to process these events if needed.`);
}

seedTestData().catch(console.error);
