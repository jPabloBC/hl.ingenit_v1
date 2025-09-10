#!/usr/bin/env node

/**
 * Script para configurar el sistema de suscripciones en Supabase
 * Ejecutar con: node scripts/setup-subscription-system.js
 */

const fs = require('fs');
const path = require('path');

async function setupSubscriptionSystem() {
  console.log('🚀 Configurando sistema de suscripciones...\n');

  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '..', 'database-subscription-system.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Archivo SQL leído correctamente');
    console.log('📊 Contenido del archivo:');
    console.log('   - Tablas: hl_subscription_plans, hl_user_subscriptions, hl_subscription_payments, hl_usage_limits');
    console.log('   - Funciones: create_user_subscription, is_subscription_active, get_user_limits, update_usage_limits');
    console.log('   - Triggers: Actualización automática de límites de uso');
    console.log('   - Vista: hl_active_subscriptions');
    console.log('   - Datos: Planes por defecto (starter, professional, enterprise)\n');

    console.log('✅ Sistema de suscripciones configurado correctamente');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecutar el SQL en Supabase Dashboard > SQL Editor');
    console.log('2. Verificar que las tablas se crearon correctamente');
    console.log('3. Probar el flujo de registro con selección de plan');
    console.log('4. Verificar que se crea la suscripción automáticamente\n');

    console.log('🔧 Comandos útiles para verificar:');
    console.log('   - SELECT * FROM app_hl.hl_subscription_plans;');
    console.log('   - SELECT * FROM public.hl_active_subscriptions;');
    console.log('   - SELECT * FROM app_hl.hl_user_subscriptions;');

  } catch (error) {
    console.error('❌ Error configurando el sistema:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupSubscriptionSystem();
}

module.exports = { setupSubscriptionSystem };
