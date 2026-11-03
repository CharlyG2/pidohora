import { Text, View } from 'react-native';

import { EmptyState, Screen, TabBar } from '../../components';
import { useStore, type BusinessTab } from '../../store';
import { colors } from '../../theme';
import { AgendaTab } from './AgendaTab';
import { ClientsTab } from './ClientsTab';
import { ServicesTab } from './ServicesTab';
import { SettingsTab } from './SettingsTab';

const TABS: { id: BusinessTab; label: string; icon: string }[] = [
  { id: 'agenda', label: 'Agenda', icon: '🗓️' },
  { id: 'clients', label: 'Clientes', icon: '👥' },
  { id: 'services', label: 'Servicios', icon: '✂️' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
];

export function BusinessMain() {
  const { businessTab, setBusinessTab, myBusiness, logout } = useStore();
  if (!myBusiness) {
    return (
      <Screen canGoBack={false}>
        <EmptyState icon="⚠️" title="No encontramos tu negocio" text="Vuelve a iniciar sesión." />
        <Text onPress={logout} style={{ color: colors.primary, textAlign: 'center' }}>
          Cerrar sesión
        </Text>
      </Screen>
    );
  }
  const isAgenda = businessTab === 'agenda';
  return (
    <Screen
      canGoBack={false}
      wide={isAgenda}
      scroll={!isAgenda}
      headerRight={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18 }}>{myBusiness.emoji}</Text>
          <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
            {myBusiness.name}
          </Text>
        </View>
      }
      bottomBar={<TabBar tabs={TABS} active={businessTab} onChange={setBusinessTab} />}
    >
      {businessTab === 'agenda' && <AgendaTab />}
      {businessTab === 'clients' && <ClientsTab />}
      {businessTab === 'services' && <ServicesTab />}
      {businessTab === 'settings' && <SettingsTab />}
    </Screen>
  );
}
