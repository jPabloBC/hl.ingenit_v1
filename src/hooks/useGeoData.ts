import { useState, useEffect, useCallback } from 'react';
import { Country, State, City } from 'country-state-city';

export interface GeoCountry {
  isoCode: string;
  name: string;
  phonecode: string;
  flag: string;
  currency: string;
  latitude: string;
  longitude: string;
}

export interface GeoState {
  isoCode: string;
  name: string;
  countryCode: string;
}

export interface GeoCity {
  name: string;
  countryCode: string;
  stateCode: string;
  latitude: string;
  longitude: string;
}

export function useGeoData() {
  const [countries, setCountries] = useState<GeoCountry[]>([]);
  const [states, setStates] = useState<GeoState[]>([]);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar países al inicializar
    const allCountries = Country.getAllCountries();
    const formattedCountries = allCountries.map(country => ({
      isoCode: country.isoCode,
      name: country.name,
      phonecode: country.phonecode,
      flag: country.flag,
      currency: country.currency,
      latitude: country.latitude,
      longitude: country.longitude
    }));
    
    setCountries(formattedCountries);
    setLoading(false);
  }, []);

  const getStatesByCountry = useCallback((countryCode: string) => {
    const countryStates = State.getStatesOfCountry(countryCode);
    const formattedStates = countryStates.map(state => ({
      isoCode: state.isoCode,
      name: state.name,
      countryCode: state.countryCode
    }));
    
    setStates(formattedStates);
    setCities([]); // Limpiar ciudades cuando cambia el país
    return formattedStates;
  }, []);

  const getCitiesByState = useCallback((countryCode: string, stateCode: string) => {
    const stateCities = City.getCitiesOfState(countryCode, stateCode);
    const formattedCities = stateCities.map(city => ({
      name: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode,
      latitude: city.latitude,
      longitude: city.longitude
    }));
    
    setCities(formattedCities);
    return formattedCities;
  }, []);

  const getCitiesByCountry = useCallback((countryCode: string) => {
    const countryCities = City.getCitiesOfCountry(countryCode);
    const formattedCities = countryCities.map(city => ({
      name: city.name,
      countryCode: city.countryCode,
      stateCode: city.stateCode || '',
      latitude: city.latitude,
      longitude: city.longitude
    }));
    
    setCities(formattedCities);
    return formattedCities;
  }, []);

  const findCountryByCode = (countryCode: string) => {
    return countries.find(country => country.isoCode === countryCode);
  };

  const findStateByCode = (stateCode: string) => {
    return states.find(state => state.isoCode === stateCode);
  };

  const findCityByName = (cityName: string) => {
    return cities.find(city => city.name === cityName);
  };

  // Función para obtener países con nombres en español (mapeo personalizado)
  const getCountriesInSpanish = () => {
    const spanishNames: { [key: string]: string } = {
      'CL': 'Chile',
      'AR': 'Argentina', 
      'CO': 'Colombia',
      'PE': 'Perú',
      'MX': 'México',
      'ES': 'España',
      'US': 'Estados Unidos',
      'GB': 'Reino Unido',
      'BR': 'Brasil',
      'UY': 'Uruguay',
      'PY': 'Paraguay',
      'BO': 'Bolivia',
      'EC': 'Ecuador',
      'VE': 'Venezuela',
      'PA': 'Panamá',
      'CR': 'Costa Rica',
      'GT': 'Guatemala',
      'HN': 'Honduras',
      'SV': 'El Salvador',
      'NI': 'Nicaragua',
      'CU': 'Cuba',
      'DO': 'República Dominicana',
      'PR': 'Puerto Rico',
      'JM': 'Jamaica',
      'TT': 'Trinidad y Tobago',
      'BZ': 'Belice',
      'GY': 'Guyana',
      'SR': 'Surinam',
      'GF': 'Guayana Francesa'
    };

    // Países de Sudamérica en orden prioritario
    const southAmericaOrder = ['CL', 'AR', 'BR', 'CO', 'PE', 'UY', 'PY', 'BO', 'EC', 'VE', 'GY', 'SR', 'GF'];
    
    const formattedCountries = countries.map(country => ({
      ...country,
      name: spanishNames[country.isoCode] || country.name
    }));

    // Ordenar: Sudamérica primero, luego el resto
    return formattedCountries.sort((a, b) => {
      const aIndex = southAmericaOrder.indexOf(a.isoCode);
      const bIndex = southAmericaOrder.indexOf(b.isoCode);
      
      // Si ambos están en Sudamérica, usar el orden definido
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // Si solo uno está en Sudamérica, va primero
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Si ninguno está en Sudamérica, ordenar alfabéticamente
      return a.name.localeCompare(b.name);
    });
  };

  return {
    countries: getCountriesInSpanish(),
    states,
    cities,
    loading,
    getStatesByCountry,
    getCitiesByState,
    getCitiesByCountry,
    findCountryByCode,
    findStateByCode,
    findCityByName
  };
}