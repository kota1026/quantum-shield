/**
 * Navigation Flow Definitions
 *
 * この設定ファイルは NAVIGATION_FLOW_SPEC.md と同期させること。
 * 各画面のボタン/リンクと遷移先を定義し、E2Eテストで検証する。
 */

export type NavigationType =
  | 'page' // ページ遷移
  | 'modal' // モーダルを開く
  | 'drawer' // ドロワーを開く
  | 'scroll' // ページ内スクロール
  | 'external' // 外部リンク
  | 'action' // その場で処理
  | 'copy'; // クリップボードにコピー

export interface NavigationItem {
  /** 要素の説明（テスト名に使用） */
  description: string;
  /** Playwrightセレクター */
  selector: string;
  /** 遷移タイプ */
  type: NavigationType;
  /** 遷移先（typeに応じた値） */
  destination: string;
  /** 前提条件（オプション） */
  precondition?: {
    /** 先に実行するアクション */
    action?: string;
    /** 待機するセレクター */
    waitFor?: string;
  };
  /** モバイルのみ/デスクトップのみ */
  viewport?: 'mobile' | 'desktop';
}

export interface ScreenNavigation {
  /** 画面パス */
  path: string;
  /** ナビゲーション項目 */
  items: NavigationItem[];
}

export interface AppNavigation {
  [screenName: string]: ScreenNavigation;
}

// =============================================================================
// Consumer App Navigation Flows
// =============================================================================

