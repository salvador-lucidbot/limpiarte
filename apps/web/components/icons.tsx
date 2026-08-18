import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Icon({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }): React.ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.4-4.4" />
    </Icon>
  );
}

export function IconCart(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="9" cy="20" r="1.6" />
      <circle cx="17.5" cy="20" r="1.6" />
      <path d="M2.5 3.5h2.2l2.3 12.1a1.7 1.7 0 0 0 1.7 1.4h8.1a1.7 1.7 0 0 0 1.66-1.32L20.5 8H6" />
    </Icon>
  );
}

export function IconUser(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20.5c.9-3.5 3.7-5.3 7-5.3s6.1 1.8 7 5.3" />
    </Icon>
  );
}

export function IconMenu(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </Icon>
  );
}

export function IconX(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="m9 5.5 6.5 6.5L9 18.5" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </Icon>
  );
}

export function IconChevronDown(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </Icon>
  );
}

export function IconArrowRight(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M4 12h16m-6.5-6.5L20 12l-6.5 6.5" />
    </Icon>
  );
}

export function IconPlus(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconMinus(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function IconTruck(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4.2l3.3 3.4v3.1h-2.6" />
      <circle cx="6.5" cy="17.5" r="1.9" />
      <circle cx="16" cy="17.5" r="1.9" />
      <path d="M8.4 16.5h5.1" />
    </Icon>
  );
}

export function IconShieldCheck(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 2.8 4.5 5.6v5.2c0 4.6 3 8.7 7.5 10.4 4.5-1.7 7.5-5.8 7.5-10.4V5.6z" />
      <path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
    </Icon>
  );
}

export function IconSparkles(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.1l-1.8-5.5L4.7 10.8 10.2 9z" />
      <path d="M19 15.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" strokeWidth={1.4} />
    </Icon>
  );
}

export function IconCreditCard(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="2.8" y="5.5" width="18.4" height="13" rx="2.2" />
      <path d="M2.8 10h18.4M6.5 14.5h4" />
    </Icon>
  );
}

export function IconPackage(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="m12 2.8 8 4.3v9.8l-8 4.3-8-4.3V7.1z" />
      <path d="m4.2 7.3 7.8 4.2 7.8-4.2M12 11.5v9.4" />
    </Icon>
  );
}

export function IconBoxes(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M7.5 9.8 3 12.2v5l4.5 2.5 4.5-2.5v-5zM12 14.7v5M3 12.2l4.5 2.5 4.5-2.5" />
      <path d="M16.5 9.8 12 12.2v5l4.5 2.5L21 17.2v-5zM16.5 14.7v5" />
      <path d="M12 2.3 7.8 4.6v4.6L12 11.5l4.2-2.3V4.6z" />
    </Icon>
  );
}

export function IconTag(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M3 3h8.2L21 12.8a1.9 1.9 0 0 1 0 2.7l-5.5 5.5a1.9 1.9 0 0 1-2.7 0L3 11.2z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconTicket(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M3 8.5a2.5 2.5 0 0 0 0 7V19a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 19v-3.5a2.5 2.5 0 0 1 0-7V5a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 5z" transform="rotate(0 12 12)" />
      <path d="M14 4v2.2M14 11v2M14 17.8V20" strokeDasharray="0" />
    </Icon>
  );
}

export function IconPercent(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M18.5 5.5 5.5 18.5" />
      <circle cx="7.5" cy="7.5" r="2.6" />
      <circle cx="16.5" cy="16.5" r="2.6" />
    </Icon>
  );
}

export function IconMapPin(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 21.5s-7-6.2-7-11.3a7 7 0 0 1 14 0c0 5.1-7 11.3-7 11.3z" />
      <circle cx="12" cy="10" r="2.6" />
    </Icon>
  );
}

export function IconPhone(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M5.5 3.5h3.2l1.6 4.2-2.1 1.6a12.5 12.5 0 0 0 6.5 6.5l1.6-2.1 4.2 1.6v3.2a1.9 1.9 0 0 1-2 1.9C10.3 20 4 13.7 3.6 5.5a1.9 1.9 0 0 1 1.9-2z" />
    </Icon>
  );
}

