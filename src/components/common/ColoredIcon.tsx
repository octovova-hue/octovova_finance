import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Flat, literal, colored SVG icons sourced in the style of SVGREPO colored collections

export const HouseColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21L24 8L39 21V40H9V21Z" fill="#3B82F6" />
    <path d="M24 6L6 22H11V40H37V22H42L24 6Z" fill="#60A5FA" />
    <path d="M20 28H28V40H20V28Z" fill="#1E40AF" />
    <path d="M14 24H18V28H14V24Z" fill="#FEF08A" />
    <path d="M30 24H34V28H30V24Z" fill="#FEF08A" />
    <path d="M33 11H37V18L33 14.5V11Z" fill="#EF4444" />
  </svg>
);

export const FoodColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#10B981" />
    <path d="M16 22C16 17.5817 19.5817 14 24 14C28.4183 14 32 17.5817 32 22V24H16V22Z" fill="#FBBF24" />
    <path d="M12 24H36L34 36H14L12 24Z" fill="#F59E0B" />
    <circle cx="21" cy="20" r="3" fill="#EF4444" />
    <circle cx="27" cy="19" r="2.5" fill="#34D399" />
  </svg>
);

export const CarColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24L12 14H36L40 24V34H36V32H12V34H8V24Z" fill="#3B82F6" />
    <path d="M14 16L11 23H37L34 16H14Z" fill="#93C5FD" />
    <circle cx="14" cy="32" r="4" fill="#1F2937" />
    <circle cx="14" cy="32" r="2" fill="#E5E7EB" />
    <circle cx="34" cy="32" r="4" fill="#1F2937" />
    <circle cx="34" cy="32" r="2" fill="#E5E7EB" />
    <rect x="10" y="24" width="4" height="2" rx="1" fill="#FEF08A" />
    <rect x="34" y="24" width="4" height="2" rx="1" fill="#FEF08A" />
  </svg>
);

export const BankLoanColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 18L24 6L42 18H6Z" fill="#8B5CF6" />
    <rect x="8" y="18" width="32" height="3" fill="#6D28D9" />
    <rect x="11" y="21" width="4" height="15" fill="#A78BFA" />
    <rect x="19" y="21" width="4" height="15" fill="#A78BFA" />
    <rect x="27" y="21" width="4" height="15" fill="#A78BFA" />
    <rect x="35" y="21" width="4" height="15" fill="#A78BFA" />
    <rect x="6" y="36" width="36" height="5" rx="1" fill="#6D28D9" />
    <circle cx="24" cy="14" r="2.5" fill="#FDE047" />
  </svg>
);

export const CreditCardColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="36" height="28" rx="4" fill="#F43F5E" />
    <rect x="6" y="16" width="36" height="6" fill="#1E293B" />
    <rect x="11" y="27" width="8" height="6" rx="1" fill="#FDE047" />
    <rect x="22" y="29" width="14" height="2" rx="1" fill="#FECDD3" />
  </svg>
);

export const LifestyleColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 14H34V28C34 32.4183 30.4183 36 26 36H20C15.5817 36 12 32.4183 12 28V14Z" fill="#F59E0B" />
    <path d="M34 18H38C39.6569 18 41 19.3431 41 21V23C41 24.6569 39.6569 26 38 26H34V18Z" fill="#D97706" />
    <rect x="8" y="38" width="30" height="3" rx="1.5" fill="#78350F" />
    <path d="M18 7C18 7 19 9 19 11M23 6C23 6 24 8 24 11M28 7C28 7 29 9 29 11" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const UtilitiesColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="#6366F1" />
    <path d="M26 10L14 26H24L22 38L34 22H24L26 10Z" fill="#FDE047" />
  </svg>
);

export const WalletColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="12" width="36" height="26" rx="4" fill="#059669" />
    <path d="M6 18H42V14C42 12.8954 41.1046 12 40 12H8C6.89543 12 6 12.8954 6 14V18Z" fill="#10B981" />
    <path d="M28 20H42V30H28C25.7909 30 24 28.2091 24 26C24 23.7909 25.7909 20 28 20Z" fill="#047857" />
    <circle cx="34" cy="25" r="2.5" fill="#FDE047" />
  </svg>
);

