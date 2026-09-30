import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ActivityListModal } from '@/components/ui/ActivityListModal';
import { Button } from '@/components/ui/Button';
import { CollapsibleSection } from '@/components/ui/CollapsibleFilterPanel';
import { FilterTogglePair } from '@/components/ui/FilterTogglePair';
import { OverflowMenu, OverflowMenuButton } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsSection } from '@/components/ui/SettingsSection';
import { TextField } from '@/components/ui/TextField';
import { listHomeActivity } from '@/features/home/api/activity-api';
import {
  deleteOwnAccount,
  kickHomeMember,
  leaveHome,
  listHomeMembers,
  setHomeMemberRole,
  type HomeMemberWithProfile,
} from '@/features/home/api/homes-api';
import { getProfileById, updateDisplayName } from '@/features/settings/api/profiles-api';
import { copyToClipboard } from '@/lib/clipboard';
import { homeInviteQrImageUrl, homeInviteUrl } from '@/lib/home-invite';
import { isBuiltinIconPackId } from '@/lib/icons/packs';
import { isHomeAdminRole, homeRoleLabel } from '@/lib/roles';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';
import { useLocale } from '@/providers/LocaleProvider';
import { usePurchases } from '@/providers/PurchasesProvider';
import { useToast } from '@/providers/ToastProvider';
import { useTutorial } from '@/providers/TutorialProvider';
import { registerSchema } from '@/schemas/auth.schema';
import {
  createHomeInputSchema,
  joinHomeInputSchema,
} from '@/schemas/onboarding.schema';
import type { HomeActivityEventWithActor } from '@/types/database.types';

/**
 * Account, home, members, icons and session settings.
 */
