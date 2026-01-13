// Script de vérification des variables d'environnement
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  
  console.log('\n🔍 Vérification des variables d\'environnement...\n');
  
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=') && 
                        !envContent.includes('VITE_SUPABASE_URL=your_') &&
                        !envContent.includes('VITE_SUPABASE_URL=https://votre-');
  
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY=') && 
                        !envContent.includes('VITE_SUPABASE_ANON_KEY=your_') &&
                        !envContent.includes('VITE_SUPABASE_ANON_KEY=votre-');
  
  const hasTwelveDataKey = envContent.includes('TWELVEDATA_API_KEY=') && 
                          !envContent.includes('TWELVEDATA_API_KEY=your_') &&
                          !envContent.includes('TWELVEDATA_API_KEY=votre-');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ Variables Supabase configurées');
    
    // Extraire les valeurs pour vérification
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    
    if (urlMatch) {
      const url = urlMatch[1].trim();
      console.log(`   URL: ${url.substring(0, 30)}...`);
      if (!url.startsWith('https://')) {
        console.log('   ⚠️  L\'URL doit commencer par https://');
      }
    }
    
    if (keyMatch) {
      const key = keyMatch[1].trim();
      console.log(`   Key: ${key.substring(0, 20)}...`);
      if (key.length < 50) {
        console.log('   ⚠️  La clé semble trop courte');
      }
    }
  } else {
    console.log('❌ Variables Supabase non configurées ou avec valeurs par défaut');
    console.log('📝 Vérifiez votre fichier .env et assurez-vous que :');
    console.log('   - VITE_SUPABASE_URL contient votre URL Supabase');
    console.log('   - VITE_SUPABASE_ANON_KEY contient votre clé anon');
    console.log('💡 Obtenez ces valeurs depuis : Supabase Dashboard → Settings → API');
  }
  
  // Vérifier Twelve Data
  if (hasTwelveDataKey) {
    console.log('\n✅ Variable Twelve Data configurée');
    const twelveDataMatch = envContent.match(/TWELVEDATA_API_KEY=(.+)/);
    if (twelveDataMatch) {
      const key = twelveDataMatch[1].trim();
      console.log(`   Key: ${key.substring(0, 20)}...`);
    }
  } else {
    console.log('\n⚠️  Variable Twelve Data non configurée');
    console.log('📝 Ajoutez dans votre .env :');
    console.log('   TWELVEDATA_API_KEY=votre_cle_api_ici');
    console.log('💡 Obtenez votre clé depuis : https://twelvedata.com/');
  }
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('\n✅ Configuration Supabase correcte !');
    console.log('💡 Si vous voyez encore l\'erreur, redémarrez le serveur :');
    console.log('   1. Arrêtez le serveur (Ctrl+C ou Cmd+C)');
    console.log('   2. Redémarrez avec: npm run dev\n');
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('\n❌ Fichier .env non trouvé\n');
    console.log('📝 Créez un fichier .env à la racine du projet avec :');
    console.log('   VITE_SUPABASE_URL=https://votre-projet.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=votre-anon-key\n');
  } else {
    console.error('Erreur:', error.message);
  }
}

