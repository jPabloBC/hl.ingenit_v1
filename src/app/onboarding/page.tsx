"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import BaseLayout from "@/components/layout/base-layout";
import { Suspense } from "react";
import { Building2, MapPin, CreditCard, Settings, ArrowRight, AlertTriangle, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useGeoData } from "@/hooks/useGeoData";

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Hook de suscripción para obtener límites
  const { subscription, limits, loading: subscriptionLoading, reload: reloadSubscription } = useSubscription();
  
  // Hook de datos geográficos
  const { countries, states, cities, loading: geoLoading, getStatesByCountry, getCitiesByState } = useGeoData();
  
  // Plan seleccionado desde localStorage (fallback)
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Información básica del negocio
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("hotel");
  const [rut, setRut] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  
  // Ubicación
  const [countryCode, setCountryCode] = useState("CL"); // Chile por defecto
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [address, setAddress] = useState("");
  
  // Función para obtener el nombre del país por código
  const getCountryName = (code: string) => {
    const country = countries.find(c => c.isoCode === code);
    return country?.name || code;
  };
  
  // Configuración

  const [floors, setFloors] = useState<Array<{
    id: string;
    floorNumber: number;
    roomsCount: number;
    startNumber: number;
    numberingSystem: "with_prefix" | "simple";
  }>>(() => {
    const initialFloors = [{ id: "1", floorNumber: 1, roomsCount: 5, startNumber: 1, numberingSystem: "with_prefix" as const }];
    console.log('🏗️ Estado inicial de pisos:', initialFloors);
    return initialFloors;
  });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconUrl, setIconUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Teléfono con código de país
  const [phoneCountryCode, setPhoneCountryCode] = useState("+56");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const router = useRouter();

  // Cargar plan seleccionado desde localStorage
  useEffect(() => {
    const storedPlan = localStorage.getItem('selected_plan');
    if (storedPlan) {
      try {
        const planData = JSON.parse(storedPlan);
        setSelectedPlan(planData);
        console.log('📋 Plan cargado desde localStorage:', planData);
      } catch (error) {
        console.error('Error parsing stored plan:', error);
      }
    }
  }, [forceUpdate]); // Solo re-cargar cuando se fuerza actualización

  // Efecto separado para recargar suscripción cuando cambia el plan
  useEffect(() => {
    if (selectedPlan && reloadSubscription) {
      reloadSubscription();
    }
  }, [selectedPlan?.planId]); // Solo cuando cambia el ID del plan

  // Cargar estados de Chile automáticamente al inicializar
  useEffect(() => {
    if (countryCode === 'CL' && !geoLoading) {
      getStatesByCountry('CL');
    }
  }, [countryCode, geoLoading, getStatesByCountry]);

  // Función para manejar cambio de país
  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setStateCode('');
    setCityName('');
    // Cargar estados del nuevo país
    getStatesByCountry(newCountryCode);
  };

  // Función para manejar cambio de estado/región
  const handleStateChange = (newStateCode: string) => {
    setStateCode(newStateCode);
    setCityName('');
    // Cargar ciudades del nuevo estado
    if (newStateCode) {
      getCitiesByState(countryCode, newStateCode);
    }
  };

  // Funciones para manejar pisos
  const addFloor = () => {
    const maxAllowed = getMaxRoomsAllowed();
    const currentTotal = getTotalRooms();
    
    // Validar límite de habitaciones
    if (maxAllowed !== -1 && currentTotal >= maxAllowed) {
      alert(`Has alcanzado el límite de habitaciones de tu plan (${maxAllowed}). Actualiza tu plan para agregar más habitaciones.`);
      return;
    }

    const newFloorNumber = Math.max(...floors.map(f => f.floorNumber)) + 1;
    const newFloor = {
      id: Date.now().toString(),
      floorNumber: newFloorNumber,
      roomsCount: Math.min(5, maxAllowed === -1 ? 5 : Math.max(1, maxAllowed - currentTotal)),
      startNumber: 1,
      numberingSystem: "with_prefix" as const
    };
    console.log('➕ Agregando nuevo piso:', newFloor);
    const updatedFloors = [...floors, newFloor];
    console.log('🏢 Estado de pisos después de agregar:', updatedFloors);
    setFloors(updatedFloors);
  };

  const removeFloor = (floorId: string) => {
    if (floors.length > 1) {
      console.log('➖ Removiendo piso con ID:', floorId);
      const updatedFloors = floors.filter(f => f.id !== floorId);
      console.log('🏢 Estado de pisos después de remover:', updatedFloors);
      setFloors(updatedFloors);
    }
  };

  const updateFloor = (floorId: string, field: string, value: any) => {
    console.log(`🔄 Actualizando piso ${floorId}, campo ${field}, valor:`, value);
    
    // Validar límite de habitaciones si se está cambiando roomsCount
    if (field === 'roomsCount') {
      const maxAllowed = getMaxRoomsAllowed();
      if (maxAllowed !== -1) {
        const currentFloor = floors.find(f => f.id === floorId);
        const otherFloorsTotal = floors
          .filter(f => f.id !== floorId)
          .reduce((total, floor) => total + floor.roomsCount, 0);
        
        const newTotal = otherFloorsTotal + parseInt(value) || 0;
        
        if (newTotal > maxAllowed) {
          alert(`El total de habitaciones (${newTotal}) excede el límite de tu plan (${maxAllowed}). Máximo permitido: ${maxAllowed - otherFloorsTotal}`);
          return;
        }
      }
    }
    
    const updatedFloors = floors.map(f => 
      f.id === floorId ? { ...f, [field]: value } : f
    );
    console.log('🏢 Estado de pisos después de actualización:', updatedFloors);
    setFloors(updatedFloors);
  };

  const getTotalRooms = () => {
    const total = floors.reduce((total, floor) => total + floor.roomsCount, 0);
    return total;
  };

  const getMaxRoomsAllowed = () => {
    // Forzar re-render cuando se actualiza el plan
    forceUpdate; // Referencia para forzar actualización
    
    // Prioridad 1: Límites de la suscripción cargada
    if (limits && limits.maxRooms) {
      return limits.maxRooms;
    }
    
    // Prioridad 2: Plan seleccionado desde localStorage
    if (selectedPlan && selectedPlan.limits && selectedPlan.limits.maxRooms !== undefined) {
      return selectedPlan.limits.maxRooms;
    }
    
    return -1; // Sin límite si no hay información
  };

  const isOverRoomLimit = () => {
    const maxAllowed = getMaxRoomsAllowed();
    if (maxAllowed === -1) return false; // Sin límite
    return getTotalRooms() > maxAllowed;
  };

  const getRemainingRooms = () => {
    const maxAllowed = getMaxRoomsAllowed();
    if (maxAllowed === -1) return -1; // Sin límite
    return Math.max(0, maxAllowed - getTotalRooms());
  };

  const getNextPlan = () => {
    // Forzar re-render cuando se actualiza el plan
    forceUpdate; // Referencia para forzar actualización
    
    // En onboarding, usar el plan seleccionado desde localStorage
    const currentPlanId = subscription?.plan_id || selectedPlan?.planId;
    
    const planHierarchy = {
      'starter': { id: 'professional', name: 'Hoteles Medianos', maxRooms: 50, price: 19990 },
      'professional': { id: 'business', name: 'Hoteles Grandes', maxRooms: 80, price: 29990 },
      'business': { id: 'enterprise', name: 'Hoteles Enterprise', maxRooms: -1, price: 0 },
      'enterprise': null // No hay plan superior
    };
    
    return planHierarchy[currentPlanId as keyof typeof planHierarchy] || null;
  };

  const handleUpgradePlan = async () => {
    const nextPlan = getNextPlan();
    if (!nextPlan) {
      alert('No hay un plan superior disponible.');
      return;
    }

    const confirmMessage = nextPlan.maxRooms === -1 
      ? `¿Actualizar a ${nextPlan.name}? Este plan permite habitaciones ilimitadas. Contactaremos contigo para definir el precio personalizado.`
      : `¿Actualizar a ${nextPlan.name}? Este plan permite hasta ${nextPlan.maxRooms} habitaciones por $${nextPlan.price.toLocaleString()} CLP/mes.`;

    if (confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // En el contexto del onboarding, actualizar el plan seleccionado en localStorage
        if ((!subscription || subscription.subscription_id === 'onboarding') && selectedPlan) {
          // Actualizar el plan seleccionado en localStorage
          const updatedPlan = {
            ...selectedPlan,
            planId: nextPlan.id,
            planName: nextPlan.name,
            limits: {
              ...selectedPlan.limits,
              maxRooms: nextPlan.maxRooms,
              price: nextPlan.price
            }
          };
          
          localStorage.setItem('selected_plan', JSON.stringify(updatedPlan));
          setSelectedPlan(updatedPlan);
          
          // Forzar actualización de la UI
          setForceUpdate(prev => prev + 1);
          
          // Recargar suscripción para reflejar cambios
          if (reloadSubscription) {
            await reloadSubscription();
          }
          
          console.log('Plan actualizado:', updatedPlan);
          console.log('Nuevo límite de habitaciones:', updatedPlan.limits.maxRooms);
          
          alert(`¡Plan actualizado exitosamente a ${nextPlan.name}! Ahora puedes configurar hasta ${nextPlan.maxRooms === -1 ? 'habitaciones ilimitadas' : `${nextPlan.maxRooms} habitaciones`}.`);
          return;
        }
        
        // Si ya tiene suscripción, usar la API normal
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Auth error:', sessionError);
          alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
          return;
        }
        
        const requestBody = { 
          newPlanId: nextPlan.id,
          currentRooms: getTotalRooms()
        };
        
        const response = await fetch('/api/subscriptions/upgrade', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          alert(`¡Plan actualizado exitosamente a ${nextPlan.name}! Ahora puedes configurar hasta ${nextPlan.maxRooms === -1 ? 'habitaciones ilimitadas' : `${nextPlan.maxRooms} habitaciones`}.`);
          
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        } else {
          const error = await response.json();
          alert(`Error al actualizar plan: ${error.error || error.message || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('Error upgrading plan:', error);
        alert('Error al actualizar el plan. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoomNumbers = (floor: any) => {
    const numbers = [];
    const roomsCount = parseInt(floor.roomsCount) || 0;
    
    for (let i = 0; i < roomsCount; i++) {
      if (floor.numberingSystem === "with_prefix") {
        const roomNumber = `${floor.floorNumber}${String(floor.startNumber + i).padStart(2, '0')}`;
        numbers.push(roomNumber);
      } else {
        const roomNumber = floor.startNumber + i;
        numbers.push(roomNumber);
      }
    }
    
    return numbers;
  };

  useEffect(() => {
    // Verificar si el usuario ya tiene datos en hl_business
    checkBusinessData();
  }, []);

  const checkBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('🔍 Verificando datos de negocio para usuario:', user.id);

      const { data: businessData, error: businessError } = await supabase
        .schema("public")
        .from('hl_business')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      console.log('📊 Datos de negocio encontrados:', businessData);
      console.log('❌ Error de negocio:', businessError);

      if (businessError) {
        console.error('Error fetching business data:', businessError);
      }

      if (businessData) {
        // Verificar si tiene todos los datos críticos
        const requiredFields = [
          'business_name',
          'business_type', 
          'country',
          'city',
          'address',
          'rooms_count'
        ];

        const missingFields = requiredFields.filter(field => 
          !businessData[field] || 
          (typeof businessData[field] === 'string' && businessData[field].trim() === '') ||
          (typeof businessData[field] === 'number' && businessData[field] <= 0)
        );

        if (missingFields.length === 0) {
          // Tiene todos los datos, redirigir al dashboard
          router.push('/hotel');
          return;
        }

        // Tiene negocio pero faltan datos, cargar datos existentes para edición
        console.log('🔄 Campos faltantes:', missingFields);
        console.log('📝 Cargando datos existentes para edición');
        setIsEditing(true);
        loadExistingData(businessData);
      }
    } catch (err) {
      console.log('Usuario nuevo, continuar con onboarding');
    }
  };

  const loadExistingData = (businessData: any) => {
    setBusinessName(businessData.business_name || '');
    setBusinessType(businessData.business_type || 'hotel');
    setRut(businessData.rut || '');
    
    // Cargar número de teléfono (solo el número, sin código de país)
    const phone = businessData.business_number || '';
    setPhoneCountryCode('+56'); // Por defecto Chile
    setPhoneNumber(phone);
    
    setCountryCode(businessData.country || 'CL');
    setStateCode(businessData.region || '');
    setCityName(businessData.city || '');
    setAddress(businessData.address || '');

    setIconUrl(businessData.icon_url || '');
    
    // Cargar configuración de pisos si existe
    console.log('🏢 Extra data del negocio:', businessData.extra);
    if (businessData.extra) {
      try {
        const extraData = JSON.parse(businessData.extra);
        console.log('📋 Configuración parseada:', extraData);
        if (extraData.floors_config && Array.isArray(extraData.floors_config)) {
          console.log('🏠 Cargando configuración de pisos:', extraData.floors_config);
          const loadedFloors = extraData.floors_config.map((floor: any, index: number) => ({
            id: (index + 1).toString(),
            floorNumber: floor.floor_number || 1,
            roomsCount: floor.rooms_count || 5,
            startNumber: floor.start_number || 1,
            numberingSystem: floor.numbering_system || 'with_prefix'
          }));
          console.log('🔄 Pisos que se van a cargar:', loadedFloors);
          console.log('🔄 Total de habitaciones de pisos cargados:', loadedFloors.reduce((total: number, floor: any) => total + floor.roomsCount, 0));
          setFloors(loadedFloors);
        }
      } catch (e) {
        console.log('Error parsing extra data:', e);
      }
    }
  };

  const formatRut = (rut: string): string => {
    // Limpiar el RUT de puntos y guiones
    let cleanRut = rut.replace(/[.-]/g, '');
    
    // Si no tiene dígito verificador, no formatear
    if (cleanRut.length < 2) return rut;
    
    // Separar número y dígito verificador
    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    
    // Formatear número con puntos
    let formattedNumber = '';
    for (let i = number.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedNumber = '.' + formattedNumber;
      }
      formattedNumber = number[i] + formattedNumber;
    }
    
    // Retornar RUT formateado
    return `${formattedNumber}-${dv}`;
  };

  const handleNext = () => {
    if (step < 4) {
      console.log(`🔄 Avanzando del paso ${step} al paso ${step + 1}`);
      if (step === 3) {
        console.log('📋 Estado final de pisos antes del resumen:', floors);
        console.log('📊 Total calculado antes del resumen:', getTotalRooms());
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevenir ejecución múltiple
    if (loading) {
      console.log('⚠️ Submit ya en progreso, ignorando');
      return;
    }
    
    setLoading(true);
    setError("");
    
    // DEBUG: Verificar estado de pisos al momento del submit
    const executionId = Date.now();
    console.log(`=== DEBUG SUBMIT [${executionId}] ===`);
    console.log('Estado de floors al hacer submit:', floors);
    console.log('Total de habitaciones calculado:', getTotalRooms());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }

      let finalIconUrl = iconUrl;

      // Subir archivo si se seleccionó uno
      if (iconFile) {
        try {
          // Generar nombre único para el archivo
          const fileExtension = iconFile.name.split('.').pop();
          const fileName = `icon_${Date.now()}.${fileExtension}`;
          const filePath = `${user.id}/${fileName}`;

          // Subir archivo al bucket 'hotel'
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('hotel')
            .upload(filePath, iconFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Error subiendo archivo: ${uploadError.message}`);
          }

          // Obtener URL pública del archivo
          const { data: urlData } = supabase.storage
            .from('hotel')
            .getPublicUrl(filePath);

          finalIconUrl = urlData.publicUrl;
        } catch (uploadErr: any) {
          console.error('Error subiendo icono:', uploadErr);
          setError(`Error subiendo icono: ${uploadErr.message}`);
          setLoading(false);
          return;
        }
      }

      const businessData = {
        business_name: businessName.trim(),
        business_type: businessType,
        rut: rut.trim(),
        business_number: phoneNumber.trim(),
        country: getCountryName(countryCode),
        region: states.find(s => s.isoCode === stateCode)?.name || stateCode,
        city: cityName.trim(),
        address: address.trim(),
        rooms_count: getTotalRooms(),
        icon_url: finalIconUrl || null,
        extra: JSON.stringify({
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
          floors_config: floors.map(floor => ({
            floor_number: floor.floorNumber,
            rooms_count: floor.roomsCount,
            start_number: floor.startNumber,
            numbering_system: floor.numberingSystem,
            room_numbers: getRoomNumbers(floor)
          })),
          total_rooms: getTotalRooms()
        }),
        updated_at: new Date().toISOString()
      };

      // >>> INSERTAR AQUÍ (después de const businessData = {...}):
      const allowedKeys = [
        "business_name","business_type","rut","business_number",
        "country","region","city","address","rooms_count",
        "icon_url","extra","updated_at","user_id"
      ];
      const safeBusinessData = Object.fromEntries(
        Object.entries({
          ...businessData,
          user_id: (await supabase.auth.getUser()).data.user?.id || null
        }).filter(([k]) => allowedKeys.includes(k))
      );
      // blindaje extra
      delete (safeBusinessData as any).business_id;

      // DEBUG: Verificar contenido de businessData
      console.log(`[${executionId}] businessData antes del insert:`, businessData);
      console.log(`[${executionId}] Claves de businessData:`, Object.keys(businessData));

      let businessId: string;

      if (isEditing) {
        // Actualizar registro existente en hl_business
        const { data: updatedBusiness, error: businessError } = await supabase
          .schema("public")
          .from('hl_business')
          .update({
            business_name: businessData.business_name,
            business_type: businessData.business_type,
            rut: businessData.rut,
            business_number: String(businessData.business_number || "").trim(),
            country: businessData.country,
            region: businessData.region,
            city: businessData.city,
            address: businessData.address,
            rooms_count: businessData.rooms_count,
            icon_url: businessData.icon_url
          })
          .eq('user_id', user.id)
          .select('id')
          .single();

        if (businessError) {
          throw businessError;
        }
        businessId = updatedBusiness.id;
      } else {
        // SOLUCIÓN: Usar función RPC que evita triggers
        const { data: newBizId, error: rpcErr } = await supabase.rpc('create_business_final', {
          p_business_name: businessName.trim(),
          p_business_type: businessType || 'hotel',
          p_rut: rut.trim() || null,
          p_business_number: phoneNumber ? parseInt(phoneNumber, 10) : null,
          p_country: getCountryName(countryCode),
          p_region: states.find(s => s.isoCode === stateCode)?.name || stateCode,
          p_city: cityName.trim() || null,
          p_address: address.trim() || null,
          p_rooms_count: getTotalRooms() || 0,
          p_icon_url: iconUrl || null,
          p_extra: {
            onboarding_completed: true,
            completed_at: new Date().toISOString(),
            floors_config: floors.map(floor => ({
              floor_number: floor.floorNumber,
              rooms_count: floor.roomsCount,
              start_number: floor.startNumber,
              numbering_system: floor.numberingSystem,
              room_numbers: getRoomNumbers(floor)
            })),
            total_rooms: getTotalRooms()
          },
          p_user_id: (await supabase.auth.getUser()).data.user?.id || null
        });

        console.log('RPC create_business_final result -> data:', newBizId, 'error:', rpcErr);
        if (rpcErr) throw rpcErr;
        businessId = newBizId as string;
      }

      // PRIMERO: Verificar habitaciones existentes
      console.log(`[${executionId}] Verificando habitaciones existentes para business_id:`, businessId);
      const { data: existingRooms, error: selectError } = await supabase
        .schema("public")
        .from('hl_rooms')
        .select('*')
        .eq('business_id', businessId);

      if (selectError) {
        console.error('Error verificando habitaciones existentes:', selectError);
      } else {
        console.log('Habitaciones existentes encontradas:', existingRooms?.length || 0);
        if (existingRooms && existingRooms.length > 0) {
          console.log('Habitaciones existentes:', existingRooms.map(r => `${r.room_number} (Piso ${r.floor})`));
          
          // Eliminar habitaciones existentes
          const { error: deleteError } = await supabase
            .schema("public")
            .from('hl_rooms')
            .delete()
            .eq('business_id', businessId);

          if (deleteError) {
            console.error('Error eliminando habitaciones existentes:', deleteError);
          } else {
            console.log('Habitaciones existentes eliminadas correctamente');
          }
        }
      }

      // SEGUNDO: Crear todas las habitaciones según la configuración actual
      const roomsToInsert = [];
      
      // Debug: log de la configuración de pisos
      console.log(`[${executionId}] Configuración de pisos al crear habitaciones:`, floors);
      console.log(`[${executionId}] ===== DEBUGGING ROOM CREATION =====`);
      
      for (const floor of floors) {
        console.log(`[${executionId}] Procesando piso:`, floor);
        console.log(`[${executionId}] floor.roomsCount:`, floor.roomsCount);
        console.log(`[${executionId}] floor.floorNumber:`, floor.floorNumber);
        console.log(`[${executionId}] floor.startNumber:`, floor.startNumber);
        console.log(`[${executionId}] floor.numberingSystem:`, floor.numberingSystem);
        
        const roomNumbers = getRoomNumbers(floor);
        console.log(`[${executionId}] Piso ${floor.floorNumber}: CONFIGURADO PARA ${floor.roomsCount} habitaciones`);
        console.log(`[${executionId}] Números de habitaciones generados:`, roomNumbers);
        console.log(`[${executionId}] Cantidad real de números generados:`, roomNumbers.length);
        
        for (const roomNumber of roomNumbers) {
          roomsToInsert.push({
            business_id: businessId,
            room_number: roomNumber.toString(),
            room_type: 'single', // Cambiar a 'single' que sí existe
            floor: floor.floorNumber,
            price: 0, // Precio por defecto
            capacity: 2, // Capacidad por defecto
            status: 'active',
            created_at: new Date().toISOString()
          });
        }
      }
      
      console.log(`[${executionId}] ===== RESUMEN FINAL =====`);
      console.log(`[${executionId}] Total de pisos procesados:`, floors.length);
      console.log(`[${executionId}] Total de habitaciones a crear:`, roomsToInsert.length);
      console.log(`[${executionId}] Detalle por piso:`, floors.map(f => `Piso ${f.floorNumber}: ${f.roomsCount} habitaciones`));
      
      console.log('Total de habitaciones a crear:', roomsToInsert.length);

      // Insertar todas las habitaciones
      if (roomsToInsert.length > 0) {
        console.log('Intentando insertar habitaciones:', roomsToInsert);
        
        // DEBUG: Verificar estructura de datos antes del insert
        console.log(`[${executionId}] Estructura de la primera habitación:`, roomsToInsert[0]);
        console.log(`[${executionId}] Tipos de datos de la primera habitación:`, Object.entries(roomsToInsert[0]).map(([key, value]) => `${key}: ${typeof value}`));

        const { data: insertedRooms, error: roomsError } = await supabase
          .schema("public")
          .from('hl_rooms')
          .insert(roomsToInsert)
          .select();

        if (roomsError) {
          console.error('Error creando habitaciones:', roomsError);
          console.error('Detalles del error:', JSON.stringify(roomsError, null, 2));
          // No fallar si las habitaciones no se crean, solo log
        } else {
          console.log('Habitaciones creadas exitosamente:', insertedRooms);
        }
      }

      // Crear suscripción si no existe (solo en creación, no en edición)
      if (!isEditing && selectedPlan) {
        try {
          console.log('Creando suscripción para plan:', selectedPlan.planId);
          
          const subscriptionResponse = await fetch('/api/subscriptions/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              planId: selectedPlan.planId
            })
          });

          if (subscriptionResponse.ok) {
            console.log('Suscripción creada exitosamente');
          } else {
            console.warn('Error creando suscripción:', await subscriptionResponse.text());
          }
        } catch (subscriptionError) {
          console.warn('Error creando suscripción:', subscriptionError);
        }
      }

      // Redirigir al dashboard
      router.push('/hotel');
      
    } catch (err: any) {
      console.error('Error creando/actualizando negocio:', err);
      setError(`Error: ${err.message || 'Error inesperado'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-10 h-10 text-blue8" />
        </div>
        <h2 className="text-2xl font-bold text-blue1" style={{ fontFamily: 'var(--font-archivo)' }}>
          {isEditing ? 'Completar Datos del Negocio' : 'Información Básica'}
        </h2>
        <p className="text-gray4" style={{ fontFamily: 'var(--font-sansation)' }}>
          {isEditing ? 'Completemos la información faltante de tu negocio' : 'Configuremos tu negocio paso a paso'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue1 mb-2" style={{ fontFamily: 'var(--font-archivo)' }}>Nombre del Hotel / Establecimiento</label>
                      <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="Ej: Hotel Plaza, Motel Central"
              value={businessName}
              onChange={e => {
                const capitalized = e.target.value.replace(/\b\w/g, l => l.toUpperCase());
                setBusinessName(capitalized);
              }}
              required
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-blue1 mb-2 font-title">Tipo del Hotel / Establecimiento</label>
                      <select
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
            >
            <option value="hotel">Hotel</option>
            <option value="motel">Motel</option>
            <option value="hostal">Hostal</option>
            <option value="residencial">Residencial</option>
            <option value="cabañas">Cabañas</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">
              {countryCode === 'CL' ? 'RUT de la Empresa' : 'Documento de la Empresa'}
            </label>
                          <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                placeholder={countryCode === 'CL' ? '12.345.678-9' : 'Documento de identidad empresarial'}
                value={rut}
                onChange={e => setRut(e.target.value)}
                onBlur={e => {
                  if (countryCode === 'CL') {
                    const formattedRut = formatRut(e.target.value);
                    setRut(formattedRut);
                  }
                }}
              />
            <p className="text-xs text-gray4 mt-1 font-body">
              {countryCode === 'CL' 
                ? 'RUT de la empresa (no tu RUT personal)' 
                : 'Documento de identidad de la empresa (no personal)'}
            </p>
            {countryCode === 'CL' && rut.trim() && !validateRut() && (
              <p className="text-xs text-red-500 mt-1 font-body">
                ⚠️ RUT inválido. Verifica el formato y dígito verificador.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Teléfono del Negocio</label>
            <div className="flex">
              <select
                value={phoneCountryCode}
                onChange={e => setPhoneCountryCode(e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 border-r-0 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              >
                <option value="+56">🇨🇱 +56</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+51">🇵🇪 +51</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input
                type="tel"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                placeholder="9 1234 5678"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray4 mt-1 font-body">Teléfono principal de contacto del negocio</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue15 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-10 h-10 text-blue8" />
        </div>
        <h2 className="text-2xl font-bold text-blue1" style={{ fontFamily: 'var(--font-archivo)' }}>Ubicación</h2>
        <p className="text-gray4" style={{ fontFamily: 'var(--font-sansation)' }}>¿Dónde se encuentra tu negocio?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-blue1 mb-2 font-title">País</label>
          <select
            value={countryCode}
            onChange={e => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
            disabled={geoLoading}
          >
            <option value="">Selecciona un país</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        {countryCode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue1 mb-2 font-title">Región/Estado</label>
              <select
                value={stateCode}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                disabled={!countryCode || states.length === 0}
                required
              >
                <option value="">Selecciona una región</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-blue1 mb-2 font-title">Ciudad/Comuna</label>
              <select
                value={cityName}
                onChange={e => setCityName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                disabled={!stateCode || cities.length === 0}
                required
              >
                <option value="">{stateCode ? 'Selecciona una ciudad' : 'Primero selecciona región'}</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-blue1 mb-2 font-title">Dirección Completa</label>
                      <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
              placeholder="Calle, número, comuna"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue15 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-10 h-10 text-blue8" />
        </div>
        <h2 className="text-2xl font-bold text-blue1" style={{ fontFamily: 'var(--font-archivo)' }}>Configuración</h2>
        <p className="text-gray4" style={{ fontFamily: 'var(--font-sansation)' }}>Configuremos las características de tu negocio</p>
      </div>

      <div className="space-y-6">
        {/* Configuración de Habitaciones por Pisos */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue1 mb-2" style={{ fontFamily: 'var(--font-archivo)' }}>Configuración de Pisos y Habitaciones</h3>
            <p className="text-sm text-gray4" style={{ fontFamily: 'var(--font-sansation)' }}>Comienza configurando el piso 1 y agrega más pisos según necesites</p>
          </div>

          {/* Información del Plan Actual */}
          {(!subscriptionLoading && (subscription || selectedPlan)) && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800" style={{ fontFamily: 'var(--font-archivo)' }}>
                      Plan Actual: {subscription?.plan_name || selectedPlan?.planName || 'Plan'}
                    </h4>
                    <p className="text-sm text-blue-600" style={{ fontFamily: 'var(--font-sansation)' }}>
                      {subscription?.status === 'trial' ? 'Período de prueba activo' : 'Suscripción activa'}
                      {subscription?.trial_days_remaining && subscription.trial_days_remaining > 0 && (
                        <span className="ml-2">({subscription.trial_days_remaining} días restantes)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-800" style={{ fontFamily: 'var(--font-archivo)' }}>
                    Límite de Habitaciones
                  </p>
                  <p className="text-lg font-bold text-blue-600" style={{ fontFamily: 'var(--font-sansation)' }}>
                    {getMaxRoomsAllowed() === -1 ? '∞' : getMaxRoomsAllowed()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de Límites de Suscripción */}
          {(!subscriptionLoading && (limits || selectedPlan) && getMaxRoomsAllowed() !== -1) && (
            <div className={`rounded-lg border p-4 ${
              isOverRoomLimit() 
                ? 'bg-red-50 border-red-200' 
                : getRemainingRooms() <= 2 && getRemainingRooms() >= 0
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${
                  isOverRoomLimit() 
                    ? 'text-red-600' 
                    : getRemainingRooms() <= 2 && getRemainingRooms() >= 0
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {isOverRoomLimit() ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : getRemainingRooms() <= 2 && getRemainingRooms() >= 0 ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h4 className={`text-sm font-medium ${
                    isOverRoomLimit() 
                      ? 'text-red-800' 
                      : getRemainingRooms() <= 2 && getRemainingRooms() >= 0
                      ? 'text-yellow-800'
                      : 'text-green-800'
                  }`} style={{ fontFamily: 'var(--font-archivo)' }}>
                    Estado de Habitaciones
                  </h4>
                  <div className={`mt-1 text-sm ${
                    isOverRoomLimit() 
                      ? 'text-red-700' 
                      : getRemainingRooms() <= 2 && getRemainingRooms() >= 0
                      ? 'text-yellow-700'
                      : 'text-green-700'
                  }`} style={{ fontFamily: 'var(--font-sansation)' }}>
                    <p>
                      Habitaciones configuradas: <span className="font-medium">{getTotalRooms()}</span> / {
                        getMaxRoomsAllowed() === -1 ? '∞' : getMaxRoomsAllowed()
                      }
                      {getRemainingRooms() > 0 && ` (${getRemainingRooms()} restantes)`}
                    </p>
                    {isOverRoomLimit() && (
                      <p className="mt-1" style={{ fontFamily: 'var(--font-sansation)' }}>
                        ⚠️ Has excedido el límite de tu plan. Actualiza tu plan para agregar más habitaciones.
                      </p>
                    )}
                    {!isOverRoomLimit() && getRemainingRooms() <= 2 && getRemainingRooms() >= 0 && (
                      <p className="mt-1" style={{ fontFamily: 'var(--font-sansation)' }}>
                        {getRemainingRooms() === 0 
                          ? '⚠️ Has alcanzado el límite de tu plan. Actualiza tu plan para agregar más habitaciones.'
                          : '⚠️ Te quedan pocas habitaciones disponibles. Considera actualizar tu plan para más capacidad.'
                        }
                      </p>
                    )}
                    {!isOverRoomLimit() && getRemainingRooms() > 2 && (
                      <p className="mt-1" style={{ fontFamily: 'var(--font-sansation)' }}>
                        ✅ Puedes agregar más habitaciones dentro de tu plan actual.
                      </p>
                    )}
                  </div>
                </div>
                {(isOverRoomLimit() || (getRemainingRooms() <= 2 && getRemainingRooms() >= 0)) && getNextPlan() && (
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={handleUpgradePlan}
                      disabled={loading}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                        isOverRoomLimit() 
                          ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                          : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      }`}
                      style={{ fontFamily: 'var(--font-archivo)' }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {loading ? 'Actualizando...' : `Actualizar a ${getNextPlan()?.name || 'Plan Superior'}`}
                    </button>
                    {getNextPlan() && (
                      <p className={`text-xs ${
                        isOverRoomLimit() ? 'text-red-600' : 'text-yellow-600'
                      }`} style={{ fontFamily: 'var(--font-sansation)' }}>
                        {getNextPlan()?.maxRooms === -1 
                          ? 'Habitaciones ilimitadas' 
                          : `Hasta ${getNextPlan()?.maxRooms} habitaciones`
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lista de Pisos */}
          <div className="space-y-4">
            {floors.map((floor, index) => (
              <div key={floor.id} className="border border-gray8 rounded-lg p-4 bg-gray10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-blue1 font-title">Piso {floor.floorNumber}</h4>
                  {floors.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeFloor(floor.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-body"
                    >
                      Eliminar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Número de Piso */}
                  <div>
                    <label className="block text-sm font-medium text-blue1 mb-2 font-title">Número de Piso</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                      value={floor.floorNumber}
                      onChange={e => updateFloor(floor.id, 'floorNumber', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Cantidad de Habitaciones */}
                  <div>
                    <label className="block text-sm font-medium text-blue1 mb-2 font-title">Habitaciones</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                      value={floor.roomsCount}
                      onChange={e => updateFloor(floor.id, 'roomsCount', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Número de Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-blue1 mb-2 font-title">Inicia en</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                      value={floor.startNumber}
                      onChange={e => updateFloor(floor.id, 'startNumber', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Sistema de Numeración */}
                  <div>
                    <label className="block text-sm font-medium text-blue1 mb-2 font-title">Numeración</label>
                    <select
                      value={floor.numberingSystem}
                      onChange={e => updateFloor(floor.id, 'numberingSystem', e.target.value as "with_prefix" | "simple")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue8 focus:border-transparent font-body"
                    >
                      <option value="with_prefix">Con prefijo (101, 102...)</option>
                      <option value="simple">Simple (1, 2, 3...)</option>
                    </select>
                  </div>
                </div>

                {/* Vista previa de numeración del piso */}
                <div className="mt-4 bg-blue15 p-3 rounded-lg">
                  <h5 className="font-medium text-blue1 mb-2 font-title text-sm">Vista Previa Piso {floor.floorNumber}:</h5>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1 sm:gap-2">
                    {getRoomNumbers(floor).map((roomNumber, i) => (
                      <div key={i} className="bg-white px-1 py-0.5 rounded text-center text-xs font-medium text-blue1 font-body">
                        {roomNumber}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón para Agregar Piso */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                type="button"
                onClick={addFloor}
                disabled={getMaxRoomsAllowed() !== -1 && getTotalRooms() >= getMaxRoomsAllowed()}
                className={`px-6 py-3 rounded-lg text-sm font-body ${
                  getMaxRoomsAllowed() !== -1 && getTotalRooms() >= getMaxRoomsAllowed()
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue8 hover:bg-blue6 text-white'
                }`}
              >
                + Adicionar Piso
              </Button>
              
              {/* Botón de Upgrade cuando está cerca del límite */}
              {(() => {
                const maxAllowed = getMaxRoomsAllowed();
                const remaining = getRemainingRooms();
                const nextPlan = getNextPlan();
                const currentPlanId = subscription?.plan_id || selectedPlan?.planId;
                
                console.log('Debug upgrade button:', {
                  maxAllowed,
                  remaining,
                  nextPlan: nextPlan?.name,
                  currentPlanId,
                  shouldShow: maxAllowed !== -1 && remaining <= 3 && remaining >= 0 && nextPlan
                });
                
                return maxAllowed !== -1 && remaining <= 3 && remaining >= 0 && nextPlan;
              })() && (
                <Button
                  type="button"
                  onClick={handleUpgradePlan}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg text-sm font-body bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
                >
                  <Star className="h-4 w-4 mr-2" />
                  {loading ? 'Actualizando...' : `Upgrade a ${getNextPlan()?.name || 'Plan Superior'}`}
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray4 mt-2 font-body">
              {getMaxRoomsAllowed() !== -1 && getTotalRooms() >= getMaxRoomsAllowed()
                ? `Has alcanzado el límite de ${getMaxRoomsAllowed()} habitaciones de tu plan`
                : getMaxRoomsAllowed() !== -1 && getRemainingRooms() <= 3 && getRemainingRooms() >= 0
                ? `Te quedan ${getRemainingRooms()} habitaciones. Considera actualizar tu plan.`
                : 'Agrega más pisos según la estructura de tu establecimiento'
              }
            </p>
          </div>

          {/* Resumen Total */}
          <div className={`p-4 rounded-lg ${
            isOverRoomLimit() 
              ? 'bg-red-600 text-white' 
              : getRemainingRooms() <= 2 && getRemainingRooms() >= 0
              ? 'bg-yellow-600 text-white'
              : 'bg-blue8 text-white'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h4 className="font-semibold font-title">Total de Habitaciones</h4>
                <p className="text-sm opacity-90 font-body">
                  {getTotalRooms()} habitaciones en {floors.length} piso{floors.length !== 1 ? 's' : ''}
                  {getMaxRoomsAllowed() !== -1 && (
                    <span className="ml-2">
                      ({getTotalRooms()}/{getMaxRoomsAllowed()} del plan {(subscription?.plan_name || selectedPlan?.planName || 'Plan')})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-sm opacity-90 font-body">Rango Total:</p>
                <p className="font-semibold text-sm lg:text-base font-body">
                  {floors.map(floor => {
                    const numbers = getRoomNumbers(floor);
                    return `${numbers[0]}-${numbers[numbers.length - 1]}`;
                  }).join(', ')}
                </p>
              </div>
            </div>
            {isOverRoomLimit() && (
              <div className="mt-3 pt-3 border-t border-red-400">
                <p className="text-sm font-medium">
                  ⚠️ Has excedido el límite de habitaciones de tu plan. Actualiza tu plan para continuar.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subidor de Icono */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue1 mb-2 font-title">Icono del Negocio (Opcional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue8 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                className="hidden"
                id="icon-upload"
              />
              <label htmlFor="icon-upload" className="cursor-pointer">
                {iconFile ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-blue15 rounded-lg flex items-center justify-center">
                      <img 
                        src={URL.createObjectURL(iconFile)} 
                        alt="Preview" 
                        className="w-12 h-12 object-contain rounded"
                      />
                    </div>
                                    <p className="text-sm font-medium text-blue1 font-body">{iconFile.name}</p>
                <p className="text-xs text-gray4 font-body">Click para cambiar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-blue15 rounded-lg flex items-center justify-center">
                      <Settings className="w-8 h-8 text-blue8" />
                    </div>
                                    <p className="text-sm font-medium text-blue1 font-body">Click para subir icono</p>
                <p className="text-xs text-gray4 font-body">PNG, JPG, SVG hasta 5MB</p>
                  </div>
                )}
              </label>
            </div>
            <p className="text-xs text-gray4 mt-1 font-body">Se subirá automáticamente al bucket del hotel</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => {
    console.log('📋 Renderizando paso 4 - Resumen');
    console.log('🏢 Estado actual de pisos en el resumen:', floors);
    console.log('📊 Total de habitaciones en el resumen:', getTotalRooms());
    
    return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-blue1 font-title">Resumen</h2>
        <p className="text-gray4 font-body">Revisa la información antes de continuar</p>
      </div>

              <div className="bg-gray10 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-blue1 mb-2 font-title">Información Básica</h4>
            <p className="text-sm text-gray4 font-body"><strong>Nombre:</strong> {businessName}</p>
            <p className="text-sm text-gray4 font-body"><strong>Tipo:</strong> {businessType}</p>
            <p className="text-sm text-gray4 font-body">
              <strong>{countryCode === 'CL' ? 'RUT' : 'Documento'}:</strong> {rut}
            </p>
            <p className="text-sm text-gray4 font-body"><strong>Teléfono:</strong> {`${phoneCountryCode}${phoneNumber}`}</p>
          </div>
          <div>
            <h4 className="font-semibold text-blue1 mb-2 font-title">Ubicación</h4>
            <p className="text-sm text-gray4 font-body"><strong>País:</strong> {getCountryName(countryCode)}</p>
            <p className="text-sm text-gray4 font-body"><strong>Región:</strong> {states.find(s => s.isoCode === stateCode)?.name || stateCode}</p>
            <p className="text-sm text-gray4 font-body"><strong>Ciudad:</strong> {cityName}</p>
            <p className="text-sm text-gray4 font-body">
              <strong>Habitaciones:</strong> {getTotalRooms()} en {floors.length} piso{floors.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray8">
          <p className="text-sm text-gray4 font-body mb-4">
            <strong>Dirección:</strong> {address}, {cityName}, {states.find(s => s.isoCode === stateCode)?.name || stateCode}, {getCountryName(countryCode)}
          </p>
          
          {/* Detalle de Pisos */}
          <div className="space-y-3">
            <h5 className="font-semibold text-blue1 font-title">Configuración de Pisos:</h5>
            {floors.map((floor, index) => (
              <div key={floor.id} className="bg-gray10 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue1 font-body">Piso {floor.floorNumber}</span>
                  <span className="text-sm text-gray4 font-body">{floor.roomsCount} habitaciones</span>
                </div>
                <div className="text-xs text-gray4 mt-1 font-body">
                  {floor.numberingSystem === "with_prefix" 
                    ? `Numeración: ${floor.floorNumber}${String(floor.startNumber).padStart(2, '0')}-${floor.floorNumber}${String(floor.startNumber + floor.roomsCount - 1).padStart(2, '0')}`
                    : `Numeración: ${floor.startNumber}-${floor.startNumber + floor.roomsCount - 1}`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return businessName.trim() && businessType && validateRut();
      case 2: return countryCode && cityName.trim() && address.trim();
      case 3: return floors.length > 0 && floors.every(f => f.roomsCount > 0);
      case 4: return true;
      default: return false;
    }
  };

  const validateRut = (): boolean => {
    if (countryCode !== 'CL' || !rut.trim()) return true; // Solo validar RUT chileno
    
    // Limpiar RUT
    const cleanRut = rut.replace(/[.-]/g, '');
    
    // Verificar longitud mínima
    if (cleanRut.length < 8) return false;
    
    // Verificar que solo contenga números y una letra al final
    if (!/^\d{7,8}[0-9K]$/.test(cleanRut)) return false;
    
    // Verificar dígito verificador
    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = number.length - 1; i >= 0; i--) {
      sum += parseInt(number[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDv = 11 - (sum % 11);
    let expectedDvStr = '';
    
    if (expectedDv === 11) expectedDvStr = '0';
    else if (expectedDv === 10) expectedDvStr = 'K';
    else expectedDvStr = expectedDv.toString();
    
    return dv === expectedDvStr;
  };

  return (
    <div className="w-[90%] max-w-6xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white rounded-2xl shadow-xl border border-gray8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue1 font-title">Paso {step} de 4</span>
          <span className="text-sm text-gray4 font-body">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-gray8 rounded-full h-2">
          <div 
            className="bg-blue8 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Editing Mode Info */}
      {isEditing && (
        <div className="mb-6 p-4 bg-blue15 border border-blue8 rounded-lg">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-blue8 mr-2" />
            <span className="text-sm font-medium text-blue1 font-title">
              Modo de edición: Completando datos faltantes del negocio
            </span>
          </div>
        </div>
      )}

      {/* Step Content */}
      {renderStepContent()}

      {/* Error Message */}
      {error && (
        <div className="text-red-600 font-body text-sm mt-4 text-center bg-red-100 border border-red-300 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={handleBack}
          disabled={step === 1}
          variant="outline"
          className="px-6 font-body"
        >
          Atrás
        </Button>

        {step < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-6 bg-blue8 hover:bg-blue6 font-body"
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className="px-6 bg-green-600 hover:bg-green-700 font-body"
          >
            {loading ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Actualizar Negocio" : "Crear Negocio")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <OnboardingContent />
      </Suspense>
    </BaseLayout>
  );
}