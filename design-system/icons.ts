/**
 * Icon set.
 *
 * Fidelity here means Material glyphs, not a lookalike set — the shapes have to
 * match, not merely the meanings. Rather than depend on an icon-font package,
 * each constant maps to its Material Symbols ligature name; <Icon> renders the
 * ligature through the variable font loaded in globals.css.
 *
 * ── How this maps onto the Flutter source ────────────────────────────────────
 *
 * The Flutter app centralises icons in
 * apps/design_system/lib/core/theme/icons/app_icons.dart as 87 `IconData`
 * constants. The names below are those constants, verbatim, so a screen written
 * against `AppIcons.chat` reads the same here: `icons.chat`.
 *
 * Flutter distinguishes outlined from filled with SEPARATE constants
 * (`AppIcons.home` is `Icons.home_outlined`, `AppIcons.homeFilled` is
 * `Icons.home`). Material Symbols instead has one glyph with a FILL axis, so
 * those pairs share a ligature name and are told apart by FILLED_ICONS below,
 * which AppIcon reads to decide the axis value.
 *
 * ── The one known fidelity gap ───────────────────────────────────────────────
 *
 * Several constants use Flutter's `_rounded` style (`arrow_back_ios_new_rounded`,
 * `add_rounded`, `send_rounded`, `logout_rounded`, …). Material Symbols ships
 * that as a separate font FILE, not an axis, and only the Outlined file is
 * bundled — so those constants resolve to their Outlined counterpart here. The
 * difference is the corner radius on the glyph's terminals, not its shape. To
 * close the gap, bundle Material Symbols Rounded and either swap the family or
 * add a second family for this subset.
 *
 * Also note `accessTime` and `camera` are the two constants whose Material
 * glyph was RENAMED (`access_time`→`schedule`, `camera_alt`→`photo_camera`);
 * the current names are used.
 */

