import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ActivityListModal } from '@/components/ui/ActivityListModal';
import { Button } from '@/components/ui/Button';
import { OverflowMenu, OverflowMenuButton } from '@/components/ui/OverflowMenu';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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
import { isBuiltinIconPackId } from '@/lib/icons/packs';
import { isHomeAdminRole, homeRoleLabel } from '@/lib/roles';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmProvider';
import { useHome } from '@/providers/HomeProvider';
import { useIconPack } from '@/providers/IconPackProvider';
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
  const { activeHome, homes, setActiveHomeId, createHome, joinHome, clearActiveHome, refreshHomes } =
    useHome();
  const confirm = useConfirmDialog();
  const { packId, setPackId, packs, importPackFromJson, removeCustomPack } = useIconPack();

  const [displayName, setDisplayName] = useState('');
  const [members, setMembers] = useState<HomeMemberWithProfile[]>([]);
  const [newHomeName, setNewHomeName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [iconPackJson, setIconPackJson] = useState('');
  const [importingPack, setImportingPack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [homeBusy, setHomeBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [copied, setCopied] = useState(false);
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
    setStatus(null);
    const parsed = registerSchema.shape.displayName.safeParse(displayName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateDisplayName(user.id, parsed.data);
      setDisplayName(updated.display_name);
      setStatus('Nombre actualizado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el nombre');
    } finally {
      setSavingName(false);
    }
  }

  async function handleCreateHome() {
    setError(null);
    setStatus(null);
    const parsed = createHomeInputSchema.safeParse({ name: newHomeName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    setHomeBusy(true);
    try {
      await createHome(parsed.data);
      setNewHomeName('');
      setStatus('Piso creado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el piso');
    } finally {
      setHomeBusy(false);
    }
  }

  async function handleJoinHome() {
    setError(null);
    setStatus(null);
    const parsed = joinHomeInputSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Código no válido');
      return;
    }
    setHomeBusy(true);
    try {
      await joinHome(parsed.data);
      setInviteCode('');
      setStatus('Te has unido al piso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir al piso');
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
    setStatus(ok ? '¡Copiado!' : 'No se pudo copiar');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleImportIconPack() {
    setError(null);
    setStatus(null);
    setImportingPack(true);
    try {
      const pack = await importPackFromJson(iconPackJson);
      setIconPackJson('');
      setStatus(`Pack «${pack.name}» importado y activo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar el pack');
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
      setStatus('Has abandonado el piso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abandonar el piso');
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
      setError(err instanceof Error ? err.message : 'No se pudo borrar la cuenta');
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
      setError(err instanceof Error ? err.message : 'No se pudo cerrar sesión');
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

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="pt-2 pb-10 gap-4">
        <ScreenHeader title="Ajustes" subtitle="Tu cuenta, tu piso y la sesión" />

        <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-500">Perfil</Text>
          <Text className="text-sm text-gray-600">{user?.email ?? '—'}</Text>
          <TextField label="Nombre visible" value={displayName} onChangeText={setDisplayName} />
          <Button label="Guardar nombre" loading={savingName} onPress={() => void handleSaveName()} />
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-500">Iconos</Text>
          <Text className="text-xs text-gray-500">
            Elige un paquete temático o importa uno propio (JSON con emojis). Los iconos se
            aplican a tarjetas y a la agenda de 7 días.
          </Text>
          {packs.map((pack) => {
            const active = packId === pack.id;
            const custom = !isBuiltinIconPackId(pack.id);
            return (
              <View key={pack.id} className="gap-2">
                <Pressable
                  onPress={() => void setPackId(pack.id)}
                  className={`rounded-xl border px-3 py-3 ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <Text className="text-sm font-medium text-gray-900">
                    {pack.tasks.checklist} {pack.name}
                    {active ? ' · activo' : ''}
                    {custom ? ' · importado' : ''}
                  </Text>
                  <Text className="text-xs text-gray-500">{pack.description}</Text>
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

          <Text className="text-sm font-medium text-gray-700 mt-1">Importar pack (JSON)</Text>
          <Text className="text-xs text-gray-500">
            Ejemplo: {`{"name":"Fiesta","tasks":{"checklist":"🎉"},"expenses":{"PEER":"🥳"}}`}
          </Text>
          <TextField
            label="Pegar JSON del pack"
            value={iconPackJson}
            onChangeText={setIconPackJson}
            multiline
            className="min-h-[88px]"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            label="Importar y activar"
            variant="secondary"
            loading={importingPack}
            onPress={() => void handleImportIconPack()}
          />
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-500">Piso activo</Text>
          <Text className="text-lg font-semibold text-gray-900">{activeHome?.name ?? 'Sin piso'}</Text>
          {activeHome ? (
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-sm text-gray-600">
                Código: {activeHome.invite_code}
              </Text>
              <Pressable onPress={() => void handleCopyCode()} className="rounded-lg bg-gray-100 px-3 py-2">
                <Text className="text-xs font-semibold text-blue-700">
                  {copied ? '¡Copiado!' : 'Copiar'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {homes.length > 1 ? (
            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700">Cambiar de piso</Text>
              {homes.map((home) => {
                const active = home.id === activeHome?.id;
                return (
                  <Pressable
                    key={home.id}
                    onPress={() => void setActiveHomeId(home.id)}
                    className={`rounded-xl border px-3 py-3 ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <Text className="text-sm font-medium text-gray-900">{home.name}</Text>
                    <Text className="text-xs text-gray-500">{home.invite_code}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text className="text-sm font-medium text-gray-700 mt-1">Compañeros</Text>
          {members.length === 0 ? (
            <Text className="text-sm text-gray-500">Nadie más en el piso.</Text>
          ) : (
            members.map((member) => {
              const mine = member.user_id === user?.id;
              return (
                <View key={member.id} className="flex-row items-center justify-between gap-2">
                  <Text className="text-sm text-gray-800 flex-1">
                    {member.profiles?.display_name ?? 'Compañero'}
                    {mine ? ' · tú' : ''} · {homeRoleLabel(member.role)}
                  </Text>
                  <OverflowMenuButton onPress={() => setMenuMember(member)} />
                </View>
              );
            })
          )}

          {activeHome ? (
            <Button
              label="Abandonar piso"
              variant="secondary"
              onPress={() => void handleLeaveHome()}
            />
          ) : null}
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-4 gap-3">
          <Text className="text-sm font-semibold text-gray-500">Otro piso</Text>
          <TextField
            label="Crear piso"
            value={newHomeName}
            onChangeText={setNewHomeName}
            placeholder="Nombre del piso"
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
        </View>

        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        {status ? <Text className="text-sm text-emerald-700">{status}</Text> : null}

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
                                setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol'),
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
                                setError(err instanceof Error ? err.message : 'No se pudo expulsar'),
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
    </Screen>
  );
}
