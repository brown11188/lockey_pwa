export type Locale = "en" | "vi";

export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    done: string;
    next: string;
    skip: string;
    loading: string;
    saved: string;
    saving: string;
    edit: string;
    add: string;
    confirm: string;
  };

  // Bottom tabs
  tabs: {
    capture: string;
    gallery: string;
    stats: string;
    subscriptions: string;
  };

  // Categories
  categories: {
    food: string;
    shopping: string;
    transport: string;
    entertainment: string;
    health: string;
    housing: string;
    education: string;
    travel: string;
    work: string;
    gifts: string;
    bills: string;
    pets: string;
    other: string;
  };

  // Capture screen
  capture: {
    amount: string;
    category: string;
    noteCaption: string;
    notePlaceholder: string;
    dateTime: string;
    saveEntry: string;
    cameraLoading: string;
    cameraDenied: string;
    cameraNotReady: string;
    fillAmount: string;
    failedSave: string;
    noPhoto: string;
    selectDate: string;
    cancelExpense: string;
    cancelConfirmTitle: string;
    cancelConfirmDesc: string;
    cancelConfirmButton: string;
  };

  // Quick Add
  quickAdd: {
    title: string;
    takePhoto: string;
    quickAdd: string;
    addPhoto: string;
    enterAmount: string;
    saveButton: string;
    successToast: string;
  };

  // FAB
  fab: {
    takePhoto: string;
    quickAdd: string;
  };

  // Gallery screen
  gallery: {
    title: string;
    week: string;
    month: string;
    all: string;
    noEntries: string;
    noEntriesHint: string;
    historyCalendar: string;
    monthOverview: string;
    selectedDate: string;
    addEntryOnDate: string;
    noEntriesOnDate: string;
    noEntriesOnDateHint: string;
    daysTracked: string;
    entriesCount: string;
    monthTotal: string;
    peakDay: string;
    activeDays: string;
    highSpendDays: string;
    entryCountSuffix: string;
    deleteEntry: string;
    deleteConfirmTitle: string;
    deleteConfirmDesc: string;
  };

  // Stats screen
  stats: {
    title: string;
    weekly: string;
    monthly: string;
    thisWeek: string;
    thisMonth: string;
    topCategory: string;
    dailySpending: string;
    byCategory: string;
    entries: string;
    recentTransactions: string;
  };

  // Budget
  budget: {
    title: string;
    editLink: string;
    remaining: string;
    exceeded: string;
    exceededLabel: string;
    setBudget: string;
    setBudgetTitle: string;
    amountPlaceholder: string;
    applyTo: string;
    thisMonth: string;
    allMonths: string;
    noBudgets: string;
    noBudgetsHint: string;
    weekLabel: string;
    alertNear: string;
    alertExceeded: string;
    alertExceededTitle: string;
    alertExceededDesc: string;
    deleteBudget: string;
    deleteConfirm: string;
    saved: string;
  };

  // Subscriptions
  subscriptions: {
    title: string;
    totalLabel: string;
    perMonth: string;
    perYear: string;
    activeCount: string;
    upcomingRenewals: string;
    daysLeft: string;
    tomorrow: string;
    today: string;
    allSubscriptions: string;
    weekly: string;
    monthly: string;
    yearly: string;
    other: string;
    active: string;
    paused: string;
    addNew: string;
    editSubscription: string;
    serviceName: string;
    serviceNamePlaceholder: string;
    amount: string;
    cycle: string;
    nextRenewal: string;
    category: string;
    note: string;
    notePlaceholder: string;
    reminder: string;
    reminderBefore: string;
    reminderDays1: string;
    reminderDays3: string;
    reminderDays7: string;
    status: string;
    emptyTitle: string;
    emptyDesc: string;
    emptyButton: string;
    deleteTitle: string;
    deleteDesc: string;
    saved: string;
    deleted: string;
    notificationTitle: string;
    notificationBody: string;
    permissionDenied: string;
  };

  // Settings screen
  settings: {
    title: string;
    currency: string;
    currencyDesc: string;
    language: string;
    languageDesc: string;
    clearData: string;
    clearDataDesc: string;
    clearDataButton: string;
    clearConfirmTitle: string;
    clearConfirmDesc: string;
    clearConfirmButton: string;
    clearing: string;
    clearFailed: string;
    about: string;
    aboutDesc: string;
  };

  // Onboarding
  onboarding: {
    slide1Title: string;
    slide1Desc: string;
    slide2Title: string;
    slide2Desc: string;
    slide3Title: string;
    slide3Desc: string;
    getStarted: string;
  };

  // Date/time
  dateTime: {
    today: string;
    yesterday: string;
    time: string;
    months: string[];
    daysOfWeek: string[];
  };

  // OCR
  ocr: {
    scanning: string;
    autoFilled: string;
    cannotRead: string;
    subscriptionDetected: string;
    addToSubscriptions: string;
  };

  // Wrapped
  wrapped: {
    monthOf: string;
    totalSpending: string;
    onDays: string;
    entries: string;
    topCategory: string;
    youBurnedMostOn: string;
    ofTotal: string;
    biggestDay: string;
    dayYouSpentMost: string;
    inOneDay: string;
    vsLastMonth: string;
    comparedTo: string;
    increased: string;
    decreased: string;
    mainlyDueTo: string;
    funStat: string;
    ifYouDidntEatOut: string;
    youCouldSave: string;
    equivalentTo: string;
    shareYourMonth: string;
    shareButton: string;
    saveImage: string;
    dismiss: string;
    viewRecap: string;
    noData: string;
    noDataHint: string;
    slide: string;
  };

  // Streak & Gamification
  streak: {
    title: string;
    days: string;
    startToday: string;
    currentStreak: string;
    longestStreak: string;
    keepGoing: string;
    missedDay: string;
    milestones: {
      three: string;
      seven: string;
      fourteen: string;
      thirty: string;
      sixty: string;
      hundred: string;
    };
  };

  // Badges
  badges: {
    title: string;
    locked: string;
    earned: string;
    requirement: string;
    firstExpense: string;
    streak7: string;
    streak30: string;
    photos50: string;
    foodLover: string;
    traveler: string;
    gamer: string;
    disciplined: string;
    saver: string;
    level: string;
    xp: string;
    levels: {
      beginner: string;
      tracker: string;
      manager: string;
      expert: string;
      legend: string;
    };
  };

  // Auth
  auth: {
    login: string;
    register: string;
    resetPassword: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    newPassword: string;
    newPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    loginButton: string;
    registerButton: string;
    resetButton: string;
    loggingIn: string;
    registering: string;
    resetting: string;
    noAccount: string;
    haveAccount: string;
    forgotPassword: string;
    backToLogin: string;
    passwordMismatch: string;
    passwordMinLength: string;
    registerSuccess: string;
    resetSuccess: string;
    logout: string;
    loggingOut: string;
  };
}