export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { openTutorial } = useTutorial();
  const showToast = useToast();
  const {
    activeHome,
    homes,
    setActiveHomeId,
    createHome,
    joinHome,
    clearActiveHome,
    refreshHomes,
    updateHomeProofSettings,
  } = useHome();
  const confirm = useConfirmDialog();
  const { packId, setPackId, packs, importPackFromJson, removeCustomPack, isPackLocked } =
    useIconPack();
  const { isPlus, isConfigured, presentPaywall, presentCustomerCenter, restorePurchases } =
    usePurchases();
  const { locale, setLocale, t } = useLocale();

  const [displayName, setDisplayName] = useState('');
  const [members, setMembers] = useState<HomeMemberWithProfile[]>([]);
  const [newHomeName, setNewHomeName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [iconPackJson, setIconPackJson] = useState('');
  const [importingPack, setImportingPack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [homeBusy, setHomeBusy] = useState(false);
  const [proofBusy, setProofBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [menuMember, setMenuMember] = useState<HomeMemberWithProfile | null>(null);
  const [activityFor, setActivityFor] = useState<HomeMemberWithProfile | null>(null);
  const [memberActivity, setMemberActivity] = useState<HomeActivityEventWithActor[]>([]);

  const viewer = members.find((item) => item.user_id === user?.id);
  const canManage = Boolean(viewer && isHomeAdminRole(viewer.role));

  useEffect(() => {
    if (!user) {
      return;
    }
    void getProfileById(user.id)
      .then((profile) => {
        setDisplayName(profile?.display_name ?? '');
      })
      .catch(() => {
        setDisplayName('');
      });
  }, [user]);

  useEffect(() => {
    if (!activeHome) {
      setMembers([]);
      return;
    }
    void listHomeMembers(activeHome.id)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [activeHome]);

  async function reloadMembers() {
    if (!activeHome) {
      return;
    }
    setMembers(await listHomeMembers(activeHome.id));
  }

  async function handleSaveName() {
    if (!user) {
      return;
    }
    setError(null);
    const parsed = registerSchema.shape.displayName.safeParse(displayName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('toast.invalidName'));
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateDisplayName(user.id, parsed.data);
      setDisplayName(updated.display_name);
      showToast({ message: t('toast.nameUpdated'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.nameSaveFail'), tone: 'error' });
    } finally {
      setSavingName(false);
    }
  }

  async function handleCreateHome() {
    setError(null);
    const parsed = createHomeInputSchema.safeParse({ name: newHomeName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('toast.invalidName'));
      return;
    }
    setHomeBusy(true);
    try {
      await createHome(parsed.data);
      setNewHomeName('');
      showToast({ message: t('toast.homeCreated'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.homeCreateFail'), tone: 'error' });
    } finally {
      setHomeBusy(false);
    }
  }

  async function handleJoinHome() {
    setError(null);
    const parsed = joinHomeInputSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('toast.invalidCode'));
      return;
    }
    setHomeBusy(true);
    try {
      await joinHome(parsed.data);
      setInviteCode('');
      showToast({ message: t('toast.joined'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.joinFail'), tone: 'error' });
    } finally {
      setHomeBusy(false);
    }
  }

  async function handleCopyCode() {
    if (!activeHome) {
      return;
    }
    const ok = await copyToClipboard(activeHome.invite_code);
    setCopied(ok);
    showToast({
      message: ok ? t('toast.codeCopied') : t('toast.copyFail'),
      tone: ok ? 'success' : 'error',
    });
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyInviteLink() {
    if (!activeHome) {
      return;
    }
    const ok = await copyToClipboard(homeInviteUrl(activeHome.invite_code));
    showToast({
      message: ok ? t('toast.linkCopied') : t('toast.linkCopyFail'),
      tone: ok ? 'success' : 'error',
    });
  }

  async function handleImportIconPack() {
    setError(null);
    setImportingPack(true);
    try {
      const pack = await importPackFromJson(iconPackJson);
      if (!pack) {
        showToast({ message: t('toast.packImportFail'), tone: 'error' });
        return;
      }
      setIconPackJson('');
      showToast({ message: t('toast.packImported', { name: pack.name }), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.packImportFail'), tone: 'error' });
    } finally {
      setImportingPack(false);
    }
  }

  async function handleLeaveHome() {
    if (!activeHome) {
      return;
    }
    const ok = await confirm({
      title: t('confirm.leaveHome'),
      message: t('confirm.leaveHomeBody'),
      confirmLabel: t('confirm.leaveHomeAction'),
    });
    if (!ok) {
      return;
    }
    try {
      await leaveHome(activeHome.id);
      await clearActiveHome();
      await refreshHomes();
      showToast({ message: t('toast.leftHome'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.leaveFail'), tone: 'error' });
    }
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: t('settings.deleteAccount'),
      message: t('confirm.deleteAccountBody'),
      confirmLabel: t('settings.deleteAccount'),
    });
    if (!ok) {
      return;
    }
    try {
      await deleteOwnAccount();
      await clearActiveHome();
      await signOut();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.deleteAccountFail'), tone: 'error' });
    }
  }

  async function handleSignOut() {
    const ok = await confirm({
      title: t('settings.signOut'),
      message: t('settings.signOutBody'),
      confirmLabel: t('settings.signOut'),
      tone: 'neutral',
    });
    if (!ok) {
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.signOutFail'), tone: 'error' });
    } finally {
      await clearActiveHome();
      setSigningOut(false);
    }
  }

  async function openMemberActivity(member: HomeMemberWithProfile) {
    if (!activeHome) {
      return;
    }
    setActivityFor(member);
    const events = await listHomeActivity(activeHome.id);
    setMemberActivity(events.filter((event) => event.actor_id === member.user_id));
  }

  async function handleProofMode(next: 'OPTIONAL' | 'REQUIRED' | 'ALL') {
    if (!activeHome || next === 'ALL') {
      return;
    }
    setError(null);
    setProofBusy(true);
    try {
      await updateHomeProofSettings({
        proof_mode: next,
        proof_capture: activeHome.proof_capture ?? 'CAMERA_OR_GALLERY',
      });
      showToast({ message: t('toast.proofUpdated'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.proofFail'), tone: 'error' });
    } finally {
      setProofBusy(false);
    }
  }

  async function handleProofCapture(next: 'CAMERA_OR_GALLERY' | 'CAMERA_ONLY' | 'ALL') {
    if (!activeHome || next === 'ALL') {
      return;
    }
    setError(null);
    setProofBusy(true);
    try {
      await updateHomeProofSettings({
        proof_mode: activeHome.proof_mode ?? 'OPTIONAL',
        proof_capture: next,
      });
      showToast({ message: t('toast.captureUpdated'), tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : t('toast.captureFail'), tone: 'error' });
    } finally {
      setProofBusy(false);
    }
  }

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(240)} className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="pt-2 pb-10 gap-4">
        <ScreenHeader
          title={t('settings.title')}
          subtitle={t('screen.settings')}
          helpTitle={t('settings.title')}
          helpMessage={t('settings.help')}
        />

        <SettingsSection
          title={t('settings.language')}
          subtitle={t('settings.language.subtitle')}>
          <FilterTogglePair
            value={locale}
            clearable={false}
            options={[
              { value: 'es' as const, label: 'Español' },
              { value: 'en' as const, label: 'English' },
            ]}
            onChange={(next) => {
              void setLocale(next === 'ALL' ? 'es' : next);
            }}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.profile')} subtitle={t('settings.profile.sub')}>
          <Text className="text-sm text-stone-600">{user?.email ?? '—'}</Text>
          <TextField
            label={t('settings.displayName')}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Button
            label={t('settings.saveName')}
            loading={savingName}
            onPress={() => void handleSaveName()}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.home')} subtitle={t('settings.home.sub')}>
          <Text className="text-lg font-semibold text-stone-900">
            {activeHome?.name ?? t('settings.home.none')}
          </Text>
          {activeHome ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-sm text-stone-600">
                  {t('settings.codeLabel', { code: activeHome.invite_code })}
                </Text>
                <Pressable onPress={() => void handleCopyCode()} className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-xs font-semibold text-teal-700">
                    {copied ? t('settings.copied') : t('settings.copyCode')}
                  </Text>
                </Pressable>
              </View>
              <Text className="text-sm font-medium text-stone-700">{t('settings.inviteTitle')}</Text>
              <Text className="text-xs text-stone-500">{t('settings.inviteBody')}</Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label={t('settings.copyLink')}
                    variant="secondary"
                    onPress={() => void handleCopyInviteLink()}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label={t('settings.showQr')}
                    variant="secondary"
                    onPress={() => setQrOpen(true)}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {homes.length > 1 ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-stone-700">{t('settings.switchHome')}</Text>
              {homes.map((home) => {
                const active = home.id === activeHome?.id;
                return (
                  <Pressable
                    key={home.id}
                    onPress={() => void setActiveHomeId(home.id)}
                    className={`rounded-xl border px-3 py-3 ${active ? 'border-teal-500 bg-teal-50' : 'border-stone-200 bg-white'}`}>
                    <Text className="text-sm font-medium text-stone-900">{home.name}</Text>
                    <Text className="text-xs text-stone-500">{home.invite_code}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text className="text-sm font-medium text-stone-700 mt-1">{t('settings.members')}</Text>
          {members.length === 0 ? (
            <Text className="text-sm text-stone-500">{t('settings.membersEmpty')}</Text>
          ) : (
            members.map((member) => {
              const mine = member.user_id === user?.id;
              return (
                <View key={member.id} className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm text-stone-800 flex-1">
                    {member.profiles?.display_name ?? t('common.roommate')}
                    {mine ? t('common.youSuffix') : ''} · {homeRoleLabel(member.role)}
                  </Text>
                  <OverflowMenuButton onPress={() => setMenuMember(member)} />
                </View>
              );
            })
          )}

          {activeHome && canManage ? (
            <View className="gap-3 border-t border-stone-100 pt-3">
              <Text className="text-sm font-medium text-stone-700">{t('settings.proof')}</Text>
              <Text className="text-xs text-stone-500">{t('settings.proof.sub')}</Text>
              <FilterTogglePair
                value={activeHome.proof_mode ?? 'OPTIONAL'}
                clearable={false}
                options={[
                  { value: 'OPTIONAL', label: t('settings.proof.optional') },
                  { value: 'REQUIRED', label: t('settings.proof.required') },
                ]}
                onChange={(value) => {
                  if (!proofBusy) {
                    void handleProofMode(value);
                  }
                }}
              />
              <FilterTogglePair
                value={activeHome.proof_capture ?? 'CAMERA_OR_GALLERY'}
                clearable={false}
                options={[
                  { value: 'CAMERA_OR_GALLERY', label: t('settings.proof.cameraOrGallery') },
                  { value: 'CAMERA_ONLY', label: t('settings.proof.cameraOnly') },
                ]}
                onChange={(value) => {
                  if (!proofBusy) {
                    void handleProofCapture(value);
                  }
                }}
              />
            </View>
          ) : null}

          {activeHome ? (
            <Button
              label={t('settings.leave')}
              variant="secondary"
              onPress={() => void handleLeaveHome()}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title={t('settings.otherHome')} subtitle={t('settings.otherHome.sub')}>
          <TextField
            label={t('settings.createHome')}
            value={newHomeName}
            onChangeText={setNewHomeName}
            placeholder={t('settings.createHome.ph')}
          />
          <Button
            label={t('common.create')}
            variant="secondary"
            loading={homeBusy}
            onPress={() => void handleCreateHome()}
          />
          <TextField
            label={t('settings.joinCode')}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            placeholder="DEMO2026"
          />
          <Button
            label={t('settings.join')}
            variant="secondary"
            loading={homeBusy}
            onPress={() => void handleJoinHome()}
          />
        </SettingsSection>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <SettingsSection
          title={t('settings.plus')}
          subtitle={t('settings.plus.subFull')}
          tone="plus">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-teal-900">{t('settings.plus.status')}</Text>
            <Text
              className={`text-xs font-bold px-2 py-1 rounded-md ${
                isPlus ? 'bg-teal-600 text-white' : 'bg-white text-teal-700'
              }`}>
              {isPlus ? t('settings.plus.active') : t('settings.plus.free')}
            </Text>
          </View>
          {!isPlus ? (
            <Button
              label={t('settings.plus.see')}
              onPress={() => {
                void presentPaywall().then((ok) => {
                  if (ok) {
                    showToast({ message: t('settings.plusWelcome'), tone: 'success' });
                  }
                });
              }}
            />
          ) : (
            <Button
              label={t('settings.plus.manage')}
              variant="secondary"
              onPress={() => {
                void presentCustomerCenter();
              }}
            />
          )}
          <Button
            label={t('settings.plus.restore')}
            variant="secondary"
            onPress={() => {
              void restorePurchases().then((ok) => {
                if (ok) {
                  showToast({ message: t('settings.purchasesRestored'), tone: 'success' });
                }
              });
            }}
          />
          {!isConfigured ? (
            <Text className="text-xs text-amber-700">{t('settings.rcMissing')}</Text>
          ) : null}
          <Text className="text-xs leading-4 text-teal-800/80">{t('settings.plusTeaser')}</Text>
        </SettingsSection>

        <SettingsSection title={t('settings.icons')} subtitle={t('settings.icons.sub')}>
          {packs.map((pack) => {
            const active = packId === pack.id;
            const custom = !isBuiltinIconPackId(pack.id);
            const locked = isPackLocked(pack.id);
            return (
              <View key={pack.id} className="gap-2">
                <Pressable
                  onPress={() => void setPackId(pack.id)}
                  className={`rounded-xl border px-3 py-3 ${active ? 'border-teal-500 bg-teal-50' : 'border-stone-200'}`}>
                  <Text className="text-sm font-medium text-stone-900">
                    {pack.tasks.checklist} {pack.name}
                    {active ? t('common.activeSuffix') : ''}
                    {custom ? ' · import' : ''}
                    {locked ? ' · Plus' : ''}
                  </Text>
                  <Text className="text-xs text-stone-500">{pack.description}</Text>
                </Pressable>
                {custom ? (
                  <Pressable
                    onPress={() => {
                      void confirm({
                        title: t('settings.deletePack'),
                        message: t('settings.deletePackBody', { name: pack.name }),
                        confirmLabel: t('common.delete'),
                      }).then((ok) => {
                        if (ok) {
                          void removeCustomPack(pack.id);
                        }
                      });
                    }}>
                    <Text className="text-xs font-semibold text-red-600 px-1">
                      {t('settings.deletePack')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          <CollapsibleSection title={t('settings.importPack')} accent="teal">
            <Text className="text-xs text-stone-500">{t('settings.importPack.sub')}</Text>
            <TextField
              label={t('settings.packJson')}
              value={iconPackJson}
              onChangeText={setIconPackJson}
              multiline
              className="min-h-[88px]"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder='{"name":"Fiesta","tasks":{"checklist":"🎉"}}'
            />
            <Button
              label={t('settings.importActivate')}
              variant="secondary"
              loading={importingPack}
              onPress={() => void handleImportIconPack()}
            />
          </CollapsibleSection>
        </SettingsSection>

        <SettingsSection title={t('settings.helpSection')} subtitle={t('settings.helpSection.sub')}>
          <Button
            label={t('settings.replayTutorial')}
            variant="secondary"
            onPress={openTutorial}
          />
        </SettingsSection>

        <Button
          label={t('settings.signOut')}
          variant="secondary"
          loading={signingOut}
          onPress={() => void handleSignOut()}
        />
        <Pressable onPress={() => void handleDeleteAccount()} className="py-3">
          <Text className="text-center text-sm font-semibold text-red-600">
            {t('settings.deleteAccount')}
          </Text>
        </Pressable>
      </ScrollView>
      </Animated.View>

      <OverflowMenu
        visible={menuMember !== null}
        title={menuMember?.profiles?.display_name ?? t('common.roommate')}
        onClose={() => setMenuMember(null)}
        actions={
          menuMember
            ? [
                {
                  key: 'history',
                  label: t('settings.memberHistory'),
                  onPress: () => {
                    void openMemberActivity(menuMember);
                  },
                },
                ...(canManage && menuMember.user_id !== user?.id && menuMember.role !== 'owner'
                  ? [
                      {
                        key: 'role',
                        label: menuMember.role === 'admin' ? 'Revocar admin' : 'Hacer admin',
                        onPress: () => {
                          if (!activeHome) {
                            return;
                          }
                          const nextRole = menuMember.role === 'admin' ? 'member' : 'admin';
                          const name = menuMember.profiles?.display_name ?? t('common.roommate');
                          void confirm({
                            title: nextRole === 'admin' ? 'Hacer admin' : 'Revocar admin',
                            message:
                              nextRole === 'admin'
                                ? t('confirm.makeAdmin', { name })
                                : t('confirm.revokeAdmin', { name }),
                            confirmLabel: nextRole === 'admin' ? 'Hacer admin' : 'Revocar',
                            tone: 'neutral',
                          }).then((ok) => {
                            if (!ok) {
                              return;
                            }
                            return setHomeMemberRole({
                              homeId: activeHome.id,
                              userId: menuMember.user_id,
                              role: nextRole,
                            })
                              .then(reloadMembers)
                              .catch((err) =>
                                showToast({
                                  message: err instanceof Error ? err.message : t('toast.roleFail'),
                                  tone: 'error',
                                }),
                              );
                          });
                        },
                      },
                      {
                        key: 'kick',
                        label: 'Expulsar del piso',
                        destructive: true,
                        onPress: () => {
                          if (!activeHome) {
                            return;
                          }
                          void confirm({
                            title: 'Expulsar compañero',
                            message: t('confirm.kick', {
                              name: menuMember.profiles?.display_name ?? t('common.roommate'),
                              home: activeHome.name,
                            }),
                            confirmLabel: 'Expulsar',
                          }).then((ok) => {
                            if (!ok) {
                              return;
                            }
                            return kickHomeMember(activeHome.id, menuMember.user_id)
                              .then(reloadMembers)
                              .catch((err) =>
                                showToast({
                                  message: err instanceof Error ? err.message : t('toast.kickFail'),
                                  tone: 'error',
                                }),
                              );
                          });
                        },
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <ActivityListModal
        visible={activityFor !== null}
        title={t('settings.activityOf', {
          name: activityFor?.profiles?.display_name ?? t('common.roommate'),
        })}
        events={memberActivity}
        onClose={() => setActivityFor(null)}
      />

      <Modal visible={qrOpen && Boolean(activeHome)} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/50 px-6" onPress={() => setQrOpen(false)}>
          <Pressable
            className="w-full max-w-sm items-center gap-3 rounded-3xl bg-white p-5"
            onPress={(event) => event.stopPropagation()}>
            <Text className="text-base font-semibold text-stone-900">QR de invitación</Text>
            {activeHome ? (
              <>
                <Image
                  source={{ uri: homeInviteQrImageUrl(activeHome.invite_code) }}
                  style={{ width: 220, height: 220 }}
                  accessibilityLabel="Código QR de invitación"
                />
                <Text className="text-center text-xs text-stone-500" selectable>
                  {homeInviteUrl(activeHome.invite_code)}
                </Text>
              </>
            ) : null}
            <Button label={t('common.close')} variant="secondary" onPress={() => setQrOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
