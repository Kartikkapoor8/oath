import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { AlarmClock, MoonStar } from 'lucide-react-native';
import { Button, Card, Text } from '@/components/primitives';
import { colors, fonts, fontSize, radius, spacing } from '@/lib/design-system';
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
} from '@/lib/storage/preferences';
import {
  firstName,
  formatAlarmTime12h,
  formatDateCaption,
  modeLabel,
  timeOfDayGreeting,
  voiceLabel,
} from '@/lib/helpers/onboarding-defaults';

export default function Home() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [commitmentDraft, setCommitmentDraft] = useState('');

  const load = useCallback(async () => {
    const p = await getPreferences();
    setPrefs(p);
    setCommitmentDraft(p.tomorrowFirstAction ?? '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!prefs) {
    return <View style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }} />;
  }

  const greeting = `${timeOfDayGreeting()}${
    prefs.hero ? `, ${firstName(prefs.hero).toLowerCase()}` : ''
  }`;

  const saveCommitment = async () => {
    await setPreferences({
      tomorrowFirstAction: commitmentDraft.trim() || null,
    });
    setShowCommitmentModal(false);
    load();
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingTop: spacing[4],
          paddingBottom: spacing[10],
          gap: spacing[4],
        }}
      >
        <View style={{ gap: spacing[2] }}>
          <Text variant="caption" color={colors.fg.muted}>
            {formatDateCaption()}
          </Text>
          <Text variant="display" color={colors.fg.DEFAULT}>
            {greeting}
          </Text>
        </View>

        <Card
          padding={6}
          style={{
            borderLeftWidth: 4,
            borderLeftColor: colors.amber.DEFAULT,
            borderColor: colors.border.subtle,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
            }}
          >
            <AlarmClock color={colors.amber.DEFAULT} size={24} strokeWidth={2} />
            <Text variant="h3" color={colors.fg.DEFAULT}>
              tomorrow’s alarm
            </Text>
          </View>

          <Text
            color={colors.fg.DEFAULT}
            style={{
              fontFamily: fonts.display,
              fontSize: 44,
              lineHeight: 48,
              letterSpacing: -1.2,
              marginTop: spacing[4],
            }}
          >
            {formatAlarmTime12h(prefs.alarmTime)}
          </Text>

          <View style={{ marginTop: spacing[4], gap: spacing[2] }}>
            <Text variant="body" color={colors.fg.muted}>
              {`ritual: ${modeLabel(prefs.defaultMode)}`}
            </Text>
            <Text variant="body" color={colors.fg.muted}>
              {`voice: ${voiceLabel(prefs.voicePreset)}`}
            </Text>
          </View>

          <View style={{ marginTop: spacing[5] }}>
            <Button
              label="edit ritual settings"
              variant="secondary"
              onPress={() => router.push('/(tabs)/settings')}
            />
          </View>
        </Card>

        <Pressable
          onPress={() => setShowCommitmentModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Edit tomorrow's commitment"
        >
          <Card padding={5}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[3],
              }}
            >
              <MoonStar color={colors.amber.DEFAULT} size={20} strokeWidth={2} />
              <Text variant="h3" color={colors.fg.DEFAULT}>
                tonight’s commitment
              </Text>
            </View>
            {prefs.tomorrowFirstAction ? (
              <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
                <Text variant="body" color={colors.fg.DEFAULT}>
                  {prefs.tomorrowFirstAction}
                </Text>
                <Text variant="caption" color={colors.fg.subtle}>
                  tap to edit
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: spacing[3], gap: spacing[1] }}>
                <Text
                  variant="body"
                  color={colors.fg.muted}
                  style={{ fontStyle: 'italic' }}
                >
                  what’s tomorrow’s first action?
                </Text>
                <Text variant="caption" color={colors.fg.subtle}>
                  tap to add
                </Text>
              </View>
            )}
          </Card>
        </Pressable>

        <View style={{ gap: spacing[3], marginTop: spacing[2] }}>
          <Text variant="caption" color={colors.fg.muted}>
            RECENT RITUALS
          </Text>
          <Card padding={5}>
            <Text variant="body" color={colors.fg.muted}>
              your first ritual was just generated. you’ll see your history
              here after tomorrow morning.
            </Text>
          </Card>
        </View>

        <View style={{ marginTop: spacing[4] }}>
          <Button
            label="play a ritual now"
            variant="ghost"
            onPress={() => router.push('/onboarding/generating')}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showCommitmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommitmentModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderTopLeftRadius: radius['3xl'],
              borderTopRightRadius: radius['3xl'],
              padding: spacing[6],
              gap: spacing[4],
            }}
          >
            <View style={{ gap: spacing[2] }}>
              <Text variant="caption" color={colors.fg.muted}>
                TOMORROW
              </Text>
              <Text variant="h2" color={colors.fg.DEFAULT}>
                what’s the first action?
              </Text>
              <Text variant="body" color={colors.fg.muted}>
                one specific thing future you will do after the ritual plays.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.bg.raised,
                borderRadius: radius.xl,
                paddingHorizontal: spacing[4],
                paddingVertical: spacing[3],
                borderColor: colors.border.subtle,
                borderWidth: 1,
              }}
            >
              <TextInput
                value={commitmentDraft}
                onChangeText={setCommitmentDraft}
                placeholder="open the doc and write the intro"
                placeholderTextColor={colors.fg.dim}
                multiline
                maxLength={140}
                selectionColor={colors.amber.DEFAULT}
                keyboardAppearance="dark"
                style={{
                  color: colors.fg.DEFAULT,
                  fontFamily: fonts.body,
                  fontSize: fontSize.body,
                  minHeight: 80,
                }}
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <Button label="save" onPress={saveCommitment} />
              <Button
                label="cancel"
                variant="ghost"
                onPress={() => setShowCommitmentModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
