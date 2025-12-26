/**
 * Test script pour vérifier l'API Resend
 * Exécutez avec: node test-resend-api.js
 */

const RESEND_API_KEY = 're_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ';
const RESEND_FROM_EMAIL = 'Nucigen Labs <onboarding@resend.dev>';

async function testResendAPI() {
  console.log('🧪 Test de l\'API Resend...\n');
  console.log('📧 From:', RESEND_FROM_EMAIL);
  console.log('🔑 API Key:', RESEND_API_KEY.substring(0, 10) + '...\n');

  // Remplacez par votre email de test
  const testEmail = process.argv[2] || 'test@example.com';
  console.log('📬 Test email:', testEmail, '\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: testEmail,
        subject: 'Test Email - Nucigen Labs',
        html: `
          <h1>Test Email</h1>
          <p>Si vous recevez cet email, l'API Resend fonctionne correctement.</p>
          <p>Code de test: <strong>1234</strong></p>
        `,
        text: 'Test Email - Si vous recevez cet email, l\'API Resend fonctionne correctement. Code: 1234',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur API Resend:');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data, null, 2));
      
      if (data.message) {
        console.error('\n💡 Message:', data.message);
      }
      
      if (response.status === 403) {
        console.error('\n⚠️  Erreur 403: Votre clé API pourrait être invalide ou expirée.');
      } else if (response.status === 422) {
        console.error('\n⚠️  Erreur 422: Vérifiez le format de l\'email ou le domaine d\'envoi.');
      }
      
      return false;
    }

    console.log('✅ Email envoyé avec succès!');
    console.log('📧 ID:', data.id);
    console.log('\n💡 Vérifiez votre boîte de réception (et les spams) dans quelques secondes.');
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:');
    console.error(error);
    return false;
  }
}

testResendAPI().then(success => {
  process.exit(success ? 0 : 1);
});