export function IconMail(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </Icon>
  );
}

export function IconClock(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.4 2" />
    </Icon>
  );
}

export function IconExternalLink(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M13.5 5h5.5v5.5M19 5l-8.5 8.5" />
      <path d="M19 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18V7a1.5 1.5 0 0 1 1.5-1.5H11" />
    </Icon>
  );
}

export function IconChart(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M4 4v15.5A.5.5 0 0 0 4.5 20H20" />
      <path d="M8 15.5V11M12.5 15.5V7.5M17 15.5v-5" />
    </Icon>
  );
}

export function IconGrid(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="6.6" height="6.6" rx="1.2" />
      <rect x="13.4" y="4" width="6.6" height="6.6" rx="1.2" />
      <rect x="4" y="13.4" width="6.6" height="6.6" rx="1.2" />
      <rect x="13.4" y="13.4" width="6.6" height="6.6" rx="1.2" />
    </Icon>
  );
}

export function IconClipboardList(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 2.8h6v3.4H9z" />
      <path d="M9 11h6M9 15h6M9 18.5h3.5" />
    </Icon>
  );
}

export function IconUsers(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3.4" />
      <path d="M3 20c.7-3 3-4.7 6-4.7s5.3 1.7 6 4.7" />
      <path d="M15.5 5.4a3.4 3.4 0 0 1 0 6.2M17.8 15.6c1.7.6 2.8 1.9 3.2 4.4" />
    </Icon>
  );
}

export function IconImage(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="9.5" r="1.7" />
      <path d="m3.5 16.5 5-4.6 4.5 4.1 3-2.6 4.5 4.1" />
    </Icon>
  );
}

export function IconSettings(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.8 7.8 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.8 7.8 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.8 7.8 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.8 7.8 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.8 7.8 0 0 0 2.6-1.5l2.4 1 2-3.4z" />
    </Icon>
  );
}

export function IconBot(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="4.5" y="8" width="15" height="11" rx="2.5" />
      <path d="M12 8V4.8M12 4.8a1.4 1.4 0 1 0-.1 0zM4.5 13H2.8M21.2 13h-1.7" />
      <circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.5 16.3h5" />
    </Icon>
  );
}

export function IconFileText(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M13.5 2.8H7A1.8 1.8 0 0 0 5.2 4.6v14.8A1.8 1.8 0 0 0 7 21.2h10a1.8 1.8 0 0 0 1.8-1.8V8.1z" />
      <path d="M13.5 2.8v5.3h5.3M9 12.5h6M9 16h6" />
    </Icon>
  );
}

export function IconLogOut(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M14.5 3.5H6A1.5 1.5 0 0 0 4.5 5v14A1.5 1.5 0 0 0 6 20.5h8.5" />
      <path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5" />
    </Icon>
  );
}

export function IconPencil(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M15.6 4.2a2.1 2.1 0 0 1 3 0l1.2 1.2a2.1 2.1 0 0 1 0 3L8.6 19.6 4 20l.4-4.6z" />
      <path d="m13.8 6 4.2 4.2" />
    </Icon>
  );
}

export function IconTrash(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M4.5 6.5h15M9.5 6.2V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5v1.7" />
      <path d="M6.3 6.5 7 19.6A1.6 1.6 0 0 0 8.6 21h6.8a1.6 1.6 0 0 0 1.6-1.4l.7-13.1M10 10.5v6M14 10.5v6" />
    </Icon>
  );
}

export function IconCopy(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M5.5 15.5h-1a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5H14A1.5 1.5 0 0 1 15.5 5v1" />
    </Icon>
  );
}

export function IconPause(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M8.5 5v14M15.5 5v14" strokeWidth={2.2} />
    </Icon>
  );
}

export function IconPlay(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M7.5 4.8v14.4L19 12z" />
    </Icon>
  );
}

export function IconDownload(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 3.5V15m0 0 4.5-4.5M12 15l-4.5-4.5" />
      <path d="M4 17.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-1.5" />
    </Icon>
  );
}

