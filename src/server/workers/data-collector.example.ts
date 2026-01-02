/**
 * Example Data Collector Worker
 * 
 * This is an example implementation of a data collection worker.
 * In production, this would run as a separate service (Railway, Render, etc.)
 * 
 * To use this:
 * 1. Install dependencies: npm install @supabase/supabase-js newsapi
 * 2. Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEWS_API_KEY
 * 3. Run: npx tsx src/server/workers/data-collector.example.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const newsApiKey = process.env.NEWS_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  author?: string;
  source: {
    name: string;
  };
}

/**
 * Collect events from NewsAPI
 */
async function collectNewsEvents() {
  if (!newsApiKey) {
    console.warn('NEWS_API_KEY not set, skipping news collection');
    return;
  }

  try {
    console.log('Starting news collection...');

    // Fetch top headlines
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=100&apiKey=${newsApiKey}`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = data.articles || [];

    console.log(`Found ${articles.length} articles`);

    let inserted = 0;
    let skipped = 0;

    for (const article of articles) {
      // Skip if missing required fields
      if (!article.title || !article.url || !article.publishedAt) {
        skipped++;
        continue;
      }

      // Check if event already exists
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('source', 'newsapi')
        .eq('source_id', article.url)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new event
      const { error } = await supabase.from('events').insert({
        source: 'newsapi',
        source_id: article.url,
        title: article.title,
        description: article.description || null,
        content: article.content || null,
        published_at: new Date(article.publishedAt).toISOString(),
        url: article.url,
        author: article.author || article.source.name || null,
        raw_category: 'business',
        status: 'pending',
      });

      if (error) {
        console.error(`Error inserting event: ${error.message}`);
      } else {
        inserted++;
      }
    }

    console.log(`Collection complete: ${inserted} inserted, ${skipped} skipped`);
  } catch (error) {
    console.error('Error collecting news:', error);
  }
}

/**
 * Process pending events
 * This would call your processing service/API
 */
async function processPendingEvents() {
  try {
    console.log('Processing pending events...');

    // Get pending events (limit to avoid overload)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, description, content, published_at')
      .eq('status', 'pending')
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    if (!events || events.length === 0) {
      console.log('No pending events to process');
      return;
    }

    console.log(`Processing ${events.length} events...`);

    // TODO: Call your processing service here
    // For now, just mark as processing
    for (const event of events) {
      await supabase
        .from('events')
        .update({ status: 'processing' })
        .eq('id', event.id);
    }

    // In production, you would:
    // 1. Call an API endpoint that processes the event
    // 2. Or use a queue system (BullMQ, etc.)
    // 3. The processor would:
    //    - Enrich with entities (NLP)
    //    - Classify by level and sector
    //    - Generate causal chains
    //    - Create predictions
    //    - Insert into processed_events

    console.log('Events marked for processing');
  } catch (error) {
    console.error('Error processing events:', error);
  }
}

/**
 * Generate recommendations for all users
 */
async function generateRecommendations() {
  try {
    console.log('Generating recommendations...');

    // Get all active users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, sector, professional_role, intended_use, exposure')
      .not('sector', 'is', null)
      .not('professional_role', 'is', null);

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      console.log('No users to generate recommendations for');
      return;
    }

    console.log(`Generating recommendations for ${users.length} users...`);

    for (const user of users) {
      // Call the Supabase function to generate recommendations
      const { data: recommendations, error: recError } = await supabase.rpc(
        'generate_user_recommendations',
        {
          p_user_id: user.id,
          p_limit: 20,
        }
      );

      if (recError) {
        console.error(`Error generating recommendations for user ${user.id}:`, recError);
        continue;
      }

      if (!recommendations || recommendations.length === 0) {
        continue;
      }

      // Insert recommendations
      const recommendationsToInsert = recommendations.map((rec: any) => ({
        user_id: user.id,
        event_id: rec.event_id,
        relevance_score: rec.relevance_score,
        reasons: rec.reasons,
        status: 'new',
        priority: rec.relevance_score > 70 ? 'high' : rec.relevance_score > 50 ? 'normal' : 'low',
      }));

      const { error: insertError } = await supabase
        .from('user_recommendations')
        .insert(recommendationsToInsert)
        .select();

      if (insertError) {
        console.error(`Error inserting recommendations for user ${user.id}:`, insertError);
      } else {
        console.log(`Generated ${recommendationsToInsert.length} recommendations for user ${user.id}`);
      }
    }

    console.log('Recommendation generation complete');
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

/**
 * Main worker function
 */
async function main() {
  console.log('Starting data collection worker...');

  // Collect new events
  await collectNewsEvents();

  // Process pending events
  await processPendingEvents();

  // Generate recommendations
  await generateRecommendations();

  console.log('Worker cycle complete');
}

// Run immediately, then every hour
main();
setInterval(main, 60 * 60 * 1000);

