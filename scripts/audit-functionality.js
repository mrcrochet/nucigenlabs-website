#!/usr/bin/env node

/**
 * Audit Functionality Script
 * 
 * Vérifie automatiquement les fonctionnalités, pages, routes, API et intégrations
 * selon le plan d'audit pour la préparation du beta test.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark(passed) {
  return passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

// Results tracking
const results = {
  pages: { passed: 0, failed: 0, total: 0 },
  routes: { passed: 0, failed: 0, total: 0 },
  api: { passed: 0, failed: 0, total: 0 },
  integrations: { passed: 0, failed: 0, total: 0 },
  components: { passed: 0, failed: 0, total: 0 },
  errors: [],
};

// ============================================
// 1. Audit des Pages et Routes
// ============================================

function auditPagesAndRoutes() {
  log('\n📄 1. Audit des Pages et Routes', 'cyan');
  log('─'.repeat(60), 'cyan');

  const pagesDir = join(rootDir, 'src/pages');
  const appTsxPath = join(rootDir, 'src/App.tsx');
  
  // Expected pages from the plan
  const expectedPages = {
    marketing: [
      'Home.tsx',
      'Intelligence.tsx',
      'CaseStudies.tsx',
      'Papers.tsx',
      'Pricing.tsx',
      'PartnerProgram.tsx',
      'About.tsx',
      'Terms.tsx',
      'Privacy.tsx',
      'FAQ.tsx',
    ],
    auth: [
      'Login.tsx',
      'Register.tsx',
      'ForgotPassword.tsx',
      'ResetPassword.tsx',
      'Onboarding.tsx',
      'AuthCallback.tsx',
    ],
    app: [
      'Overview.tsx',
      'IntelligenceFeed.tsx',
      'EventsFeed.tsx',
      'EventDetailPage.tsx',
      'SignalsFeed.tsx',
      'SignalDetailPage.tsx',
      'MarketsPage.tsx',
      'AssetDetailPage.tsx',
      'ImpactsPage.tsx',
      'ImpactDetailPage.tsx',
      'Research.tsx',
      'Alerts.tsx',
      'Settings.tsx',
      'AlertSettings.tsx',
      'Profile.tsx',
      'QualityDashboard.tsx',
      'Recommendations.tsx',
    ],
  };

  // Check marketing pages
  log('\n📋 Pages Marketing:', 'blue');
  expectedPages.marketing.forEach(page => {
    const exists = existsSync(join(pagesDir, page));
    results.pages.total++;
    if (exists) {
      results.pages.passed++;
      log(`  ${checkmark(true)} ${page}`);
    } else {
      results.pages.failed++;
      results.errors.push(`Missing marketing page: ${page}`);
      log(`  ${checkmark(false)} ${page} - MISSING`);
    }
  });

  // Check auth pages
  log('\n🔐 Pages Authentification:', 'blue');
  expectedPages.auth.forEach(page => {
    const exists = existsSync(join(pagesDir, page));
    results.pages.total++;
    if (exists) {
      results.pages.passed++;
      log(`  ${checkmark(true)} ${page}`);
    } else {
      results.pages.failed++;
      results.errors.push(`Missing auth page: ${page}`);
      log(`  ${checkmark(false)} ${page} - MISSING`);
    }
  });

  // Check app pages
  log('\n💼 Pages Application:', 'blue');
  expectedPages.app.forEach(page => {
    const exists = existsSync(join(pagesDir, page));
    results.pages.total++;
    if (exists) {
      results.pages.passed++;
      log(`  ${checkmark(true)} ${page}`);
    } else {
      results.pages.failed++;
      results.errors.push(`Missing app page: ${page}`);
      log(`  ${checkmark(false)} ${page} - MISSING`);
    }
  });

  // Check routes in App.tsx
  log('\n🛣️  Routes dans App.tsx:', 'blue');
  if (existsSync(appTsxPath)) {
    const appContent = readFileSync(appTsxPath, 'utf-8');
    
    const expectedRoutes = [
      { path: '/', name: 'Home (public)' },
      { path: '/intelligence-page', name: 'Intelligence Marketing (public)' },
      { path: '/case-studies', name: 'Case Studies (public)' },
      { path: '/papers', name: 'Research/Papers (public)' },
      { path: '/login', name: 'Login (public)' },
      { path: '/register', name: 'Register (public)' },
      { path: '/overview', name: 'Overview (protected)' },
      { path: '/intelligence', name: 'Intelligence Feed (protected)' },
      { path: '/events-feed', name: 'Events Feed (protected)' },
      { path: '/signals-feed', name: 'Signals Feed (protected)' },
      { path: '/markets', name: 'Markets (protected)' },
      { path: '/impacts', name: 'Impacts (protected)' },
      { path: '/research', name: 'Research (protected)' },
      { path: '/alerts', name: 'Alerts (protected)' },
      { path: '/settings', name: 'Settings (protected)' },
      { path: '/profile', name: 'Profile (protected)' },
    ];

    expectedRoutes.forEach(route => {
      const hasRoute = appContent.includes(`path="${route.path}"`) || 
                       appContent.includes(`path='${route.path}'`);
      results.routes.total++;
      if (hasRoute) {
        results.routes.passed++;
        log(`  ${checkmark(true)} ${route.name} (${route.path})`);
      } else {
        results.routes.failed++;
        results.errors.push(`Missing route: ${route.path}`);
        log(`  ${checkmark(false)} ${route.name} (${route.path}) - NOT FOUND`);
      }
    });

    // Check legacy redirects
    log('\n🔄 Redirections Legacy:', 'blue');
    const legacyRedirects = [
      { from: '/dashboard', to: '/overview' },
      { from: '/app', to: '/overview' },
      { from: '/events', to: '/events-feed' },
    ];

    legacyRedirects.forEach(redirect => {
      const hasRedirect = appContent.includes(`path="${redirect.from}"`) &&
                         appContent.includes(`to="${redirect.to}"`);
      results.routes.total++;
      if (hasRedirect) {
        results.routes.passed++;
        log(`  ${checkmark(true)} ${redirect.from} → ${redirect.to}`);
      } else {
        results.routes.failed++;
        results.errors.push(`Missing redirect: ${redirect.from} → ${redirect.to}`);
        log(`  ${checkmark(false)} ${redirect.from} → ${redirect.to} - NOT FOUND`);
      }
    });
  } else {
    log(`  ${checkmark(false)} App.tsx not found`, 'red');
    results.errors.push('App.tsx file not found');
  }
}

// ============================================
// 2. Audit des API Endpoints
// ============================================

function auditAPIEndpoints() {
  log('\n📡 2. Audit des API Endpoints', 'cyan');
  log('─'.repeat(60), 'cyan');

  const apiServerPath = join(rootDir, 'src/server/api-server.ts');
  
  if (!existsSync(apiServerPath)) {
    log(`  ${checkmark(false)} api-server.ts not found`, 'red');
    results.errors.push('api-server.ts file not found');
    return;
  }

  const apiContent = readFileSync(apiServerPath, 'utf-8');

  const expectedEndpoints = [
    { method: 'GET', path: '/health', name: 'Health check' },
    { method: 'GET', path: '/health/twelvedata', name: 'Twelve Data health check' },
    { method: 'GET', path: '/api/market-data/:symbol', name: 'Market data real-time' },
    { method: 'GET', path: '/api/market-data/:symbol/timeseries', name: 'Market data timeseries' },
    { method: 'POST', path: '/api/signals', name: 'Generate signals' },
    { method: 'POST', path: '/api/impacts', name: 'Generate impacts' },
    { method: 'POST', path: '/live-search', name: 'Live search' },
    { method: 'POST', path: '/deep-research', name: 'Deep research' },
    { method: 'POST', path: '/process-event', name: 'Process event' },
    { method: 'POST', path: '/personalized-collect', name: 'Personalized collect' },
    { method: 'POST', path: '/api/predict-relevance', name: 'Predict relevance' },
    { method: 'GET', path: '/metrics', name: 'Performance metrics' },
    { method: 'POST', path: '/track-action', name: 'Track action' },
  ];

  log('\n✅ Endpoints Implémentés:', 'blue');
  expectedEndpoints.forEach(endpoint => {
    const pattern = `app.${endpoint.method.toLowerCase()}(['"]${endpoint.path.replace(':', '\\:')}['"]`;
    const hasEndpoint = apiContent.includes(`app.${endpoint.method.toLowerCase()}(`) &&
                       apiContent.includes(endpoint.path);
    results.api.total++;
    if (hasEndpoint) {
      results.api.passed++;
      log(`  ${checkmark(true)} ${endpoint.method} ${endpoint.path} - ${endpoint.name}`);
    } else {
      results.api.failed++;
      results.errors.push(`Missing endpoint: ${endpoint.method} ${endpoint.path}`);
      log(`  ${checkmark(false)} ${endpoint.method} ${endpoint.path} - ${endpoint.name} - NOT FOUND`);
    }
  });

  // Check for missing endpoints (optional)
  log('\n⏳ Endpoints Manquants (Optionnels):', 'yellow');
  const optionalEndpoints = [
    { method: 'GET', path: '/api/overview/kpis', name: 'Overview KPIs' },
    { method: 'GET', path: '/api/overview/narrative', name: 'Overview narrative' },
    { method: 'GET', path: '/api/markets/movers', name: 'Market movers' },
    { method: 'GET', path: '/api/alerts/triggered', name: 'Triggered alerts' },
    { method: 'GET', path: '/api/events', name: 'Events list' },
    { method: 'GET', path: '/api/events/:id/context', name: 'Event context' },
    { method: 'GET', path: '/api/signals', name: 'Signals list' },
    { method: 'GET', path: '/api/signals/:id', name: 'Signal detail' },
    { method: 'GET', path: '/api/markets/overview', name: 'Markets overview' },
    { method: 'GET', path: '/api/markets/asset/:symbol/attribution', name: 'Asset attribution' },
    { method: 'GET', path: '/api/impacts', name: 'Impacts list' },
    { method: 'GET', path: '/api/impacts/:id', name: 'Impact detail' },
  ];

  optionalEndpoints.forEach(endpoint => {
    const hasEndpoint = apiContent.includes(`app.${endpoint.method.toLowerCase()}(`) &&
                       apiContent.includes(endpoint.path);
    if (!hasEndpoint) {
      log(`  ⚠️  ${endpoint.method} ${endpoint.path} - ${endpoint.name} - NOT IMPLEMENTED`);
    } else {
      log(`  ${checkmark(true)} ${endpoint.method} ${endpoint.path} - ${endpoint.name}`);
    }
  });
}

// ============================================
// 3. Audit des Intégrations
// ============================================

function auditIntegrations() {
  log('\n🔌 3. Audit des Intégrations', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Check environment variables in code
  const envVars = {
    clerk: ['VITE_CLERK_PUBLISHABLE_KEY'],
    supabase: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    twelvedata: ['TWELVEDATA_API_KEY'],
    openai: ['OPENAI_API_KEY'],
    tavily: ['TAVILY_API_KEY'],
  };

  log('\n🔑 Variables d\'Environnement (dans le code):', 'blue');
  
  // Check Clerk
  log('\n  Clerk:', 'yellow');
  const clerkFiles = [
    join(rootDir, 'src/main.tsx'),
    join(rootDir, 'src/components/ClerkWrapper.tsx'),
  ];
  envVars.clerk.forEach(varName => {
    let found = false;
    clerkFiles.forEach(file => {
      if (existsSync(file)) {
        const content = readFileSync(file, 'utf-8');
        if (content.includes(varName)) {
          found = true;
        }
      }
    });
    results.integrations.total++;
    if (found) {
      results.integrations.passed++;
      log(`    ${checkmark(true)} ${varName} référencé`);
    } else {
      results.integrations.failed++;
      results.errors.push(`Clerk env var not found in code: ${varName}`);
      log(`    ${checkmark(false)} ${varName} - NOT FOUND`);
    }
  });

  // Check Supabase (frontend vars only - SERVICE_ROLE_KEY is backend only)
  log('\n  Supabase:', 'yellow');
  const supabaseFile = join(rootDir, 'src/lib/supabase.ts');
  const apiServerFile = join(rootDir, 'src/server/api-server.ts');
  if (existsSync(supabaseFile)) {
    const content = readFileSync(supabaseFile, 'utf-8');
    // Only check frontend vars
    const frontendVars = envVars.supabase.filter(v => v.startsWith('VITE_'));
    frontendVars.forEach(varName => {
      const found = content.includes(varName);
      results.integrations.total++;
      if (found) {
        results.integrations.passed++;
        log(`    ${checkmark(true)} ${varName} référencé`);
      } else {
        results.integrations.failed++;
        results.errors.push(`Supabase env var not found: ${varName}`);
        log(`    ${checkmark(false)} ${varName} - NOT FOUND`);
      }
    });
    // Check SERVICE_ROLE_KEY in backend
    if (existsSync(apiServerFile)) {
      const apiContent = readFileSync(apiServerFile, 'utf-8');
      const serviceRoleKey = 'SUPABASE_SERVICE_ROLE_KEY';
      const found = apiContent.includes(serviceRoleKey);
      results.integrations.total++;
      if (found) {
        results.integrations.passed++;
        log(`    ${checkmark(true)} ${serviceRoleKey} référencé (backend)`);
      } else {
        results.integrations.failed++;
        results.errors.push(`Supabase SERVICE_ROLE_KEY not found in backend`);
        log(`    ${checkmark(false)} ${serviceRoleKey} - NOT FOUND (backend)`);
      }
    }
  }

  // Check Twelve Data
  log('\n  Twelve Data:', 'yellow');
  const twelvedataFile = join(rootDir, 'src/server/services/twelvedata-service.ts');
  if (existsSync(twelvedataFile)) {
    const content = readFileSync(twelvedataFile, 'utf-8');
    envVars.twelvedata.forEach(varName => {
      const found = content.includes(varName);
      results.integrations.total++;
      if (found) {
        results.integrations.passed++;
        log(`    ${checkmark(true)} ${varName} référencé`);
      } else {
        results.integrations.failed++;
        results.errors.push(`Twelve Data env var not found: ${varName}`);
        log(`    ${checkmark(false)} ${varName} - NOT FOUND`);
      }
    });
  }

  // Check components
  log('\n🧩 Composants d\'Intégration:', 'blue');
  const integrationComponents = [
    { file: 'src/components/ClerkWrapper.tsx', name: 'ClerkWrapper' },
    { file: 'src/components/ClerkErrorBoundary.tsx', name: 'ClerkErrorBoundary' },
    { file: 'src/components/ProtectedRoute.tsx', name: 'ProtectedRoute' },
    { file: 'src/components/PublicRoute.tsx', name: 'PublicRoute' },
    { file: 'src/components/ui/ErrorState.tsx', name: 'ErrorState' },
  ];

  integrationComponents.forEach(comp => {
    const exists = existsSync(join(rootDir, comp.file));
    results.components.total++;
    if (exists) {
      results.components.passed++;
      log(`  ${checkmark(true)} ${comp.name} (${comp.file})`);
    } else {
      results.components.failed++;
      results.errors.push(`Missing component: ${comp.name}`);
      log(`  ${checkmark(false)} ${comp.name} (${comp.file}) - MISSING`);
    }
  });
}

// ============================================
// 4. Audit des Composants Layout
// ============================================

function auditLayoutComponents() {
  log('\n🏗️  4. Audit des Composants Layout', 'cyan');
  log('─'.repeat(60), 'cyan');

  const layoutComponents = [
    { file: 'src/components/layout/AppShell.tsx', name: 'AppShell' },
    { file: 'src/components/layout/TopNav.tsx', name: 'TopNav' },
    { file: 'src/components/layout/SideNav.tsx', name: 'SideNav' },
    { file: 'src/components/layout/MainContent.tsx', name: 'MainContent' },
    { file: 'src/components/layout/RightInspector.tsx', name: 'RightInspector' },
  ];

  layoutComponents.forEach(comp => {
    const exists = existsSync(join(rootDir, comp.file));
    results.components.total++;
    if (exists) {
      results.components.passed++;
      log(`  ${checkmark(true)} ${comp.name}`);
    } else {
      results.components.failed++;
      results.errors.push(`Missing layout component: ${comp.name}`);
      log(`  ${checkmark(false)} ${comp.name} - MISSING`);
    }
  });
}

// ============================================
// 5. Audit Responsive Design
// ============================================

function auditResponsiveDesign() {
  log('\n📱 5. Audit Responsive Design', 'cyan');
  log('─'.repeat(60), 'cyan');

  const keyFiles = [
    join(rootDir, 'src/components/layout/AppShell.tsx'),
    join(rootDir, 'src/components/layout/SideNav.tsx'),
    join(rootDir, 'src/components/layout/TopNav.tsx'),
    join(rootDir, 'src/components/layout/RightInspector.tsx'),
  ];

  log('\n📱 Classes Responsive:', 'blue');
  const responsivePatterns = [
    { pattern: 'sm:', name: 'Small breakpoint (sm:)' },
    { pattern: 'md:', name: 'Medium breakpoint (md:)' },
    { pattern: 'lg:', name: 'Large breakpoint (lg:)' },
    { pattern: 'col-span-1 sm:col-span-', name: 'Responsive grid columns' },
    { pattern: 'lg:hidden', name: 'Mobile-only visibility' },
    { pattern: 'hidden lg:', name: 'Desktop-only visibility' },
  ];

  let totalChecks = 0;
  let passedChecks = 0;

  keyFiles.forEach(file => {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf-8');
      responsivePatterns.forEach(pattern => {
        totalChecks++;
        if (content.includes(pattern.pattern)) {
          passedChecks++;
          log(`  ${checkmark(true)} ${pattern.name} dans ${file.split('/').pop()}`);
        } else {
          log(`  ${checkmark(false)} ${pattern.name} dans ${file.split('/').pop()}`);
        }
      });
    }
  });

  if (totalChecks > 0) {
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    log(`\n  Responsive coverage: ${percentage}% (${passedChecks}/${totalChecks})`);
  }
}

// ============================================
// 6. Audit Gestion d'Erreurs
// ============================================

function auditErrorHandling() {
  log('\n⚠️  6. Audit Gestion d\'Erreurs', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Check ErrorState component
  const errorStateFile = join(rootDir, 'src/components/ui/ErrorState.tsx');
  const hasErrorState = existsSync(errorStateFile);
  
  log('\n🛡️  Composants d\'Erreur:', 'blue');
  results.components.total++;
  if (hasErrorState) {
    results.components.passed++;
    log(`  ${checkmark(true)} ErrorState component`);
  } else {
    results.components.failed++;
    results.errors.push('Missing ErrorState component');
    log(`  ${checkmark(false)} ErrorState component - MISSING`);
  }

  // Check ErrorBoundary
  const errorBoundaryFile = join(rootDir, 'src/components/ErrorBoundary.tsx');
  const hasErrorBoundary = existsSync(errorBoundaryFile);
  results.components.total++;
  if (hasErrorBoundary) {
    results.components.passed++;
    log(`  ${checkmark(true)} ErrorBoundary component`);
  } else {
    results.components.failed++;
    results.errors.push('Missing ErrorBoundary component');
    log(`  ${checkmark(false)} ErrorBoundary component - MISSING`);
  }

  // Check error handling in API server
  log('\n🔧 Gestion d\'Erreurs API:', 'blue');
  const apiServerPath = join(rootDir, 'src/server/api-server.ts');
  if (existsSync(apiServerPath)) {
    const content = readFileSync(apiServerPath, 'utf-8');
    const hasErrorHandling = content.includes('try {') && content.includes('catch');
    const hasStandardizedErrors = content.includes('success: false') || 
                                   content.includes('error:');
    results.api.total += 2;
    if (hasErrorHandling) {
      results.api.passed++;
      log(`  ${checkmark(true)} Try-catch blocks présents`);
    } else {
      results.api.failed++;
      log(`  ${checkmark(false)} Try-catch blocks - MISSING`);
    }
    if (hasStandardizedErrors) {
      results.api.passed++;
      log(`  ${checkmark(true)} Réponses d'erreur standardisées`);
    } else {
      results.api.failed++;
      log(`  ${checkmark(false)} Réponses d'erreur standardisées - MISSING`);
    }
  }
}

// ============================================
// Main Execution
// ============================================

function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔍 AUDIT DES FONCTIONNALITÉS - PRÉPARATION BETA TEST', 'cyan');
  log('='.repeat(60), 'cyan');

  auditPagesAndRoutes();
  auditAPIEndpoints();
  auditIntegrations();
  auditLayoutComponents();
  auditResponsiveDesign();
  auditErrorHandling();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RÉSUMÉ', 'cyan');
  log('='.repeat(60), 'cyan');

  const categories = [
    { name: 'Pages', data: results.pages },
    { name: 'Routes', data: results.routes },
    { name: 'API Endpoints', data: results.api },
    { name: 'Intégrations', data: results.integrations },
    { name: 'Composants', data: results.components },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTotal = 0;

  categories.forEach(cat => {
    const { passed, failed, total } = cat.data;
    totalPassed += passed;
    totalFailed += failed;
    totalTotal += total;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
    log(`\n${cat.name}:`, 'blue');
    log(`  ${checkmark(true)} ${passed} / ${checkmark(false)} ${failed} / Total: ${total} (${percentage}%)`, color);
  });

  const overallPercentage = totalTotal > 0 ? Math.round((totalPassed / totalTotal) * 100) : 0;
  log(`\n${'─'.repeat(60)}`, 'cyan');
  log(`\nTOTAL: ${totalPassed} passés / ${totalFailed} échoués / ${totalTotal} total (${overallPercentage}%)`, 
       overallPercentage >= 80 ? 'green' : overallPercentage >= 50 ? 'yellow' : 'red');

  if (results.errors.length > 0) {
    log(`\n❌ ERREURS TROUVÉES (${results.errors.length}):`, 'red');
    results.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, 'red');
    });
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ Audit terminé!', 'green');
  log('='.repeat(60), 'cyan');
  log('\n📝 Note: Certaines vérifications nécessitent des tests manuels.', 'yellow');
  log('   Consultez MANUAL_AUDIT_CHECKLIST.md pour les tests UX.', 'yellow');
  log('');

  // Exit code
  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
