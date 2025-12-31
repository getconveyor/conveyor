import { Badge } from '@/components/ui/badge'

interface MemberStatusBadgeProps {
  status: 'active' | 'invited' | 'suspended' | 'deactivated'
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  const variants: Record<string, { variant: any; label: string }> = {
    active: {
      variant: 'default',
      label: 'Active',
    },
    invited: {
      variant: 'secondary',
      label: 'Invited',
    },
    suspended: {
      variant: 'destructive',
      label: 'Suspended',
    },
    deactivated: {
      variant: 'outline',
      label: 'Deactivated',
    },
  }

  const config = variants[status] || variants.active

  return <Badge variant={config.variant}>{config.label}</Badge>
}
