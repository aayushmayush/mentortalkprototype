/**
 * Design-system barrel.
 *
 * LAYERING RULE: nothing in this folder may import from `app/`, `features/`,
 * `components/` or `lib/`. This is a port of the Flutter package
 * `apps/design_system` and must stay extractable — someone should be able to
 * lift this directory into another Next app and have it work. The only imports
 * here are React and the neighbouring token files.
 */

export { cn } from './cn';
export { icons, type IconName } from './icons';

export { AppIcon, type AppIconProps, type IconSize } from './components/app-icon';
export { AppCircle, type AppCircleProps, type AppCircleSize } from './components/app-circle';
export { AppAvatar, type AppAvatarProps } from './components/app-avatar';
export {
  AppIconButton,
  type AppIconButtonProps,
  type AppIconButtonSize,
  type AppIconButtonType,
} from './components/app-icon-button';
export {
  AppButton,
  type AppButtonProps,
  type AppButtonType,
  type AppButtonSize,
  type AppButtonIntent,
} from './components/app-button';
export {
  AppStateIndicator,
  type AppStateIndicatorProps,
  type AppStateIndicatorSize,
  type AppStateIndicatorType,
} from './components/app-state-indicator';
export {
  AppIconCircle,
  type AppIconCircleProps,
  type AppIconCircleSize,
} from './components/app-icon-circle';
export { AppOnlineBadge, type AppOnlineBadgeProps } from './components/app-online-badge';
export { AppBanner, type AppBannerProps, type AppBannerVariant } from './components/app-banner';
export { AppListTile, type AppListTileProps } from './components/app-list-tile';
export {
  AppAutocompleteField,
  type AppAutocompleteFieldProps,
} from './components/app-autocomplete-field';
export { AppTextField, type AppTextFieldProps } from './components/app-text-field';
export {
  AppTextAreaField,
  countWords,
  type AppTextAreaFieldProps,
} from './components/app-text-area-field';
export { AppModal, type AppModalProps, type AppModalAction } from './components/app-modal';
export {
  AppBottomSheet,
  AppBottomSheetHeader,
  type AppBottomSheetProps,
  type AppBottomSheetHeaderProps,
} from './components/app-bottom-sheet';
export { AppSwitch, type AppSwitchProps } from './components/app-switch';
export {
  AppRadio,
  AppRadioGroup,
  type AppRadioProps,
  type AppRadioGroupProps,
} from './components/app-radio';
export {
  AppCheckbox,
  AppCheckboxGroup,
  type AppCheckboxProps,
  type AppCheckboxGroupProps,
} from './components/app-checkbox';
export {
  AppDropdownField,
  type AppDropdownFieldProps,
  type AppDropdownOption,
} from './components/app-dropdown-field';
export {
  AppLoadingSpinner,
  AppLoadingIndicator,
  LoadingPage,
  type AppLoadingSpinnerSize,
  type AppLoadingIndicatorProps,
} from './components/app-loading';
export { AppTopBar, AppPrimaryBar, AppBrandBar, AppBrand } from './components/app-bars';
export { AppTabBar, type AppTabBarProps } from './components/app-tab-bar';
export {
  AppBottomBar,
  type AppBottomBarProps,
  type AppBottomBarItem,
} from './components/app-bottom-bar';
export { PagePadding, type PagePaddingProps } from './components/page-padding';
export { NetworkBanner, type NetworkBannerProps } from './components/network-banner';
export {
  AppStepProgressIndicator,
  type AppStepProgressIndicatorProps,
} from './components/app-step-progress-indicator';
export { LiveBadge, type LiveBadgeProps, type LiveBadgeSize } from './components/live-badge';