export const icons = {
  // ── Navigation ──────────────────────────────────────────────────────────
  arrowBack: 'arrow_back_ios_new',
  arrowDown: 'arrow_downward',
  arrowUp: 'arrow_upward',
  chevronRight: 'chevron_right',
  chevronDown: 'keyboard_arrow_down',
  chevronUp: 'keyboard_arrow_up',

  // ── Tabs ────────────────────────────────────────────────────────────────
  home: 'home',
  homeFilled: 'home',

  // ── Actions ─────────────────────────────────────────────────────────────
  plus: 'add',
  close: 'close',
  delete: 'delete',
  edit: 'edit',
  search: 'search',
  send: 'send',
  refresh: 'refresh',
  share: 'share',
  copy: 'content_copy',
  sort: 'sort',
  tune: 'tune',
  moreVert: 'more_vert',
  fileUpload: 'file_upload',
  logout: 'logout',

  // ── Communication ───────────────────────────────────────────────────────
  chat: 'chat_bubble',
  chatFilled: 'chat_bubble',
  messenger: 'messenger',
  call: 'call',
  callFilled: 'call',
  callMissed: 'call_missed',
  notification: 'notifications',
  notificationFilled: 'notifications',
  videoCam: 'videocam',
  videoCamOff: 'videocam_off',
  videoCamPlus: 'video_call',
  videoCamPlusFilled: 'video_call',
  mic: 'mic',
  micOff: 'mic_off',
  speaker: 'volume_up',
  speakerOff: 'volume_off',

  // ── Visibility ──────────────────────────────────────────────────────────
  eye: 'visibility',
  eyeOutlined: 'remove_red_eye',
  eyeOff: 'visibility_off',

  // ── People ──────────────────────────────────────────────────────────────
  person: 'person',
  personFilled: 'person',
  people: 'people',
  verified: 'verified',
  star: 'star',
  starOutlined: 'star',
  starRounded: 'star',
  rateReview: 'rate_review',

  // ── Status & feedback ───────────────────────────────────────────────────
  check: 'check',
  checkCircle: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
  help: 'help',
  hourglass: 'hourglass_top',

  // ── Finance ─────────────────────────────────────────────────────────────
  wallet: 'account_balance_wallet',
  walletFilled: 'account_balance_wallet',
  history: 'history',

  // ── Security & moderation ───────────────────────────────────────────────
  lockedOutline: 'lock',
  flag: 'flag',
  block: 'block',
  privacyTip: 'privacy_tip',

  // ── Form controls ───────────────────────────────────────────────────────
  radioButtonChecked: 'radio_button_checked',
  radioButtonOff: 'radio_button_unchecked',

  // ── Attachments & files ─────────────────────────────────────────────────
  attachFile: 'attach_file',
  photoLibrary: 'photo_library',
  insertDriveFile: 'insert_drive_file',
  download: 'download',
  openInNew: 'open_in_new',
  description: 'description',

  // ── Media controls ──────────────────────────────────────────────────────
  playArrow: 'play_arrow',
  pause: 'pause',
  stop: 'stop',
  fiberManualRecord: 'fiber_manual_record',

  // ── Misc ────────────────────────────────────────────────────────────────
  bolt: 'bolt',
  reply: 'reply',
  wifiOff: 'wifi_off',
  accessTime: 'schedule',
  doneAll: 'done_all',
  settings: 'settings',
  northWest: 'north_west',
  translate: 'translate',
  camera: 'photo_camera',
  support: 'support_agent',
  school: 'school',
  workOutline: 'work',

  // ════════════════════════════════════════════════════════════════════════
  // NOT from AppIcons.
  //
  // Two groups live here. (a) Prototype chrome — the status bar and the review
  // panel, which the real app never draws because the OS does. (b) Glyphs that
  // screens reach for as raw `Icons.x` rather than through AppIcons, collected
  // here so that no screen has to invent a ligature name.
  // ════════════════════════════════════════════════════════════════════════

  // (a) Prototype chrome
  menu: 'menu',
  chevronLeft: 'chevron_left',
  signalCellular: 'signal_cellular_alt',
  wifi: 'wifi',
  batteryFull: 'battery_full',
  lightMode: 'light_mode',
  darkMode: 'dark_mode',
  brightness: 'brightness_auto',

  // (b) Raw-Icons glyphs used by screens
  currencyRupee: 'currency_rupee',
  payment: 'payment',
  receipt: 'receipt_long',
  card: 'credit_card',
  trendingUp: 'trending_up',
  trendingDown: 'trending_down',
  shield: 'shield',
  screenshot: 'screenshot_monitor',
  ban: 'gpp_bad',
  checkbox: 'check_box',
  checkboxOutline: 'check_box_outline_blank',
  toggleOn: 'toggle_on',
  toggleOff: 'toggle_off',
  textFields: 'text_fields',
  link: 'link',
  cloudUpload: 'cloud_upload',
  folder: 'folder',
  stopCircle: 'stop_circle',
  graphicEq: 'graphic_eq',
  autoAwesome: 'auto_awesome',
  lightbulb: 'lightbulb',
  forward: 'forward',
  markChatRead: 'mark_chat_read',
  markChatUnread: 'mark_chat_unread',
  gift: 'card_giftcard',
  trophy: 'emoji_events',
  architecture: 'architecture',
  accountBalance: 'account_balance',
  apartment: 'apartment',
  medicalServices: 'medical_services',
  list: 'list_alt',
  grid: 'grid_view',
  showChart: 'show_chart',
  storefront: 'storefront',
  rocket: 'rocket_launch',
  smartphone: 'smartphone',
  bug: 'bug_report',
  palette: 'palette',
  code: 'code',
  key: 'vpn_key',
  dice: 'casino',
  crown: 'workspace_premium',
  handshake: 'handshake',
  waving: 'waving_hand',
  location: 'location_on',
  language: 'language',
  add: 'add',
  addCircle: 'add_circle',
  remove: 'remove',
  done: 'done',
  mail: 'mail',
  lock: 'lock',
  lockOpen: 'lock_open',
  visibility: 'visibility',
  play: 'play_arrow',
  gallery: 'photo_library',
  /**
   * The FILLED half of the pair above, and a divergence worth its own entry.
   *
   * `AppIcons.photoLibrary` is `Icons.photo_library_outlined` (an outline), but
   * `edit_profile_page.dart`'s photo sheet reaches past the icon set for a raw
   * `Icons.photo_library` (solid) in its Gallery row. Same ligature, different
   * FILL axis — so `gallery` and `galleryFilled` are one glyph told apart by
   * `FILLED_ICONS`, exactly like `home` / `homeFilled`.
   */
  galleryFilled: 'photo_library',
  image: 'image',
  /**
   * NOT one of the 87 AppIcons constants — `mentor_photo_viewer.dart` reaches
   * past the icon set for its failed-image fallback and uses
   * `Icons.broken_image_outlined` directly. It lives here anyway so every glyph
   * in the prototype still resolves through one map, with the divergence
   * recorded rather than silently normalised to `image`.
   */
  brokenImage: 'broken_image',
  file: 'description',
  pdf: 'picture_as_pdf',
  moreHoriz: 'more_horiz',
  expandMore: 'expand_more',
  expandLess: 'expand_less',
  account: 'account_circle',
  schedule: 'schedule',
  /**
   * `Icons.arrow_back_ios_new_rounded` — the ONLY back arrow in the app that is
   * not `AppIcons.arrowBack`. `blocked_users_page.dart` builds a raw `AppBar`
   * with a hand-made `IconButton` and reaches past the icon set for the iOS
   * chevron, at size 20 rather than the DS 24. It reads visibly narrower and
   * further from the title than every other back button, which is a thing a
   * reviewer will notice on that screen and nowhere else — so it is mapped
   * rather than normalised onto `arrowBack`.
   */
  arrowBackIos: 'arrow_back_ios_new',
  /**
   * The two full-screen blocked states in `core/lib/config/ui/` reach past
   * AppIcons for a raw `Icons.x_rounded` at size **64** — far larger than any
   * named size in the DS, and the only place either glyph appears:
   *
   *   maintenance_page.dart    → `Icons.construction_rounded`
   *   force_update_page.dart   → `Icons.system_update_rounded`
   *
   * Like `arrowBackIos`, they are mapped rather than folded onto a neighbour,
   * because a construction barrier and a refresh arrow are not interchangeable
   * and nothing else in the app draws either.
   */
  construction: 'construction',
  systemUpdate: 'system_update',
} as const;

export type IconName = keyof typeof icons;

/**
 * Constants that are the FILLED half of an outlined/filled pair in AppIcons.
 * AppIcon reads this to set the Material Symbols FILL axis. Kept separate from
 * `icons` so the name→ligature map stays a flat, greppable record.
 *
 * `star`, `starRounded`, `verified` and `checkCircle` are here because their
 * Flutter counterparts (`Icons.star`, `Icons.star_rounded`, `Icons.verified`,
 * `Icons.check_circle`) are solid glyphs — the outline in the name is a
 * Material Symbols convention, not the Flutter shape.
 */
export const FILLED_ICONS: ReadonlySet<IconName> = new Set<IconName>([
  'homeFilled',
  'chatFilled',
  'callFilled',
  'notificationFilled',
  'videoCamPlusFilled',
  'personFilled',
  'walletFilled',
  'galleryFilled',
  'star',
  'starRounded',
  'verified',
  'checkCircle',
  'radioButtonChecked',
]);
