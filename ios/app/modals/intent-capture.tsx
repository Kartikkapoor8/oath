import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Button, Text } from '@/components/primitives';
import { colors, fonts, fontSize, radius, spacing } from '@/lib/design-system';
import { getPreferences, setPreferences } from '@/lib/storage/preferences';
import { preGenerateNextRitual } from '@/lib/rituals/pre-generation';

const MAX_LEN = 100;

export default function IntentCapture() {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPreferences().then((p) => {
      if (p.tomorrowFirstAction) setValue(p.tomorrowFirstAction);
    });
  }, []);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && !busy;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const handleSwear = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await setPreferences({ tomorrowFirstAction: trimmed });
      close();
      // Fire-and-forget the pre-generation; the home tab subscribes to the
      // pre-gen status emitter and shows "generating..." → "ritual ready".
      preGenerateNextRitual().catch((err) =>
        console.warn('pre-gen kicked off but failed', err),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveWithoutGen = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await setPreferences({ tomorrowFirstAction: trimmed });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.bg.DEFAULT }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
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
            flex: 1,
            paddingHorizontal: spacing[6],
            paddingTop: spacing[4],
            gap: spacing[3],
          }}
        >
          <Text variant="caption" color={colors.fg.muted}>
            TONIGHT&apos;S OATH
          </Text>
          <Text variant="display" color={colors.fg.DEFAULT}>
            what will you tackle tomorrow?
          </Text>
          <Text variant="body" color={colors.fg.muted}>
            one specific action. the kind you keep avoiding. when the alarm
            fires, the ritual will be built around this.
          </Text>

          <View
            style={{
              backgroundColor: colors.bg.raised,
              borderRadius: radius.xl,
              borderColor: colors.border.subtle,
              borderWidth: 1,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              marginTop: spacing[5],
            }}
          >
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="open the spec doc and write the wedge section"
              placeholderTextColor={colors.fg.dim}
              autoFocus
              multiline
              maxLength={MAX_LEN}
              selectionColor={colors.amber.DEFAULT}
              keyboardAppearance="dark"
              autoCapitalize="sentences"
              style={{
                color: colors.fg.DEFAULT,
                fontFamily: fonts.body,
                fontSize: fontSize.body,
                minHeight: 88,
                textAlignVertical: 'top',
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: spacing[2],
            }}
          >
            <Text variant="caption" color={colors.fg.subtle}>
              {`${value.length} / ${MAX_LEN}`}
            </Text>
            <Text variant="caption" color={colors.fg.subtle}>
              be specific — &quot;open project X&quot; beats &quot;work on stuff&quot;
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: spacing[5],
            paddingBottom: spacing[8],
            gap: spacing[3],
          }}
        >
          <Button
            label={busy ? 'saving...' : 'swear it'}
            disabled={!canSave}
            onPress={handleSwear}
          />
          <Button
            label="save without generating yet"
            variant="ghost"
            disabled={!canSave}
            onPress={handleSaveWithoutGen}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
