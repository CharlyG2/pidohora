import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { BusinessDetailScreen } from './src/screens/booking/BusinessDetailScreen';
import { ConfirmedScreen } from './src/screens/booking/ConfirmedScreen';
import { DateTimeScreen } from './src/screens/booking/DateTimeScreen';
import { DetailsScreen } from './src/screens/booking/DetailsScreen';
import { ProfessionalScreen } from './src/screens/booking/ProfessionalScreen';
import { BookingDetailScreen } from './src/screens/business/BookingDetailScreen';
import { BusinessMain } from './src/screens/business/BusinessMain';
import { NewBookingScreen } from './src/screens/business/NewBookingScreen';
import { ServiceEditScreen } from './src/screens/business/ServiceEditScreen';
import { ClientMain } from './src/screens/client/ClientMain';
import { StoreProvider, useStore } from './src/store';

function Router() {
  const { route, session } = useStore();
  switch (route.name) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'login':
      return <LoginScreen />;
    case 'register':
      return <RegisterScreen key={route.role} role={route.role} />;
    case 'main':
      return session?.role === 'business' ? <BusinessMain /> : <ClientMain />;
    case 'business':
      return <BusinessDetailScreen businessId={route.businessId} />;
    case 'professional':
      return <ProfessionalScreen />;
    case 'datetime':
      return <DateTimeScreen />;
    case 'details':
      return <DetailsScreen />;
    case 'confirmed':
      return <ConfirmedScreen bookingId={route.bookingId} />;
    case 'bookingDetail':
      return <BookingDetailScreen bookingId={route.bookingId} />;
    case 'newBooking':
      return <NewBookingScreen start={route.start} professionalId={route.professionalId} />;
    case 'serviceEdit':
      return <ServiceEditScreen serviceId={route.serviceId} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Router />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
