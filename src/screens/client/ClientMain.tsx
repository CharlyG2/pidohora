import { Text, View } from 'react-native';

import { Screen, TabBar } from '../../components';
import type { IconName } from '../../icons';
import { useStore, type ClientTab } from '../../store';
import { colors } from '../../theme';
import { HomeTab } from './HomeTab';
import { MyBookingsTab } from './MyBookingsTab';
import { ProfileTab } from './ProfileTab';
import { SearchTab } from './SearchTab';

const TABS: { id: ClientTab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'search', label: 'Buscar', icon: 'search' },
  { id: 'bookings', label: 'Mis horas', icon: 'calendar' },
  { id: 'profile', label: 'Perfil', icon: 'user' },
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
