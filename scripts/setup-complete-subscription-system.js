#!/usr/bin/env node

/**
 * Script completo para configurar el sistema de suscripciones
 * Incluye todas las migraciones necesarias
 */

const fs = require('fs');
const path = require('path');

async function setupCompleteSubscriptionSystem() {
  console.log('🚀 Configurando sistema completo de suscripciones...\n');

  try {
    // 1. Leer archivos SQL
    const subscriptionSqlFile = path.join(__dirname, '..', 'database-subscription-system.sql');
    const updateUserSqlFile = path.join(__dirname, '..', 'database-update-hl-user.sql');
    
    const subscriptionSql = fs.readFileSync(subscriptionSqlFile, 'utf8');
    const updateUserSql = fs.readFileSync(updateUserSqlFile, 'utf8');

    console.log('📄 Archivos SQL leídos correctamente');
    console.log('   ✅ database-subscription-system.sql');
    console.log('   ✅ database-update-hl-user.sql\n');

    console.log('📋 INSTRUCCIONES DE INSTALACIÓN:\n');
    
    console.log('1️⃣ EJECUTAR EN SUPABASE DASHBOARD > SQL EDITOR:\n');
    console.log('   📄 Copiar y ejecutar: database-subscription-system.sql');
    console.log('   📄 Copiar y ejecutar: database-update-hl-user.sql\n');

    console.log('2️⃣ VERIFICAR INSTALACIÓN:\n');
    console.log('   🔍 Ejecutar estas consultas para verificar:\n');
    console.log('   ```sql');
    console.log('   -- Verificar tablas de suscripciones');
    console.log('   SELECT * FROM app_hl.hl_subscription_plans;');
    console.log('   SELECT * FROM app_hl.hl_user_subscriptions;');
    console.log('   SELECT * FROM public.hl_active_subscriptions;');
    console.log('   ```\n');

    console.log('3️⃣ PROBAR FLUJO COMPLETO:\n');
    console.log('   🌐 Ir a: http://localhost:3000/pricing');
    console.log('   📝 Seleccionar plan y registrarse');
    console.log('   ✅ Verificar que se crea la suscripción automáticamente\n');

    console.log('4️⃣ VERIFICAR EN DASHBOARD:\n');
    console.log('   🏨 Ir a: http://localhost:3000/hotel');
    console.log('   📊 Ver estado de suscripción y días restantes');
    console.log('   🚨 Probar límites de habitaciones\n');

    console.log('🔧 COMANDOS ÚTILES PARA DEBUGGING:\n');
    console.log('   ```sql');
    console.log('   -- Ver suscripciones activas');
    console.log('   SELECT * FROM public.hl_active_subscriptions;');
    console.log('   ');
    console.log('   -- Ver límites de uso');
    console.log('   SELECT * FROM app_hl.hl_usage_limits;');
    console.log('   ');
    console.log('   -- Ver planes disponibles');
    console.log('   SELECT plan_id, name, max_rooms, max_users, price_monthly FROM app_hl.hl_subscription_plans;');
    console.log('   ```\n');

    console.log('🚨 SOLUCIÓN AL ERROR ACTUAL:\n');
    console.log('   ❌ Error: "Could not find the \'plan_limits\' column"');
    console.log('   ✅ Solución: Ejecutar database-update-hl-user.sql');
    console.log('   📝 O usar el sistema de suscripciones (recomendado)\n');

    console.log('📊 ESTRUCTURA FINAL:\n');
    console.log('   🗄️  Tablas principales:');
    console.log('      • hl_subscription_plans (planes disponibles)');
    console.log('      • hl_user_subscriptions (suscripciones de usuarios)');
    console.log('      • hl_subscription_payments (historial de pagos)');
    console.log('      • hl_usage_limits (límites en tiempo real)');
    console.log('   ');
    console.log('   🔧 Funciones SQL:');
    console.log('      • create_user_subscription()');
    console.log('      • is_subscription_active()');
    console.log('      • get_user_limits()');
    console.log('      • update_usage_limits()');
    console.log('   ');
    console.log('   📊 Vista optimizada:');
    console.log('      • hl_active_subscriptions (consulta rápida)\n');

    console.log('✅ Sistema listo para usar después de ejecutar los SQLs\n');

  } catch (error) {
    console.error('❌ Error configurando el sistema:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  setupCompleteSubscriptionSystem();
}

module.exports = { setupCompleteSubscriptionSystem };
