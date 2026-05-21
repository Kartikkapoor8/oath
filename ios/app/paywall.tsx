import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Button, Card, Text } from '@/components/primitives';
import { colors, radius, spacing } from '@/lib/design-system';
import { setPreferences } from '@/lib/storage/preferences';

type Plan = 'annual' | 'monthly';

export default function Paywall() {
  const [plan, setPlan] = useState<Plan>('annual');
  const [closedOnce, setClosedOnce] = useState(false);

  const handlePurchase = async () => {
    await setPreferences({ hasPaid: true });
    router.replace('/(tabs)/home');
  };

  const handleClose = async () => {
    if (!closedOnce) {
      setClosedOnce(true);
      return;
    }
    await setPreferences({ hasPaid: false });
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing[5],
          paddingTop: spacing[2],
          height: 44,
        }}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X color={colors.fg.muted} size={24} />
        </Pressable>
      </View>

      <View
        style={{
          paddingHorizontal: spacing[6],
          gap: spacing[3],
          marginTop: spacing[4],
        }}
      >
        <Text variant="caption" color={colors.fg.muted}>
          UNLOCK OATH
        </Text>
        <Text variant="display" color={colors.fg.DEFAULT}>
          make tomorrow different.
        </Text>
        <Text variant="body" color={colors.fg.muted}>
          every morning, a ritual built around you. before tiktok gets the
          chance. cancel anytime.
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing[6],
          paddingTop: spacing[8],
          gap: spacing[3],
          justifyContent: 'center',
        }}
      >
        <PlanCard
          tag="ANNUAL"
          price="$59 / year"
          subtitle="about $4.92/month — billed once a year"
          highlight="SAVE 51%"
          selected={plan === 'annual'}
          onPress={() => setPlan('annual')}
        />
        <PlanCard
          tag="MONTHLY"
          price="$9.99 / month"
          subtitle="billed monthly · cancel anytime"
          selected={plan === 'monthly'}
          onPress={() => setPlan('monthly')}
        />
      </View>

      <View
        style={{
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[8],
          gap: spacing[3],
        }}
      >
        <Button label="start 3-day free trial" onPress={handlePurchase} />
        <Text
          variant="bodySm"
          color={colors.fg.subtle}
          style={{ textAlign: 'center' }}
        >
          no charge for 3 days · cancel anytime
        </Text>
        <Pressable
          onPress={() => {
            // restore purchases — mocked until RevenueCat lands in a later prompt.
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text
            variant="bodySm"
            color={colors.fg.muted}
            style={{ textAlign: 'center' }}
          >
            restore purchases
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface PlanCardProps {
  tag: string;
  price: string;
  subtitle: string;
  highlight?: string;
  selected: boolean;
  onPress: () => void;
}

function PlanCard({
  tag,
  price,
  subtitle,
  highlight,
  selected,
  onPress,
}: PlanCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Card
        padding={5}
        style={{
          borderColor: selected ? colors.amber.DEFAULT : colors.border.subtle,
          borderWidth: selected ? 1.5 : 1,
          shadowColor: colors.amber.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: selected ? 16 : 0,
          shadowOpacity: selected ? 0.3 : 0,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text variant="caption" color={colors.fg.muted}>
            {tag}
          </Text>
          {highlight ? (
            <View
              style={{
                backgroundColor: colors.amber.bright,
                paddingHorizontal: spacing[2],
                paddingVertical: 4,
                borderRadius: radius.sm,
              }}
            >
              <Text
                variant="caption"
                color={colors.bg.DEFAULT}
                style={{ letterSpacing: 0.6 }}
              >
                {highlight}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          variant="h1"
          color={selected ? colors.amber.DEFAULT : colors.fg.DEFAULT}
          style={{ marginTop: spacing[2] }}
        >
          {price}
        </Text>
        <Text
          variant="caption"
          color={colors.fg.muted}
          style={{ marginTop: spacing[1], letterSpacing: 0 }}
        >
          {subtitle}
        </Text>
      </Card>
    </Pressable>
  );
}
