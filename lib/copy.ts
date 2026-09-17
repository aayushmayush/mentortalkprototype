/**
 * The app's string table.
 *
 * Transcribed from the Flutter ARB files
 * (`mentee_app/lib/l10n/app_en.arb`, `core/lib/l10n/core_en.arb`) — the copy
 * here is the production copy, not invented placeholder text. Keeping it in one
 * flat object is deliberate: it mirrors the ARB shape, so when the locale
 * provider grows a real dictionary this file becomes the `en` entry rather than
 * something to unpick from twenty screens.
 *
 * Placeholders use `{name}` and are filled by `fill()` below, matching the
 * ARB/ICU-lite convention the app already uses (`otpSentMessage(phoneNumber)`).
 */

export const copy = {
  appTitle: 'MentorTalk',
  loading: 'Loading...',
  retry: 'Retry',
  cancel: 'Cancel',
  next: 'Next',
  save: 'Save',
  done: 'Done',
  close: 'Close',
  ok: 'OK',
  edit: 'Edit',
  reset: 'Reset',

  // ── Launch & auth ────────────────────────────────────────────────────────
  getStarted: 'Get Started',
  getStartedSubtitle:
    "Preparing for competitive exams? Connect with experienced mentors who've successfully navigated the same journey.",
  findYourPerfect: 'Find your perfect \n',
  mentor: 'MENTOR',
  enterYourPhoneNumber: 'Enter your phone number',
  phoneVerificationSubtitle:
    "We'll send a 6-digit code to verify your account.",
  phoneNumber: 'Phone Number',
  verify: 'Verify',
  verifyCode: 'Verify Code',
  enterOtp: 'Enter OTP',
  otpSentMessage: 'Enter the 6-digit verification code sent to {phoneNumber}.',
  didntGetCode: "Didn't get the code?",
  resendCode: 'Resend Code',
  resendCodeIn: 'Resend Code in ',
  phoneNumberRequired: 'Phone number is required',
  phoneNumberInvalidLength: 'Enter a valid 10-digit number',
  phoneNumberInvalidFormat: 'Enter a valid Indian mobile number',
  otpRequired: 'OTP is required',
  otpInvalidLength: 'Enter a valid 6-digit OTP',
  otpDigitsOnly: 'OTP must contain only digits',
  errorGeneric: 'Something went wrong. Please try again.',

  // ── Onboarding ───────────────────────────────────────────────────────────
  createProfile: 'Create Profile',
  basicInformation: 'Basic Information',
  basicInfoSubtitle:
    'Share your basic details to help mentors understand you better and connect more effectively.',
  personalInfo: 'Personal Info',
  fullName: 'Full Name',
  username: 'Username',
  nameRequired: 'Name is required',
  usernameRequired: 'Username is required',
  // NOTE: unlike every other string here, this one is NOT localised in the
  // Flutter source — `basic_info_page.dart` passes the literal
  // `label: 'Referral code (optional)'` and there is no ARB key for it. Kept in
  // the table so this file stays the single place to look, but it is a
  // transcription of a hardcoded string, not of a translation.
  referralCodeOptional: 'Referral code (optional)',
  chooseCategories: 'Choose Categories',
  chooseYourExam: 'What are you preparing for?',
  chooseYourExamSubtitle:
    "Tell us which exams you're preparing for so we can connect you with the right mentors.",
  selectExams: 'Select Exams',
  selectExamsSubtitle: "Select the exams you're preparing for.",
  selectAreasSubtitle: "Select the specific areas you're preparing for.",
  tapToSelectExams: 'Tap to select exams',
  categories: 'Categories',
  education: 'Education',
  addEducation: 'Add Education',
  addingEducation: 'Adding education...',
  updatingEducation: 'Updating education...',
  educationSubtitle:
    'This is optional but helps mentors understand your background.',
  educationPageSubtitle:
    'Adding your educational details helps mentors understand your background.',
  academicProfile: 'Academic Profile',
  institutionName: 'Institution / College',
  degree: 'Course / Level',
  fieldOfStudy: 'Field of Study',
  startYear: 'Start Year',
  endYear: 'End Year',
  institutionNameRequired: 'Institution / College *',
  degreeRequired: 'Course / Level *',
  addNew: '+ Add',
  continueLabel: 'Continue',
  skipAndFinish: 'Skip & Finish',
  finish: 'Finish',
  settingUpProfile: 'Setting up your profile...',
  onlyTakeAMoment: 'This will only take a moment',
  youAreAllSet: "You're all set!",
  welcomeToMentorTalk:
    'Welcome to MentorTalk. Your personalized learning experience starts here.',
  saving: 'Saving...',
  saveChanges: 'Save Changes',
  profileUpdated: 'Profile updated successfully',

  // ── Home & discovery ─────────────────────────────────────────────────────
  home: 'Home',
  chat: 'Chat',
  call: 'Call',
  account: 'Account',
  searchPlaceholder: 'Find your Mentor',
  searchForMentors: 'Search for mentors by name',
  searchMentors: 'Search mentors',
  recentSearches: 'Recent Searches',
  // From core_en.arb — the inbox card's timestamp formatter.
  yesterday: 'Yesterday',
  popularMentors: 'Popular Mentors',
  popular: 'Popular',
  viewAll: 'View All',
  mySessions: 'My Sessions',
  onlineNow: 'Online Now',
  noMentorsFound: 'No mentors found',
  noMentorsFoundFor: 'No mentors found for "{query}"',
  noResultsFound: 'No results found',
  nothingToShow: 'Nothing to show here',
  sortBy: 'Sort By',
  filtering: 'Filtering',
  apply: 'Apply',
  // The four sort labels. Note `SortOption` in `mentors_list_state.dart` also
  // carries a plain-English `label` field ('Rating: High to Low') that no widget
  // ever reads — every call site uses `localizedLabel()` instead. The ARB values
  // below are what actually renders, and they match that unused field anyway.
  sortRatingDesc: 'Rating: High to Low',
  sortSessionsDesc: 'Sessions: High to Low',
  sortPriceAsc: 'Price: Low to High',
  sortPriceDesc: 'Price: High to Low',
  loadMore: 'Load more',
  // The review author's fallback when the mentee has `show_name_in_reviews`
  // off. Hardcoded in `core/lib/review/ui/widgets/review_card.dart` — like
  // `ReviewsSummaryHeader`'s "$totalReviews reviews", which is also a literal.
  mentee: 'Mentee',
  // Also hardcoded in the two expandable-text widgets (`_ExpandableBio` and
  // `_ExpandableComment`), which are otherwise identical implementations.
  readMore: 'Read more',
  readLess: 'Read less',
  // NOTE: also not localised in Flutter. `referral_share_page.dart` passes
  // `title: 'Refer & Earn'` to `AppTopBar` as a literal, and the referral
  // feature's other strings are hardcoded the same way ('Loading your referral
  // code…', 'Could not load your referral code.'). Transcription, not
  // translation — same caveat as `referralCodeOptional`.
  referAndEarn: 'Refer & Earn',
  all: 'All',
  available: 'Available',
  ratePerMinute: '₹ {rate}/min',
  sessionCount: '{count} sessions',
  experienceYears: '{count} years',
  reviewCount: '{count} reviews',
  reviews: 'Reviews',
  noReviewsYet: 'No reviews yet',
  reviewsAppearAfterSessions: 'Your reviews will appear here after sessions',
  couldNotLoadReviews: 'Could not load reviews',
  noBioAvailable: 'No bio available',
  follow: 'Follow',
  following: 'Following',
  myFollowing: 'My following',
  noFollowingYet: "You haven't followed any mentors yet",
  relatedMentors: 'Related Mentors',
  about: 'About',
  myReviews: 'My Reviews',
  videoCall: 'Video Call',
  audioCall: 'Audio Call',
  notAvailable: 'Not available',
  mentorNoVideo: "This mentor doesn't accept video sessions",
  mentorUnavailable: 'Mentor is currently unavailable',
  mentorUnavailableTitle: 'Mentor unavailable',
  mentorDidntRespond: "The mentor didn't respond in time. Try again or choose another mentor.",
  report: 'Report',
  block: 'Block',
  blockUser: 'Block {name}?',
  blockUserMessage:
    "They won't appear in your search or chats. You can unblock them later from settings.",
  userBlocked: '{name} has been blocked',
  blockFailed: 'Failed to block user. Please try again.',
  reportSubmitted: "Report submitted. We'll review it within 24 hours.",
  reportFailed: 'Failed to submit report. Please try again.',

  // ── Report sheet (core l10n, `@@_SECTION_REPORT`) ────────────────────────
  // The reason labels must match the backend's accepted `reason` values; the
  // keys are the enum names in `report_sheet.dart`, values are the wire strings.
  reportUser: 'Report {userName}',
  reportReasonPrompt: 'Why are you reporting this user?',
  additionalDetailsOptional: 'Additional details (optional)',
  submitReport: 'Submit Report',
  reportInappropriateBehavior: 'Inappropriate Behavior',
  reportSpamScam: 'Spam / Scam',
  reportUnprofessionalConduct: 'Unprofessional Conduct',
  reportAbusiveLanguage: 'Abusive Language',
  reportHarassment: 'Harassment',
  reportOther: 'Other',

  // ── Session ──────────────────────────────────────────────────────────────
  inQueue: '#{position} in queue',
  waitingForMentor: 'Waiting for {name}…',
  insufficientBalance: 'Insufficient Balance',
  insufficientBalanceMessage:
    'Your balance is ₹{balance}. You need at least ₹{minimum} to start a session.',
  sessionCostMessage:
    'This session costs ₹{rate}/min. You need at least ₹{minRequired} for a 5-minute session.',
  rechargeWalletMessage:
    "You don't have enough balance to start this session. Please recharge your wallet.",
  // `core_en.arb`
  connecting: 'Connecting...',
  reconnecting: 'Reconnecting...',
  returnToCall: 'Return to call',
  returnToChat: 'Return to chat',
  endSessionTitle: 'End Session?',
  endSessionConfirmMentee:
    "Are you sure you want to end this session? You'll be charged for the time used.",
  endSessionButton: 'End Session',
  endCall: 'End Call',
  endButtonLabel: 'End',
  mute: 'Mute',
  unmute: 'Unmute',
  audioCallLabel: 'Audio Call',
  videoLabel: 'Video',
  speaker: 'Speaker',
  earpiece: 'Earpiece',
  waitingForUser: 'Waiting for {userName}...',
  speakerLabel: 'Speaker',
  cameraOn: 'Camera On',
  cameraOff: 'Camera Off',
  flipCamera: 'Flip',
  chatUnavailableDuringCall: 'Chat unavailable during call',
  contactInfoNotAllowed: 'Sharing contact information is not allowed in chat',
  noMessagesYet: 'No messages yet',
  requestingSession: 'Requesting session...',
  continueChat: 'Continue Chat',
  today: 'Today',
  typeAMessage: 'Type a message...',
  attachments: 'Attachments',
  quickReplies: 'Quick Replies',
  quickReplyHint: 'Type a quick reply...',
  switchToType: 'Switch to {type}?',
  switchRequestMessage: '{name} wants to switch to {type}.',
  switchRequestMessageWithRate:
    '{name} wants to switch to {type}.\nRate changes: ₹{oldRate} → ₹{newRate}/min',
  accept: 'Accept',
  decline: 'Decline',
  calling: 'Calling',
  videoCalling: 'Video calling',
  callingWaiting: '{type}... waiting for response',
  callDeclined: 'Call declined',
  howWasSession: 'How was your session?',
  rateSessionWith: 'Rate your session with {name}',
  shareExperience: 'Share your experience (optional)',
  postReview: 'Post a review',

  // ── Wallet ───────────────────────────────────────────────────────────────
  wallet: 'Wallet',
  addBalance: 'Add Balance',
  availableBalance: 'Available balance',
  transactionHistory: 'Transaction History',
  paymentLogs: 'Payment Logs',
  sessionLogs: 'Session Logs',
  orderHistory: 'Order History',
  loadingChats: 'Loading chats...',
  noChatsYet: 'No chats yet',
  chatsEmptyMessage:
    'Start a session with a mentor\nand your conversations will appear here',
  walletTopup: 'Wallet Top-up',
  sessionPayment: 'Session Payment',
  refund: 'Refund',
  cashback: 'Cashback',
  sessionWith: '{mode} with {name}',
  noTransactionsYet: 'No transactions yet',
  failedToLoadTransactions: 'Failed to load transactions',
  tapToRetry: 'Tap to retry',
  pleaseTryAgain: 'Please try again.',
  enterAmount: 'Enter amount',
  proceedToPay: 'Proceed to pay',
  minRechargeAmount: 'Minimum recharge amount is ₹30',
  maxRechargeAmount: 'Maximum amount is ₹10,000',
  paymentSuccessful: 'Payment successful! Balance: {balance}',
  paymentFailed: 'Payment failed: {error}',
  unknownError: 'Unknown error',
  paymentRecovered:
    'Your pending top-up of {balance} has been credited to your wallet',

  // ── Settings & account ───────────────────────────────────────────────────
  settings: 'Settings',
  /**
   * The four section labels on `/settings`. `privacy` and `support` are
   * **hardcoded literals in the Dart** (`_SectionLabel(label: 'Privacy')` /
   * `'Support'`), not l10n keys, while the two either side of them — `appearance`,
   * `language`, `about` — do come from `context.l10n`. That inconsistency is the
   * source's, so the strings are the same either way; only their provenance
   * differs, and it is recorded here rather than "tidied".
   */
  privacy: 'Privacy',
  /**
   * `about` already exists above (the mentor profile's About tab uses the same
   * word), so the settings section label reads from that one key rather than a
   * second copy of the string.
   */
  delete: 'Delete',
  /**
   * `AppInfoPage`'s two status lines. `latestVersionInstalled` is the
   * up-to-date branch; the other is shared with the update prompt.
   */
  version: 'Version',
  latestVersionInstalled: 'The latest version is already installed.',
  updateAvailableDescription:
    'A new version is available with improvements and bug fixes.',
  updateNow: 'Update Now',
  later: 'Later',

  // ── Blocking states (core/lib/config/ui) ─────────────────────────────────
  underMaintenance: 'Under Maintenance',
  maintenanceDefaultMessage:
    "We're upgrading our servers. Please try again shortly.",
  updateRequired: 'Update Required',
  updateAvailable: 'Update Available',
  updateRequiredDescription:
    'A new version is required to continue using MentorTalk.',

  // ── Privacy settings (five mentee-controlled toggles) ────────────────────
  privacyShowNameTitle: 'Show my name in reviews',
  privacyShowNameSubtitle: "When off, reviews you leave appear as 'Mentee'.",
  privacyChatAccessTitle: 'Let mentors see past chats',
  privacyChatAccessSubtitle:
    'When off, mentors only see system messages from past sessions. Active sessions are unaffected.',
  privacyDownloadAccessTitle: 'Let mentors download media',
  privacyDownloadAccessSubtitle:
    'When off, mentors cannot download images, audio, or files you sent in past sessions.',
  privacyBlockScreenshotsTitle: 'Block screenshots in chat',
  privacyBlockScreenshotsSubtitle:
    "Mentors won't be able to take screenshots while viewing your chat.",
  privacyBlockCallRecordingTitle: 'Block screen recording in calls',
  privacyBlockCallRecordingSubtitle:
    "Mentors won't be able to screen-record during audio or video calls with you.",
  privacyUpdateError: "Couldn't update — please try again.",

  // ── Support chat (core/lib/support) ──────────────────────────────────────
  supportTitle: 'MentorTalk Support',
  supportSenderLabel: 'MentorTalk Support',
  supportEmptyTitle: 'How can we help?',
  supportEmptySubtitle: "Send us a message and we'll get back to you.",

  // ── Free chat offer ──────────────────────────────────────────────────────
  freeChatHeroTitle: 'Your first chat is free!',
  freeChatHeroSubtitle: 'Try a free chat with any mentor.',
  startFreeChat: 'Start a Free Chat',
  freeChatAlreadyUsed: "You've already used your free chat.",
  freeChatFeatureDisabled:
    'Free chat is not available right now. Please try again later.',
  freeChatNoCategories:
    'Choose your interests first to start a free chat.',
  freeChatNoMentors: 'No mentors available right now. Please try again later.',
  freeChatSessionExpired: 'Your session has expired. Please log in again.',
  freeChatSlowNetwork: 'Slow or no internet connection. Please try again.',

  // ── Delete account (core/lib/auth/ui/widgets/delete_account_screen.dart) ──
  deleteAccountTitle: 'Delete Account',
  deleteAccountConfirmTitle: 'Delete Account?',
  deleteAccountConfirmMessage:
    'This action is permanent and will erase your data, including wallet balance.',
  deleteAccountConfirmButton: 'Delete',
  deleteAccountCancelButton: 'Go Back',
  deleteAccountSuccessGeneric:
    'Your account has been scheduled for deletion.',
  deleteAccountSuccessWithDate:
    'Your account will be deleted on {date}. Log in within 30 days to cancel.',
  deleteAccountCannotDeleteTitle: 'Cannot Delete Account',
  deleteAccountWarningTitle: 'Warning',
  deleteAccountWarningMessage:
    'This action cannot be undone after 30 days.',
  deleteAccountWhatTitle: 'What will be deleted',
  deleteAccountBulletProfile:
    'Your profile, photos, and bio will be permanently deleted',
  deleteAccountBulletSessions:
    'Your session history and chat messages will be removed',
  deleteAccountBulletEducation: 'Your education records will be deleted',
  deleteAccountBulletSupport: 'Your support chat history will be deleted',
  deleteAccountBulletMentorDiscovery:
    'Your profile will be removed from mentor discovery',
  deleteAccountMentorPendingEarnings:
    'You have {amount} in pending earnings. This will be deposited to your bank account on the next payout cycle.',
  deleteAccountMenteeWalletWarning:
    'You have {amount} in your wallet. This balance cannot be refunded and will be permanently lost.',
  deleteAccountGracePeriodTitle: 'Grace period',
  deleteAccountGracePeriodMessage:
    'You can cancel within 30 days by logging back in. After that, deletion is permanent.',
  deleteAccountConfirmCheckbox: 'I understand and want to continue',
  deleteAccountButton: 'Delete My Account',
  // `AppModal.showConfirm(cancelLabel: '')` on the conflict branch — the source
  // passes an EMPTY cancel label, which the DS renders as a single-action
  // dialog. The button therefore says "OK" rather than "Cancel".
  deleteAccountOkButton: 'OK',
  deleteAccountGenericError: 'Something went wrong. Please try again.',

  // ── Edit profile ─────────────────────────────────────────────────────────
  removePhotoTitle: 'Remove profile photo?',
  removePhotoMessage: 'Your profile will show a default avatar.',
  remove: 'Remove',
  deleteEducationTitle: 'Delete education?',
  deleteEducationMessage: 'Remove "{name}" from your education list?',
  // Hardcoded in `edit_profile_page.dart` — like `referralCodeOptional`, there
  // is no ARB key for it. Transcribed, not translated.
  deletePhoto: 'Delete photo',
  // The bloc's four write failures. All four are literal strings in
  // `edit_profile_bloc.dart`, not l10n lookups.
  failedToSaveCategories: 'Failed to save categories',
  failedToAddEducation: 'Failed to add education',
  failedToUpdateEducation: 'Failed to update education',
  failedToDeleteEducation: 'Failed to delete education',
  // Hardcoded in `add_education_page.dart`, same situation as `deletePhoto`.
  editEducation: 'Edit Education',

  // ── Settings & account (continued) ───────────────────────────────────────
  blockedUsers: 'Blocked Users',
  noBlockedUsers: 'No blocked users',
  unblock: 'Unblock',
  unblockUser: 'Unblock {name}?',
  unblockUserMessage:
    'They will be able to appear in your search and chats again.',
  userUnblocked: '{name} has been unblocked',
  helpAndSupport: 'Help & Support',
  helpCenter: 'Help Center',
  contactUs: 'Contact Us',
  faq: 'FAQ',
  support: 'Support',
  privacyPolicy: 'Privacy Policy',
  termsAndConditions: 'Terms and Conditions',
  appInfo: 'App Info',
  appInfoMessage: 'Version {version}\n© 2026 MentorTalk.',
  editProfile: 'Edit Profile',
  logout: 'Logout',
  logoutMessage: 'You will be logged out of your account.',
  goBack: 'Go Back',
  deleteAccount: 'Delete Account?',
  deleteAccountMessage:
    'This will permanently delete your account and all associated data. This action cannot be undone.',
  manageYourPrivacy: 'Manage your privacy',
  language: 'Language',
  english: 'English',
  hindi: 'हिन्दी',
  appearance: 'Appearance',
  systemDefault: 'System default',
  light: 'Light',
  dark: 'Dark',
  camera: 'Camera',
  gallery: 'Gallery',
  phone: 'Phone',
  gender: 'Gender',
  male: 'Male',
  female: 'Female',

  // ── Network ──────────────────────────────────────────────────────────────
  noInternet: 'No internet connection',
  noInternetConnection: 'No internet connection',
  checkConnectionAndRetry: 'Check your connection and try again',
  backOnline: 'Back online',
  // `core_en.arb` has both: the bare heading used by AppErrorView, and the
  // full sentence used by inline form failures.
  somethingWentWrongBare: 'Something went wrong',
  somethingWentWrongFull: 'Something went wrong. Please try again.',

  // ── Ban page (core_en.arb) ───────────────────────────────────────────────
  accountSuspended: 'Account Suspended',
  accountSuspendedDefaultReason:
    'Your account has been suspended due to a violation of our community guidelines.',
  banContactSupportMessage:
    'If you believe this is a mistake, please contact our support team.',
  contactSupport: 'Contact Support',
} as const;

export type CopyKey = keyof typeof copy;

/**
 * Fill `{placeholder}` slots. Deliberately tiny — the app's ARB messages only
 * ever use simple named substitution, so pulling in an ICU library would be
 * weight without behaviour.
 */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
