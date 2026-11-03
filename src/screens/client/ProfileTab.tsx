import { Text, View } from 'react-native';

import { Avatar, Button, Card, EmptyState, styles } from '../../components';
import { Icon } from '../../icons';
import { useStore } from '../../store';
import { colors } from '../../theme';

export function ProfileTab() {
  const { account, session, logout, go, myBookings } = useStore();

  if (session?.role === 'guest' || !account) {
    return (
      <>
        <Text style={styles.title}>Perfil</Text>
        <EmptyState
          icon="user"
          title="Estás como invitado"
          text="Crea una cuenta para guardar tus horas, tus lugares favoritos y reservar con un toque."
          action={
            <View style={{ gap: 8 }}>
              <Button label="Crear cuenta" onPress={() => go({ name: 'register', role: 'client' })} />
              <Button label="Iniciar sesión" variant="secondary" onPress={() => go({ name: 'login' })} />
              <Button label="Salir" variant="ghost" onPress={logout} />
            </View>
          }
        />
      </>
    );
  }

  return (
    <>
      <Text style={styles.title}>Perfil</Text>
      <Card>
        <View style={styles.row}>
          <Avatar label={account.name} size={56} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitle}>{account.name}</Text>
            <Text style={styles.cardText}>{account.email}</Text>
            <Text style={styles.cardText}>💬 {account.phone}</Text>
          </View>
        </View>
      </Card>
      <Card onPress={() => go({ name: 'location' })}>
        <View style={styles.row}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="homeHeart" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Comuna donde vives</Text>
            <Text style={styles.cardText}>{account.homeComuna ?? 'Sin definir: agrégala para ver lugares cerca'}</Text>
          </View>
          <Icon name="chevron" size={20} color={colors.muted} />
        </View>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>{myBookings.length} reservas hechas con PidoHora</Text>
        <Text style={styles.cardText}>Recibes confirmaciones y recordatorios por WhatsApp.</Text>
      </Card>
      <Button label="Cerrar sesión" variant="danger" onPress={logout} />
    </>
  );
}