export function IconUpload(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M12 15V3.5m0 0L7.5 8M12 3.5 16.5 8" />
      <path d="M4 17.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-1.5" />
    </Icon>
  );
}

export function IconRefresh(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M20 5.5v5h-5" />
      <path d="M19.4 13.5A7.6 7.6 0 1 1 18 7.2l2 3.3" />
    </Icon>
  );
}

export function IconPrinter(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M7 8V3.5h10V8" />
      <rect x="3.5" y="8" width="17" height="8.5" rx="1.8" />
      <path d="M7 13.5h10v7H7z" />
    </Icon>
  );
}

export function IconEye(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  );
}

export function IconAlertTriangle(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M10.4 4.2 2.8 17.6A1.8 1.8 0 0 0 4.4 20.3h15.2a1.8 1.8 0 0 0 1.6-2.7L13.6 4.2a1.8 1.8 0 0 0-3.2 0z" />
      <path d="M12 9.5v4.5M12 17.2v.1" />
    </Icon>
  );
}

export function IconCheck(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="m4.5 12.5 5 5L19.5 7" />
    </Icon>
  );
}

export function IconCheckCircle(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.3 2.6 2.6 4.8-5.3" />
    </Icon>
  );
}

export function IconLock(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
      <circle cx="12" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBuilding(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="5" y="3.5" width="14" height="17.5" rx="1.5" />
      <path d="M9 7.5h1.6M13.4 7.5H15M9 11h1.6M13.4 11H15M9 14.5h1.6M13.4 14.5H15M10.3 21v-3h3.4v3" />
    </Icon>
  );
}

export function IconCalendar(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 2.8V6M16 2.8V6M3.5 9.8h17" />
    </Icon>
  );
}

export function IconHomeHeart(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="m3 11 9-7.5L21 11" />
      <path d="M5.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M12 16.8s-2.8-1.9-2.8-3.7a1.6 1.6 0 0 1 2.8-1 1.6 1.6 0 0 1 2.8 1c0 1.8-2.8 3.7-2.8 3.7z" strokeWidth={1.4} />
    </Icon>
  );
}

export function IconDroplets(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M8 4.5S3.8 9.3 3.8 12.6a4.2 4.2 0 0 0 8.4 0C12.2 9.3 8 4.5 8 4.5z" />
      <path d="M16.5 10.5s-3 3.4-3 5.7a3 3 0 0 0 6 0c0-2.3-3-5.7-3-5.7z" />
    </Icon>
  );
}

export function IconSend(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M21 3.5 10.2 14.3M21 3.5l-6.8 17-3.9-6.7L3.5 10z" />
    </Icon>
  );
}

export function IconInbox(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M3.5 13.5h4.7l1.5 2.5h4.6l1.5-2.5h4.7" />
      <path d="M5.7 5.5h12.6l2.2 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-5z" />
    </Icon>
  );
}

export function IconStore(props: IconProps): React.ReactNode {
  return (
    <Icon {...props}>
      <path d="M4 7.5 5.5 3.5h13L20 7.5" />
      <path d="M4 7.5h16v2a2.6 2.6 0 0 1-5.2 0 2.6 2.6 0 0 1-5.3 0A2.6 2.6 0 0 1 4.2 9.7z" strokeWidth={1.5} />
      <path d="M5.5 12.5V20a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5v-7.5M9.5 20.5v-5h5v5" />
    </Icon>
  );
}

export function IconWhatsApp(props: IconProps): React.ReactNode {
  const { size = 20, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
      <path d="M12 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12 2zm0 18.1a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3 .8.8-3-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.3-1.7c-.2-.2 0-.4.1-.5l.4-.4c.1-.2.2-.3.2-.4a.5.5 0 0 0 0-.4c0-.1-.5-1.4-.7-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.1 5 5 0 0 0 1 2.7 11.4 11.4 0 0 0 4.4 3.9 14.6 14.6 0 0 0 1.5.5 3.5 3.5 0 0 0 1.6.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}
