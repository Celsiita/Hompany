import { HelpTip } from '@/components/ui/HelpTip';

type InfoTipProps = {
  title: string;
  message: string;
  /** Kept for call-site compatibility; HelpTip uses teal. */
  tone?: 'violet' | 'amber' | 'gray';
};

/**
 * Alias over HelpTip for older call sites (Absences / silence panels).
 */
export function InfoTip({ title, message }: InfoTipProps) {
  return <HelpTip title={title} message={message} />;
}
