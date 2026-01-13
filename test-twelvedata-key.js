#!/usr/bin/env node
/**
 * Script de test pour vérifier la configuration de la clé API Twelve Data
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le .env
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.TWELVEDATA_API_KEY;

console.log('\n🔍 Vérification de la clé API Twelve Data...\n');

if (!API_KEY) {
  console.log('❌ TWELVEDATA_API_KEY non trouvée dans les variables d\'environnement\n');
  console.log('📝 Vérifiez que :');
  console.log('   1. Le fichier .env existe à la racine du projet');
  console.log('   2. Il contient : TWELVEDATA_API_KEY=votre_cle_ici');
  console.log('   3. Pas d\'espaces autour du =');
  console.log('   4. Pas de guillemets autour de la valeur\n');
  process.exit(1);
}

if (API_KEY.trim() === '') {
  console.log('❌ TWELVEDATA_API_KEY est vide\n');
  console.log('📝 Vérifiez que la valeur n\'est pas vide dans votre .env\n');
  process.exit(1);
}

console.log(`✅ Clé API trouvée : ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log(`   Longueur : ${API_KEY.length} caractères\n`);

// Tester la clé avec l'API
console.log('🧪 Test de la clé API avec Twelve Data...\n');

try {
  const response = await fetch(`https://api.twelvedata.com/price?symbol=AAPL&apikey=${API_KEY}`);
  const data = await response.json();
  
  if (data.status === 'error') {
    console.log('❌ Erreur de l\'API Twelve Data :');
    console.log(`   ${data.message}\n`);
    
    if (data.message.includes('apikey') || data.message.includes('API key')) {
      console.log('💡 La clé API semble invalide ou expirée');
      console.log('   Vérifiez votre clé sur : https://twelvedata.com/\n');
    }
    
    process.exit(1);
  }
  
  if (data.price) {
    console.log('✅ Clé API valide !');
    console.log(`   Prix AAPL : $${data.price}\n`);
    console.log('🎉 Configuration correcte ! Vous pouvez utiliser Twelve Data.\n');
  } else {
    console.log('⚠️  Réponse inattendue de l\'API');
    console.log('   Données reçues :', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.log('❌ Erreur lors du test :');
  console.log(`   ${error.message}\n`);
  console.log('💡 Vérifiez votre connexion internet\n');
  process.exit(1);
}
