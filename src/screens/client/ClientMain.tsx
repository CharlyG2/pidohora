import { Text, View } from 'react-native';

import { Screen, TabBar } from '../../components';
import { useStore, type ClientTab } from '../../store';
import { colors } from '../../theme';
import { HomeTab } from './HomeTab';
import { MyBookingsTab } from './MyBookingsTab';
import { ProfileTab } from './ProfileTab';
import { SearchTab } from './SearchTab';

const TABS: { id: ClientTab; label: string; icon: string }[] = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'search', label: 'Buscar', icon: '🔍' },
  { id: 'bookings', label: 'Mis horas', icon: '🗓️' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

export function ClientMain() {
  const { clientTab, setClientTab, session, go } = useStore();
  const guest = session?.role === 'guest';
  return (
    <Screen
      canGoBack={false}
      headerRight={
        guest ? (
          <Text
            onPress={() => go({ name: 'login' })}
            style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}
            accessibilityRole="link"
          >
            Iniciar sesión
          </Text>
        ) : (
          <View />
        )
      }
      bottomBar={<TabBar tabs={TABS} active={clientTab} onChange={setClientTab} />}
    >
      {clientTab === 'home' && <HomeTab />}
      {clientTab === 'search' && <SearchTab />}
      {clientTab === 'bookings' && <MyBookingsTab />}
      {clientTab === 'profile' && <ProfileTab />}
    </Screen>
  );
}
