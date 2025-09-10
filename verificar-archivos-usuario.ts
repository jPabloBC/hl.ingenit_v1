import { createClient } from '@supabase/supabase-js';

// Cliente con clave de servicio para operaciones administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verificarArchivosUsuario() {
  console.log("🔍 Verificando archivos del usuario en el bucket...");
  
  try {
    const userId = "f09b83d1-3b15-4eff-80c4-26827c0f7ce6";
    
    // 1. Listar contenido de la carpeta del usuario
    console.log(`📁 Listando contenido de la carpeta del usuario: ${userId}`);
    const { data: userFiles, error: userFilesError } = await supabaseAdmin.storage
      .from('hotel')
      .list(userId, { limit: 1000, offset: 0 });

    if (userFilesError) {
      console.error("❌ Error al listar archivos del usuario:", userFilesError);
    } else {
      console.log("📁 Archivos del usuario:", userFiles?.length || 0);
      if (userFiles && userFiles.length > 0) {
        userFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
        });
      }
    }

    // 2. Verificar si hay carpeta de icons
    console.log(`\n📁 Verificando carpeta de icons: ${userId}/icons`);
    const { data: iconFiles, error: iconFilesError } = await supabaseAdmin.storage
      .from('hotel')
      .list(`${userId}/icons`, { limit: 1000, offset: 0 });

    if (iconFilesError) {
      console.error("❌ Error al listar archivos de icons:", iconFilesError);
    } else {
      console.log("📁 Archivos de icons:", iconFiles?.length || 0);
      if (iconFiles && iconFiles.length > 0) {
        iconFiles.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
          
          // Generar URL pública
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('hotel')
            .getPublicUrl(`${userId}/icons/${file.name}`);
          
          console.log(`     URL pública: ${publicUrl}`);
        });
      }
    }

    // 3. Intentar actualizar el icon_url en la base de datos
    if (iconFiles && iconFiles.length > 0) {
      const iconFile = iconFiles[0];
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('hotel')
        .getPublicUrl(`${userId}/icons/${iconFile.name}`);
      
      console.log(`\n🔄 Intentando actualizar icon_url en la base de datos...`);
      console.log(`URL a guardar: ${publicUrl}`);
      
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('hl_business')
        .update({ 
          icon_url: publicUrl
        })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error("❌ Error al actualizar icon_url:", updateError);
      } else {
        console.log("✅ icon_url actualizado exitosamente:", updateData);
      }
    }

  } catch (error) {
    console.error("❌ Error general:", error);
  }

  console.log("\n🎉 Verificación completada");
}

verificarArchivosUsuario();
