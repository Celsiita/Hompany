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
import { mascotScreenLine } from '@/lib/mascot';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';
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
  const { isPlus, isConfigured, presentPaywall, restorePurchases } = usePurchases();

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
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateDisplayName(user.id, parsed.data);
      setDisplayName(updated.display_name);
      showToast({ message: 'Nombre actualizado', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo guardar el nombre', tone: 'error' });
    } finally {
      setSavingName(false);
    }
  }

  async function handleCreateHome() {
    setError(null);
    const parsed = createHomeInputSchema.safeParse({ name: newHomeName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    setHomeBusy(true);
    try {
      await createHome(parsed.data);
      setNewHomeName('');
      showToast({ message: 'Piso creado', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo crear el piso', tone: 'error' });
    } finally {
      setHomeBusy(false);
    }
  }

  async function handleJoinHome() {
    setError(null);
    const parsed = joinHomeInputSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Código no válido');
      return;
    }
    setHomeBusy(true);
    try {
      await joinHome(parsed.data);
      setInviteCode('');
      showToast({ message: 'Te has unido al piso', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo unir al piso', tone: 'error' });
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
    showToast({ message: ok ? 'Código copiado' : 'No se pudo copiar', tone: ok ? 'success' : 'error' });
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyInviteLink() {
    if (!activeHome) {
      return;
    }
    const ok = await copyToClipboard(homeInviteUrl(activeHome.invite_code));
    showToast({ message: ok ? 'Enlace de invitación copiado' : 'No se pudo copiar el enlace', tone: ok ? 'success' : 'error' });
  }

  async function handleImportIconPack() {
    setError(null);
    setImportingPack(true);
    try {
      const pack = await importPackFromJson(iconPackJson);
      if (!pack) {
        showToast({ message: 'Necesitas HOMPANY Plus para importar packs', tone: 'info' });
        return;
      }
      setIconPackJson('');
      showToast({ message: `Pack «${pack.name}» importado y activo`, tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo importar el pack', tone: 'error' });
    } finally {
      setImportingPack(false);
    }
  }

  async function handleLeaveHome() {
    if (!activeHome) {
      return;
    }
    const ok = await confirm({
      title: 'Abandonar piso',
      message: `Vas a salir de «${activeHome.name}». Si eres el último, el piso se elimina. Si eres el único owner, el rol pasa a otro compañero.`,
      confirmLabel: 'Abandonar',
    });
    if (!ok) {
      return;
    }
    try {
      await leaveHome(activeHome.id);
      await clearActiveHome();
      await refreshHomes();
      showToast({ message: 'Has abandonado el piso', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo abandonar el piso', tone: 'error' });
    }
  }

  async function handleDeleteAccount() {
    const homeNames = homes.map((home) => home.name).join(', ') || 'ninguno';
    const ok = await confirm({
      title: 'Eliminar cuenta',
      message: `Esto borra tu usuario de forma permanente. Saldrás de los pisos: ${homeNames}. No se puede deshacer.`,
      confirmLabel: 'Borrar cuenta',
    });
    if (!ok) {
      return;
    }
    try {
      await deleteOwnAccount();
      await clearActiveHome();
      await signOut();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo borrar la cuenta', tone: 'error' });
    }
  }

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Cerrar sesión',
      message: '¿Seguro que quieres salir de HOMPANY en este dispositivo?',
      confirmLabel: 'Cerrar sesión',
      tone: 'neutral',
    });
    if (!ok) {
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo cerrar sesión', tone: 'error' });
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
      showToast({ message: 'Ajuste de prueba actualizado', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo guardar la prueba', tone: 'error' });
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
      showToast({ message: 'Fuente de foto actualizada', tone: 'success' });
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'No se pudo guardar la fuente', tone: 'error' });
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
          title="Ajustes"
          subtitle={mascotScreenLine('settings')}
          helpTitle="Ajustes"
          helpMessage="Primero tu piso e invitación. Luego Plus e iconos (opcionales). Al final, tutorial y cuenta."
        />

        <SettingsSection title="Perfil" subtitle="Cómo te ven tus compañeros">
          <Text className="text-sm text-stone-600">{user?.email ?? '—'}</Text>
          <TextField label="Nombre visible" value={displayName} onChangeText={setDisplayName} />
          <Button label="Guardar nombre" loading={savingName} onPress={() => void handleSaveName()} />
        </SettingsSection>

        <SettingsSection title="Piso activo" subtitle="Invita compañeros y cambia de hogar">
          <Text className="text-lg font-semibold text-stone-900">{activeHome?.name ?? 'Sin piso'}</Text>
          {activeHome ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-sm text-stone-600">
                  Código: {activeHome.invite_code}
                </Text>
                <Pressable onPress={() => void handleCopyCode()} className="rounded-lg bg-stone-100 px-3 py-2">
                  <Text className="text-xs font-semibold text-teal-700">
                    {copied ? '¡Copiado!' : 'Copiar código'}
                  </Text>
                </Pressable>
              </View>
              <Text className="text-sm font-medium text-stone-700">Invitar con enlace o QR</Text>
              <Text className="text-xs text-stone-500">
                Comparte el enlace o el QR: tu compañero entra con el código sin líos.
              </Text>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button
                    label="Copiar enlace"
                    variant="secondary"
                    onPress={() => void handleCopyInviteLink()}
                  />
                </View>
                <View className="flex-1">
                  <Button label="Mostrar QR" variant="secondary" onPress={() => setQrOpen(true)} />
                </View>
              </View>
            </View>
          ) : null}

          {homes.length > 1 ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-stone-700">Cambiar de piso</Text>
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

          <Text className="text-sm font-medium text-stone-700 mt-1">Compañeros</Text>
          {members.length === 0 ? (
            <Text className="text-sm text-stone-500">
              Solo tú por ahora. Invita compañeros con el código de arriba.
            </Text>
          ) : (
            members.map((member) => {
              const mine = member.user_id === user?.id;
              return (
                <View key={member.id} className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm text-stone-800 flex-1">
                    {member.profiles?.display_name ?? 'Compañero'}
                    {mine ? ' · tú' : ''} · {homeRoleLabel(member.role)}
                  </Text>
                  <OverflowMenuButton onPress={() => setMenuMember(member)} />
                </View>
              );
            })
          )}

          {activeHome && canManage ? (
            <View className="gap-3 border-t border-stone-100 pt-3">
              <Text className="text-sm font-medium text-stone-700">Prueba de tareas</Text>
              <Text className="text-xs text-stone-500">
                Cómo se entrega la foto al completar una tarea en este piso.
              </Text>
              <FilterTogglePair
                value={activeHome.proof_mode ?? 'OPTIONAL'}
                clearable={false}
                options={[
                  { value: 'OPTIONAL', label: 'Foto opcional' },
                  { value: 'REQUIRED', label: 'Foto obligatoria' },
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
                  { value: 'CAMERA_OR_GALLERY', label: 'Cámara o galería' },
                  { value: 'CAMERA_ONLY', label: 'Solo cámara' },
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
              label="Abandonar piso"
              variant="secondary"
              onPress={() => void handleLeaveHome()}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title="Otro piso" subtitle="Crear uno nuevo o unirte con código">
          <TextField
            label="Crear piso"
            value={newHomeName}
            onChangeText={setNewHomeName}
            placeholder="Ej. Piso Erasmus"
          />
          <Button
            label="Crear"
            variant="secondary"
            loading={homeBusy}
            onPress={() => void handleCreateHome()}
          />
          <TextField
            label="Unirse con código"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            placeholder="DEMO2026"
          />
          <Button
            label="Unirme"
            variant="secondary"
            loading={homeBusy}
            onPress={() => void handleJoinHome()}
          />
        </SettingsSection>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}

        <SettingsSection
          title="HOMPANY Plus"
          subtitle="Packs de iconos opcionales. El core del piso sigue gratis."
          tone="plus">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-teal-900">Estado</Text>
            <Text
              className={`text-xs font-bold px-2 py-1 rounded-md ${
                isPlus ? 'bg-teal-600 text-white' : 'bg-white text-teal-700'
              }`}>
              {isPlus ? 'Activo' : 'Plan gratuito'}
            </Text>
          </View>
          {!isPlus ? (
            <Button
              label="Ver HOMPANY Plus"
              onPress={() => {
                void presentPaywall().then((ok) => {
                  if (ok) {
                    showToast({ message: 'Bienvenido a HOMPANY Plus', tone: 'success' });
                  }
                });
              }}
            />
          ) : null}
          <Button
            label="Restaurar compras"
            variant="secondary"
            onPress={() => {
              void restorePurchases().then((ok) => {
                if (ok) {
                  showToast({ message: 'Compras restauradas', tone: 'success' });
                }
              });
            }}
          />
          {!isConfigured ? (
            <Text className="text-xs text-amber-700">
              Falta la clave de compras en .env.local — el resto de la app funciona igual.
            </Text>
          ) : null}
        </SettingsSection>

        <SettingsSection
          title="Iconos"
          subtitle="Clásico gratis. Hogar, Play e importados necesitan Plus.">
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
                    {active ? ' · activo' : ''}
                    {custom ? ' · importado' : ''}
                    {locked ? ' · Plus' : ''}
                  </Text>
                  <Text className="text-xs text-stone-500">{pack.description}</Text>
                </Pressable>
                {custom ? (
                  <Pressable
                    onPress={() => {
                      void confirm({
                        title: 'Eliminar pack',
                        message: `¿Borrar «${pack.name}» de este dispositivo?`,
                        confirmLabel: 'Eliminar',
                      }).then((ok) => {
                        if (ok) {
                          void removeCustomPack(pack.id);
                        }
                      });
                    }}>
                    <Text className="text-xs font-semibold text-red-600 px-1">Eliminar pack</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          <CollapsibleSection title="Importar pack JSON (Plus)" accent="teal">
            <Text className="text-xs text-stone-500">
              Pega un JSON con nombre e iconos propios. Requiere HOMPANY Plus.
            </Text>
            <TextField
              label="JSON del pack"
              value={iconPackJson}
              onChangeText={setIconPackJson}
              multiline
              className="min-h-[88px]"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder='{"name":"Fiesta","tasks":{"checklist":"🎉"}}'
            />
            <Button
              label="Importar y activar"
              variant="secondary"
              loading={importingPack}
              onPress={() => void handleImportIconPack()}
            />
          </CollapsibleSection>
        </SettingsSection>

        <SettingsSection title="Ayuda" subtitle="Tour de 1 minuto por Feed, Agenda, Tareas y Gastos">
          <Button label="Repetir tutorial con Mico" variant="secondary" onPress={openTutorial} />
        </SettingsSection>

        <Button
          label="Cerrar sesión"
          variant="secondary"
          loading={signingOut}
          onPress={() => void handleSignOut()}
        />
        <Pressable onPress={() => void handleDeleteAccount()} className="py-3">
          <Text className="text-center text-sm font-semibold text-red-600">Eliminar cuenta</Text>
        </Pressable>
      </ScrollView>
      </Animated.View>

      <OverflowMenu
        visible={menuMember !== null}
        title={menuMember?.profiles?.display_name ?? 'Compañero'}
        onClose={() => setMenuMember(null)}
        actions={
          menuMember
            ? [
                {
                  key: 'history',
                  label: 'Historial de actividad',
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
                          const name = menuMember.profiles?.display_name ?? 'este compañero';
                          void confirm({
                            title: nextRole === 'admin' ? 'Hacer admin' : 'Revocar admin',
                            message:
                              nextRole === 'admin'
                                ? `¿Dar rol de admin a ${name}? Podrá editar y expulsar.`
                                : `¿Quitar el rol de admin a ${name}? Volverá a ser miembro.`,
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
                                showToast({ message: err instanceof Error ? err.message : 'No se pudo cambiar el rol', tone: 'error' }),
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
                            message: `¿Sacar a ${menuMember.profiles?.display_name ?? 'este compañero'} de «${activeHome.name}»?`,
                            confirmLabel: 'Expulsar',
                          }).then((ok) => {
                            if (!ok) {
                              return;
                            }
                            return kickHomeMember(activeHome.id, menuMember.user_id)
                              .then(reloadMembers)
                              .catch((err) =>
                                showToast({ message: err instanceof Error ? err.message : 'No se pudo expulsar', tone: 'error' }),
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
        title={`Actividad de ${activityFor?.profiles?.display_name ?? ''}`}
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
            <Button label="Cerrar" variant="secondary" onPress={() => setQrOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
