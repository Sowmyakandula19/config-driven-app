'use client';

import { SessionProvider } from 'next-auth/react';
import { useState, createContext, useContext } from 'react';

// Simple i18n context
const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.signout': 'Sign Out',
    'nav.export': 'Export ZIP',
    'table.empty': 'No records yet',
    'table.add': 'Add Record',
    'table.import': 'Import CSV',
    'table.edit': 'Edit',
    'table.delete': 'Delete',
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.required': 'Required',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.google': 'Continue with Google',
    'auth.or': 'or',
    'auth.switch.signup': "Don't have an account? Sign up",
    'auth.switch.signin': 'Already have an account? Sign in',
    'dashboard.total': 'Total',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'csv.upload': 'Upload CSV',
    'csv.map': 'Map Columns',
    'csv.import': 'Import Rows',
    'csv.preview': 'Preview',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.signout': 'Cerrar Sesión',
    'nav.export': 'Exportar ZIP',
    'table.empty': 'Sin registros aún',
    'table.add': 'Agregar',
    'table.import': 'Importar CSV',
    'table.edit': 'Editar',
    'table.delete': 'Eliminar',
    'form.save': 'Guardar',
    'form.cancel': 'Cancelar',
    'form.required': 'Requerido',
    'auth.signin': 'Iniciar Sesión',
    'auth.signup': 'Registrarse',
    'auth.email': 'Correo',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre Completo',
    'auth.google': 'Continuar con Google',
    'auth.or': 'o',
    'auth.switch.signup': '¿No tienes cuenta? Regístrate',
    'auth.switch.signin': '¿Ya tienes cuenta? Inicia sesión',
    'dashboard.total': 'Total',
    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'csv.upload': 'Subir CSV',
    'csv.map': 'Mapear Columnas',
    'csv.import': 'Importar Filas',
    'csv.preview': 'Vista Previa',
  },
};

const LocaleContext = createContext<{
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string) => string;
}>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function useLocale() { return useContext(LocaleContext); }

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('en');
  const t = (key: string) =>
    translations[locale]?.[key] ?? translations['en']?.[key] ?? key;

  return (
    <SessionProvider>
      <LocaleContext.Provider value={{ locale, setLocale, t }}>
        {children}
      </LocaleContext.Provider>
    </SessionProvider>
  );
}
