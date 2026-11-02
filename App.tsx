import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AgendaScreen } from './src/screens/AgendaScreen';
import { ConfirmedScreen } from './src/screens/ConfirmedScreen';
import { DateTimeScreen } from './src/screens/DateTimeScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfessionalScreen } from './src/screens/ProfessionalScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { StoreProvider, useStore } from './src/store';

function Router() {
  const { route } = useStore();
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'services':
      return <ServicesScreen businessId={route.businessId} />;
    case 'professional':
      return <ProfessionalScreen />;
    case 'datetime':
      return <DateTimeScreen />;
    case 'details':
      return <DetailsScreen />;
    case 'confirmed':
      return <ConfirmedScreen bookingId={route.bookingId} />;
    case 'agenda':
      return <AgendaScreen businessId={route.businessId} />;
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
