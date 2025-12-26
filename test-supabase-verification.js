/**
 * Test script pour vérifier que Supabase crée bien les codes de vérification
 * Exécutez avec: node test-supabase-verification.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://igyrrebxrywokxgmtogl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function testSupabaseVerification() {
  console.log('🧪 Test de création de code de vérification dans Supabase...\n');

  const testEmail = process.argv[2] || 'test@example.com';
  console.log('📧 Email de test:', testEmail, '\n');

  try {
    // 1. Générer un code
    const code = generateVerificationCode();
    console.log('🔢 Code généré:', code);

    // 2. Calculer l'expiration (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    console.log('⏰ Expiration:', expiresAt.toISOString(), '\n');

    // 3. Supprimer les anciens codes non vérifiés
    console.log('🗑️  Suppression des anciens codes non vérifiés...');
    const { error: deleteError } = await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', testEmail.toLowerCase().trim())
      .eq('verified', false);

    if (deleteError) {
      console.warn('⚠️  Erreur lors de la suppression (peut être normal):', deleteError.message);
    } else {
      console.log('✅ Anciens codes supprimés\n');
    }

    // 4. Insérer le nouveau code
    console.log('💾 Insertion du nouveau code...');
    const { data, error } = await supabase
      .from('email_verification_codes')
      .insert({
        email: testEmail.toLowerCase().trim(),
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
        verification_attempts: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de l\'insertion:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Détails:', error.details);
      console.error('Hint:', error.hint);
      return false;
    }

    console.log('✅ Code créé avec succès dans Supabase!');
    console.log('📋 Données:', JSON.stringify(data, null, 2), '\n');

    // 5. Vérifier que le code est bien dans la base
    console.log('🔍 Vérification de la lecture du code...');
    const { data: readData, error: readError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', testEmail.toLowerCase().trim())
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (readError) {
      console.error('❌ Erreur lors de la lecture:', readError);
      return false;
    }

    if (!readData) {
      console.error('❌ Code non trouvé après insertion!');
      return false;
    }

    console.log('✅ Code lu avec succès!');
    console.log('📋 Code stocké:', readData.code);
    console.log('📧 Email:', readData.email);
    console.log('⏰ Expire à:', readData.expires_at);
    console.log('✅ Vérifié:', readData.verified);
    console.log('🔢 Tentatives:', readData.verification_attempts, '\n');

    console.log('🎉 Test réussi! Le code est bien créé et stocké dans Supabase.');
    console.log('💡 Le problème vient donc de l\'envoi d\'email par Resend, pas de Supabase.\n');

    return true;
  } catch (error) {
    console.error('❌ Erreur inattendue:');
    console.error(error);
    return false;
  }
}

testSupabaseVerification().then(success => {
  process.exit(success ? 0 : 1);
});

