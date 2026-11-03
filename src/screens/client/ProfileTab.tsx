import { Text, View } from 'react-native';

import { Avatar, Button, Card, EmptyState, styles } from '../../components';
import { useStore } from '../../store';

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
      <Card>
        <Text style={styles.cardTitle}>{myBookings.length} reservas hechas con PidoHora</Text>
        <Text style={styles.cardText}>Recibes confirmaciones y recordatorios por WhatsApp.</Text>
      </Card>
      <Button label="Cerrar sesión" variant="danger" onPress={logout} />
    </>
  );
}
