// Script de vérification des variables d'environnement backend
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Vérification des variables d\'environnement BACKEND...\n');

const requiredVars = {
  'OPENAI_API_KEY': 'OpenAI API key for event extraction and analysis',
  'TAVILY_API_KEY': 'Tavily API key for live search and information collection',
  'SUPABASE_URL': 'Supabase project URL',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (for backend operations)',
};

const optionalVars = {
  'CLERK_SECRET_KEY': 'Clerk secret key (if using Clerk webhooks)',
  'API_PORT': 'API server port (default: 3001)',
};

let allGood = true;

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  
  // Check required variables
  console.log('📋 Variables requises:');
  for (const [varName, description] of Object.entries(requiredVars)) {
    const hasVar = envContent.includes(`${varName}=`) && 
                  !envContent.includes(`${varName}=your_`) &&
                  !envContent.includes(`${varName}=votre-`) &&
                  !envContent.includes(`${varName}=`);
    
    if (hasVar) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1].trim().length > 10) {
        const value = match[1].trim();
        console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`   ❌ ${varName}: Valeur vide ou invalide`);
        allGood = false;
      }
    } else {
      console.log(`   ❌ ${varName}: Non configurée`);
      console.log(`      ${description}`);
      allGood = false;
    }
  }
  
  // Check optional variables
  console.log('\n📋 Variables optionnelles:');
  for (const [varName, description] of Object.entries(optionalVars)) {
    const hasVar = envContent.includes(`${varName}=`);
    if (hasVar) {
      console.log(`   ✅ ${varName}: Configurée`);
    } else {
      console.log(`   ⚠️  ${varName}: Non configurée (${description})`);
    }
  }
  
  if (allGood) {
    console.log('\n✅ Toutes les variables requises sont configurées !');
    console.log('💡 Pour démarrer l\'API server: npm run api:server\n');
  } else {
    console.log('\n❌ Certaines variables requises manquent.');
    console.log('📝 Vérifiez votre fichier .env et ajoutez les variables manquantes.\n');
    process.exit(1);
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ Fichier .env non trouvé\n');
    console.log('📝 Créez un fichier .env à la racine du projet.\n');
    process.exit(1);
  } else {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}
