import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Avatar, Card, EmptyState, styles } from '../../components';
import { useStore } from '../../store';
import { colors } from '../../theme';
import { formatCLP, formatDateShort, norm } from '../../utils';

export function ClientsTab() {
  const { myBusiness, bookings } = useStore();
  const [q, setQ] = useState('');
  if (!myBusiness) return null;

  const now = Date.now();
  const byPhone = new Map<string, { name: string; phone: string; visits: number; spent: number; last?: Date; next?: Date }>();
  for (const b of bookings.filter((x) => x.businessId === myBusiness.id)) {
    const key = b.clientPhone.replace(/\D/g, '');
    const c = byPhone.get(key) ?? { name: b.clientName, phone: b.clientPhone, visits: 0, spent: 0 };
    const t = new Date(b.start);
    if (t.getTime() < now) {
      c.visits += 1;
      c.spent += b.total;
      if (!c.last || t > c.last) c.last = t;
    } else if (!c.next || t < c.next) {
      c.next = t;
    }
    byPhone.set(key, c);
  }
  const clients = [...byPhone.values()]
    .filter((c) => !q || norm(c.name).includes(norm(q)) || c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§'))
    .sort((a, b) => b.visits - a.visits);

  return (
    <>
      <Text style={styles.title}>Clientes</Text>
      <Text style={styles.subtitle}>{byPhone.size} clientes han reservado contigo</Text>
      <TextInput
        style={styles.input}
        value={q}
        onChangeText={setQ}
        placeholder="Buscar por nombre o teléfono"
        placeholderTextColor={colors.muted}
        nativeID="clients-search"
      />
      {clients.length === 0 ? (
        <EmptyState icon="users" tone="mint" title="Sin clientes todavía" text="Cuando te reserven, aquí verás a cada cliente con sus visitas y lo que ha gastado." />
      ) : (
        clients.map((c) => (
          <Card key={c.phone}>
            <View style={styles.row}>
              <Avatar label={c.name} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardText}>💬 {c.phone}</Text>
                <Text style={[styles.cardText, { fontSize: 12 }]}>
                  {c.visits} {c.visits === 1 ? 'visita' : 'visitas'}
                  {c.last ? ` · última ${formatDateShort(c.last)}` : ''}
                  {c.next ? ` · próxima ${formatDateShort(c.next)}` : ''}
                </Text>
              </View>
              <Text style={styles.price}>{formatCLP(c.spent)}</Text>
            </View>
          </Card>
        ))
      )}
    </>
  );
}
