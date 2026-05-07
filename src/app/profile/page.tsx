import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm';
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getProfileUser, getItemStats, getSystemItemTypesWithCounts } from '@/lib/db/items';
import { getCollectionStats, getSidebarCollections } from '@/lib/db/collections';
import { ICON_COMPONENTS, type IconName } from '@/lib/constants/item-types';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const userId = session.user.id;

  const [profileUser, itemStats, collectionStats, itemTypes, sidebarCollections] =
    await Promise.all([
      getProfileUser(userId),
      getItemStats(userId),
      getCollectionStats(userId),
      getSystemItemTypesWithCounts(userId),
      getSidebarCollections(userId),
    ]);

  if (!profileUser) redirect('/sign-in');

  const memberSince = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(profileUser.createdAt);

  return (
    <DashboardShell
      sidebarData={{ itemTypes, collections: sidebarCollections }}
      user={{
        name: session.user.name ?? session.user.email ?? 'User',
        email: session.user.email ?? '',
        image: session.user.image,
      }}
    >
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Your account details and settings</p>
        </div>

        {/* Account info */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={profileUser.name}
                image={profileUser.image}
                className="size-16 text-xl"
              />
              <div>
                <p className="font-medium">{profileUser.name ?? '—'}</p>
                <p className="text-sm text-muted-foreground">{profileUser.email}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Member since {memberSince}
            </div>
          </CardContent>
        </Card>

        {/* Usage stats */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-2xl font-semibold">{itemStats.total}</p>
                <p className="text-sm text-muted-foreground">Total items</p>
              </div>
              <div className="rounded-lg border border-border px-4 py-3">
                <p className="text-2xl font-semibold">{collectionStats.total}</p>
                <p className="text-sm text-muted-foreground">Collections</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">By type</p>
              <div className="space-y-1.5">
                {itemTypes.map((type) => {
                  const IconComponent = ICON_COMPONENTS[type.icon as IconName];
                  return (
                    <div key={type.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {IconComponent && (
                          <IconComponent
                            className="size-4 shrink-0"
                            style={{ color: type.color }}
                          />
                        )}
                        <span className="text-sm capitalize">{type.name}s</span>
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {type.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change password — credentials users only */}
        {profileUser.hasPassword && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ChangePasswordForm />
            </CardContent>
          </Card>
        )}

        {/* Danger zone */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-destructive">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