export const StocksGrowthColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="36" height="36" rx="6" fill="#064E3B" />
    <rect x="11" y="24" width="5" height="14" rx="1" fill="#34D399" />
    <rect x="19" y="18" width="5" height="20" rx="1" fill="#34D399" />
    <rect x="27" y="14" width="5" height="24" rx="1" fill="#34D399" />
    <rect x="35" y="8" width="5" height="30" rx="1" fill="#6EE7B7" />
    <path d="M12 22L21 15L29 17L38 8" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PiggyBankColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="26" r="14" fill="#EC4899" />
    <ellipse cx="14" cy="28" rx="4" ry="3" fill="#F472B6" />
    <circle cx="20" cy="22" r="1.5" fill="#1F2937" />
    <rect x="16" y="38" width="4" height="4" fill="#DB2777" />
    <rect x="28" y="38" width="4" height="4" fill="#DB2777" />
    <circle cx="24" cy="12" r="4" fill="#FBBF24" />
    <path d="M24 10V14M22 12H26" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const RealEstateColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="14" width="18" height="28" rx="2" fill="#0284C7" />
    <rect x="24" y="8" width="18" height="34" rx="2" fill="#38BDF8" />
    <rect x="12" y="18" width="3" height="3" fill="#FEF08A" />
    <rect x="18" y="18" width="3" height="3" fill="#FEF08A" />
    <rect x="12" y="25" width="3" height="3" fill="#FEF08A" />
    <rect x="18" y="25" width="3" height="3" fill="#FEF08A" />
    <rect x="28" y="13" width="3" height="3" fill="#FEF08A" />
    <rect x="35" y="13" width="3" height="3" fill="#FEF08A" />
    <rect x="28" y="20" width="3" height="3" fill="#FEF08A" />
    <rect x="35" y="20" width="3" height="3" fill="#FEF08A" />
  </svg>
);

export const GoldBullionColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 28L18 16H34L38 28H12Z" fill="#F59E0B" />
    <path d="M18 16L34 16L32 20L16 20L18 16Z" fill="#FEF08A" />
    <path d="M8 38L14 26H38L42 38H8Z" fill="#D97706" />
    <path d="M14 26L38 26L36 30L12 30L14 26Z" fill="#FDE047" />
  </svg>
);

export const WeddingRingsColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="26" r="11" stroke="#F59E0B" strokeWidth="4" fill="none" />
    <circle cx="30" cy="22" r="11" stroke="#FBBF24" strokeWidth="4" fill="none" />
    <path d="M20 11L22 7L26 7L28 11L24 13L20 11Z" fill="#38BDF8" />
  </svg>
);

export const RetirementIslandColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="34" cy="16" r="8" fill="#FBBF24" />
    <path d="M6 38C14 34 34 34 42 38H6Z" fill="#FCD34D" />
    <path d="M4 42C12 39 36 39 44 42H4Z" fill="#0284C7" />
    <path d="M18 34C18 24 22 18 24 14" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
    <path d="M24 14C20 10 14 12 12 14M24 14C24 9 29 8 32 10M24 14C28 14 32 18 34 20" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const GraduationCapColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8L4 18L24 28L44 18L24 8Z" fill="#3B82F6" />
    <path d="M12 22V32C12 32 17 38 24 38C31 38 36 32 36 32V22L24 28L12 22Z" fill="#1D4ED8" />
    <path d="M40 20V32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="40" cy="34" r="2" fill="#F59E0B" />
  </svg>
);

export const EmergencyLifebuoyColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="#EF4444" />
    <circle cx="24" cy="24" r="9" fill="#080E0B" />
    <path d="M24 6V15M24 33V42M6 24H15M33 24H42" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const BullseyeTargetColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="18" fill="#EF4444" />
    <circle cx="24" cy="24" r="12" fill="#FFFFFF" />
    <circle cx="24" cy="24" r="6" fill="#10B981" />
  </svg>
);

export const DashboardNavColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="15" height="15" rx="3" fill="#10B981" />
    <rect x="27" y="6" width="15" height="22" rx="3" fill="#3B82F6" />
    <rect x="6" y="27" width="15" height="15" rx="3" fill="#F59E0B" />
    <rect x="27" y="34" width="15" height="8" rx="3" fill="#10B981" />
  </svg>
);

export const PlansNavColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 8C10 6.89543 10.8954 6 12 6H30L38 14V40C38 41.1046 37.1046 42 36 42H12C10.8954 42 10 41.1046 10 40V8Z" fill="#34D399" />
    <path d="M30 6V14H38L30 6Z" fill="#059669" />
    <line x1="16" y1="22" x2="32" y2="22" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="28" x2="28" y2="28" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="34" x2="24" y2="34" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const RobotAdvisorColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="14" width="28" height="22" rx="6" fill="#10B981" />
    <circle cx="18" cy="24" r="3.5" fill="#080E0B" />
    <circle cx="30" cy="24" r="3.5" fill="#080E0B" />
    <circle cx="19" cy="23" r="1.5" fill="#34D399" />
    <circle cx="31" cy="23" r="1.5" fill="#34D399" />
    <path d="M20 30H28" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" />
    <rect x="22" y="6" width="4" height="8" rx="1" fill="#34D399" />
    <circle cx="24" cy="6" r="3" fill="#FBBF24" />
    <rect x="5" y="21" width="5" height="8" rx="2" fill="#059669" />
    <rect x="38" y="21" width="5" height="8" rx="2" fill="#059669" />
  </svg>
);

export const SalaryBriefcaseColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="16" width="36" height="24" rx="4" fill="#059669" />
    <path d="M18 16V12C18 10.8954 18.8954 10 20 10H28C29.1046 10 30 10.8954 30 12V16" stroke="#34D399" strokeWidth="3" />
    <rect x="6" y="22" width="36" height="4" fill="#047857" />
    <circle cx="24" cy="24" r="3" fill="#FDE047" />
  </svg>
);

export const CheckmarkColoredIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="#10B981" />
    <path d="M14 24L21 31L34 17" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