export const consumerNavigation: AppNavigation = {
  landing: {
    path: '/consumer/landing',
    items: [
      {
        description: 'Hero CTA → onboarding',
        selector: 'button:has-text("今すぐ無料で始める"), button:has-text("Get Started for Free")',
        type: 'page',
        destination: '/consumer/onboarding',
      },
      {
        description: '詳しく見る → scroll to how-it-works',
        selector: 'a:has-text("詳しく見る"), a:has-text("Learn More")',
        type: 'scroll',
        destination: '#how-it-works',
      },
      {
        description: 'Footer 利用規約 → terms',
        selector: 'footer >> a:has-text("利用規約"), footer >> a:has-text("Terms")',
        type: 'page',
        destination: '/consumer/terms',
      },
      {
        description: 'Footer プライバシー → privacy',
        selector: 'footer >> a:has-text("プライバシー"), footer >> a:has-text("Privacy")',
        type: 'page',
        destination: '/consumer/privacy',
      },
    ],
  },

  dashboard: {
    path: '/consumer/dashboard',
    items: [
      // Navigation
      {
        description: 'Nav Lock → lock',
        selector: 'nav >> a:has-text("Lock"), nav >> a:has-text("ロック")',
        type: 'page',
        destination: '/consumer/lock',
      },
      {
        description: 'Nav Unlock → unlock',
        selector: 'nav >> a:has-text("Unlock"), nav >> a:has-text("アンロック")',
        type: 'page',
        destination: '/consumer/unlock',
      },
      {
        description: 'Nav History → history',
        selector: 'nav >> a:has-text("History"), nav >> a:has-text("履歴")',
        type: 'page',
        destination: '/consumer/history',
      },
      // StatCards
      {
        description: 'StatCard ロック中 → history',
        selector: '[aria-label*="ロック中"], [aria-label*="Total Locked"]',
        type: 'page',
        destination: '/consumer/history',
      },
      {
        description: 'StatCard 利用可能 → unlock',
        selector: '[aria-label*="利用可能"], [aria-label*="Available"]',
        type: 'page',
        destination: '/consumer/unlock',
      },
      {
        description: 'StatCard アンロック待ち → unlock',
        selector: '[aria-label*="アンロック待ち"], [aria-label*="Pending Unlock"]',
        type: 'page',
        destination: '/consumer/unlock',
      },
      {
        description: 'StatCard 取引数 → history',
        selector: '[aria-label*="取引数"], [aria-label*="Transactions"]',
        type: 'page',
        destination: '/consumer/history',
      },
      // Wallet
      {
        description: 'Wallet button → modal',
        selector: 'button[aria-label*="Wallet"], button:has-text("0x")',
        type: 'modal',
        destination: 'wallet',
      },
      // Recent Activity
      {
        description: 'すべての履歴を見る → history',
        selector: 'a:has-text("すべての履歴を見る"), a:has-text("View All")',
        type: 'page',
        destination: '/consumer/history',
      },
      // Lock Modal Flow
      {
        description: 'ロックボタン → lock confirm modal',
        selector: 'button:has-text("Dilithium署名"), button:has-text("Lock Assets")',
        type: 'modal',
        destination: 'lock-confirm',
        precondition: {
          action: 'fill >> input#lockAmount >> 1.0',
        },
      },
      // Mobile Navigation
      {
        description: 'Mobile Nav ダッシュボード → dashboard',
        selector: 'nav[aria-label*="Mobile"] >> a[href*="dashboard"]',
        type: 'page',
        destination: '/consumer/dashboard',
        viewport: 'mobile',
      },
      {
        description: 'Mobile Nav ロック → lock',
        selector: 'nav[aria-label*="Mobile"] >> a[href*="lock"]',
        type: 'page',
        destination: '/consumer/lock',
        viewport: 'mobile',
      },
    ],
  },

  lock: {
    path: '/consumer/lock',
    items: [
      {
        description: '戻る → dashboard',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: '確認して進む → lock/confirm',
        selector: 'button:has-text("確認"), button:has-text("Continue")',
        type: 'page',
        destination: '/consumer/lock/confirm',
        precondition: {
          action: 'fill >> input >> 1.0',
        },
      },
    ],
  },

  'lock/processing': {
    path: '/consumer/lock/processing',
    items: [
      // Processing画面は通常自動遷移するため、キャンセルのみテスト
      {
        description: 'キャンセル → modal',
        selector: 'button:has-text("キャンセル"), button:has-text("Cancel")',
        type: 'modal',
        destination: 'cancel-confirm',
      },
    ],
  },

  'lock/success': {
    path: '/consumer/lock/success',
    items: [
      {
        description: 'ダッシュボードに戻る → dashboard',
        selector: 'button:has-text("ダッシュボード"), button:has-text("Dashboard")',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: '続けてロック → lock',
        selector: 'button:has-text("続けて"), button:has-text("Lock More")',
        type: 'page',
        destination: '/consumer/lock',
      },
    ],
  },

  unlock: {
    path: '/consumer/unlock',
    items: [
      {
        description: '戻る → dashboard',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: '緊急アンロック → emergency-unlock',
        selector: 'a:has-text("緊急"), a:has-text("Emergency")',
        type: 'page',
        destination: '/consumer/emergency',
      },
    ],
  },

  history: {
    path: '/consumer/history',
    items: [
      {
        description: '戻る → dashboard',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: '取引行クリック → history detail',
        selector: 'tr[data-tx-id], .transaction-row, [role="listitem"] >> a',
        type: 'page',
        destination: '/consumer/history/',
      },
    ],
  },

  settings: {
    path: '/consumer/settings',
    items: [
      {
        description: '戻る → dashboard',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: 'セキュリティ → security',
        selector: 'a:has-text("セキュリティ"), a:has-text("Security")',
        type: 'page',
        destination: '/consumer/security',
      },
      {
        description: '鍵管理 → key-management',
        selector: 'a:has-text("鍵管理"), a:has-text("Key Management")',
        type: 'page',
        destination: '/consumer/key-management',
      },
    ],
  },

  help: {
    path: '/consumer/help',
    items: [
      {
        description: '戻る → dashboard',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/dashboard',
      },
      {
        description: 'お問い合わせ → contact',
        selector: 'a:has-text("お問い合わせ"), a:has-text("Contact")',
        type: 'page',
        destination: '/consumer/contact',
      },
    ],
  },

  onboarding: {
    path: '/consumer/onboarding',
    items: [
      {
        description: '戻る → landing',
        selector: 'a[aria-label*="戻る"], button[aria-label*="Back"]',
        type: 'page',
        destination: '/consumer/landing',
      },
      {
        description: 'スキップ → wallet-connect',
        selector: 'button:has-text("スキップ"), button:has-text("Skip")',
        type: 'page',
        destination: '/consumer/wallet-connect',
      },
    ],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 指定したアプリのナビゲーション定義を取得
 */
export function getAppNavigation(app: 'consumer' | 'enterprise' | 'admin'): AppNavigation {
  switch (app) {
    case 'consumer':
      return consumerNavigation;
    // 他のアプリは後で追加
    default:
      return consumerNavigation;
  }
}

/**
 * 全てのナビゲーション項目をフラットなリストとして取得
 */
export function getAllNavigationItems(
  navigation: AppNavigation
): Array<{ screen: string; item: NavigationItem }> {
  const items: Array<{ screen: string; item: NavigationItem }> = [];

  for (const [screenName, screenNav] of Object.entries(navigation)) {
    for (const item of screenNav.items) {
      items.push({ screen: screenName, item });
    }
  }

  return items;
}
