// INGENIT Company Information
export const COMPANY_INFO = {
  name: "INGENIT SpA",
  rut: "78.000.171-2",
  email: "gerencia@ingenit.cl",
  webhook: "https://ingenit.cl/api/webhook",
} as const;

// Bank Accounts
export const BANK_ACCOUNTS = {
  scotiabank: {
    bank: "Scotiabank",
    type: "Cuenta Corriente",
    number: "991937153",
  },
  bancoEstado: {
    bank: "BancoEstado",
    type: "Chequera Electrónica",
    number: "2573422701",
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  name: "ShIngenit",
  description: "Plataforma líder en alojamientos y servicios turísticos",
  version: "1.0.0",
} as const;

// Color Palette (for reference)
export const COLORS = {
  // Primary Blues
  blue1: "#001a33", // Dark blue
  blue8: "#0078ff", // Primary blue
  blue10: "#3393ff", // Light blue
  blue15: "#cce4ff", // Very light blue
  
  // Grays
  gray1: "#1a1a1a", // Very dark gray
  gray4: "#666666", // Medium gray
  gray8: "#cccccc", // Light gray
  gray10: "#f2f2f2", // Very light gray
  
  // Golds
  gold3: "#daa520", // Primary gold
  gold7: "#f8edd2", // Light gold
} as const;
