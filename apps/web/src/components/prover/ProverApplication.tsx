'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Shield,
  Clock,
  Zap,
  Lock,
  Building,
  Building2,
  Globe,
  Mail,
  FileText,
  AlertTriangle,
  Ticket,
  CheckCircle2,
  Headphones,
  Server,
  Gift,
  Wallet,
  Coins,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVerifyInvitation, useRegisterProver } from '@/hooks/prover';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

// Application type: public or enterprise (via invitation)
type ApplicationType = 'public' | 'enterprise';

// Fallback invitation data (used when API is unavailable)
const FALLBACK_INVITATION = {
  code: 'ACME-2026-PROVER',
  operatorName: 'ACME Corporation',
  plan: 'Enterprise Plus',
  expiresAt: '2026-03-31',
  benefits: {
    managedInfrastructure: true,
    dedicatedSupport: true,
    slaGuarantee: '99.9%',
    minRevenue: '24 ETH/month',
  },
};

interface FormData {
  // Step 1: Basic Info
  organizationName: string;
  country: string;
  website: string;
  contactEmail: string;
  validatorExperience: string;
  // Step 2: Technical
  hsmProvider: string;
  infrastructureLocation: string;
  hsmConfirmed: boolean;
  uptimeConfirmed: boolean;
  responseTimeConfirmed: boolean;
  multisigConfirmed: boolean;
  // Step 3: Legal & KYB
  businessRegistrationNumber: string;
  documentUploaded: boolean;
  agreeTerms: boolean;
  agreeKyb: boolean;
  agreeStake: boolean;
  // Step 4: Stake
  stakeAmount: string;
  walletConnected: boolean;
  stakeConfirmed: boolean;
}

const initialFormData: FormData = {
  organizationName: '',
  country: '',
  website: '',
  contactEmail: '',
  validatorExperience: '',
  hsmProvider: '',
  infrastructureLocation: '',
  hsmConfirmed: false,
  uptimeConfirmed: false,
  responseTimeConfirmed: false,
  multisigConfirmed: false,
  businessRegistrationNumber: '',
  documentUploaded: false,
  agreeTerms: false,
  agreeKyb: false,
  agreeStake: false,
  stakeAmount: '',
  walletConnected: false,
  stakeConfirmed: false,
};

// Invitation data (use fallback for demo)

export function ProverApplication() {
  const t = useTranslations('prover');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicationType, setApplicationType] = useState<ApplicationType>('public');
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationVerified, setInvitationVerified] = useState(false);
  const [invitationError, setInvitationError] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Wallet connection via wagmi/RainbowKit
  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  // Prover registration mutation
  const registerProver = useRegisterProver();

  // Sync wallet connection state with form
  useEffect(() => {
    if (isConnected && !formData.walletConnected) {
      updateFormData('walletConnected', true);
    } else if (!isConnected && formData.walletConnected) {
      updateFormData('walletConnected', false);
    }
  }, [isConnected, formData.walletConnected]);

  // Check for invitation code in URL
  useEffect(() => {
    const code = searchParams.get('invite');
    if (code) {
      setApplicationType('enterprise');
      setInvitationCode(code);
      // Auto-verify if matches mock
      if (code === FALLBACK_INVITATION.code) {
        setInvitationVerified(true);
      }
    }
  }, [searchParams]);

  const verifyInvitation = () => {
    // Mock verification - in production, this would call an API
    if (invitationCode === FALLBACK_INVITATION.code) {
      setInvitationVerified(true);
      setInvitationError(false);
    } else {
      setInvitationError(true);
      setInvitationVerified(false);
    }
  };

  const steps = [
    { number: 1, label: t('application.steps.basicInfo') },
    { number: 2, label: t('application.steps.technical') },
    { number: 3, label: t('application.steps.legal') },
    { number: 4, label: t('application.steps.stake') },
    { number: 5, label: t('application.steps.review') },
  ];

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation functions for each step
  const isStep1Valid = () => {
    return (
      formData.organizationName.trim() !== '' &&
      formData.country !== '' &&
      formData.contactEmail.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    );
  };

  const isStep2Valid = () => {
    return (
      formData.hsmConfirmed &&
      formData.uptimeConfirmed &&
      formData.responseTimeConfirmed &&
      formData.multisigConfirmed
    );
  };

  const isStep3Valid = () => {
    return (
      formData.businessRegistrationNumber.trim() !== '' &&
      formData.agreeTerms &&
      formData.agreeKyb &&
      formData.agreeStake
    );
  };

  const isStep4Valid = () => {
    return (
      formData.stakeAmount !== '' &&
      formData.walletConnected &&
      formData.stakeConfirmed
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid();
      case 2:
        return isStep2Valid();
      case 3:
        return isStep3Valid();
      case 4:
        return isStep4Valid();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      setSubmitError(t('application.errors.walletNotConnected'));
      return;
    }

    setSubmitError(null);

    try {
      // Generate placeholder values for HSM attestation and multisig proof
      // In production, these would come from actual HSM and multisig setup
      const hsmAttestation = `HSM_ATTESTATION_${Date.now()}_${address}`;
      const multisigProof = `MULTISIG_PROOF_${Date.now()}_${address}`;

      // Generate placeholder SPHINCS+ public key (in production, this comes from HSM)
      // SPHINCS+-128s public key is 32 bytes
      const sphincsPubkey = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      const result = await registerProver.mutateAsync({
        operatorAddr: address,
        sphincsPubkey,
        stakeAmount: `${formData.stakeAmount}000000000000000000`, // Convert ETH to wei
        hsmAttestation,
        multisigProof,
        endpoint: formData.website || `https://prover.${formData.organizationName.toLowerCase().replace(/\s+/g, '-')}.io`,
      });

      setApplicationId(result.prover_id);
      setIsSubmitted(true);

      // Redirect to application status page after short delay
      setTimeout(() => {
        router.push(`/${locale}/prover/application-status?id=${result.prover_id}`);
      }, 3000);
    } catch (error) {
      console.error('Prover registration error:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : t('application.errors.submissionFailed')
      );
    }
  };

  // Full ISO 3166-1 country list
  const allCountries = [
    { value: 'AF', ja: 'アフガニスタン', en: 'Afghanistan' },
    { value: 'AL', ja: 'アルバニア', en: 'Albania' },
    { value: 'DZ', ja: 'アルジェリア', en: 'Algeria' },
    { value: 'AD', ja: 'アンドラ', en: 'Andorra' },
    { value: 'AO', ja: 'アンゴラ', en: 'Angola' },
    { value: 'AG', ja: 'アンティグア・バーブーダ', en: 'Antigua and Barbuda' },
    { value: 'AR', ja: 'アルゼンチン', en: 'Argentina' },
    { value: 'AM', ja: 'アルメニア', en: 'Armenia' },
    { value: 'AU', ja: 'オーストラリア', en: 'Australia' },
    { value: 'AT', ja: 'オーストリア', en: 'Austria' },
    { value: 'AZ', ja: 'アゼルバイジャン', en: 'Azerbaijan' },
    { value: 'BS', ja: 'バハマ', en: 'Bahamas' },
    { value: 'BH', ja: 'バーレーン', en: 'Bahrain' },
    { value: 'BD', ja: 'バングラデシュ', en: 'Bangladesh' },
    { value: 'BB', ja: 'バルバドス', en: 'Barbados' },
    { value: 'BY', ja: 'ベラルーシ', en: 'Belarus' },
    { value: 'BE', ja: 'ベルギー', en: 'Belgium' },
    { value: 'BZ', ja: 'ベリーズ', en: 'Belize' },
    { value: 'BJ', ja: 'ベナン', en: 'Benin' },
    { value: 'BT', ja: 'ブータン', en: 'Bhutan' },
    { value: 'BO', ja: 'ボリビア', en: 'Bolivia' },
    { value: 'BA', ja: 'ボスニア・ヘルツェゴビナ', en: 'Bosnia and Herzegovina' },
    { value: 'BW', ja: 'ボツワナ', en: 'Botswana' },
    { value: 'BR', ja: 'ブラジル', en: 'Brazil' },
    { value: 'BN', ja: 'ブルネイ', en: 'Brunei' },
    { value: 'BG', ja: 'ブルガリア', en: 'Bulgaria' },
    { value: 'BF', ja: 'ブルキナファソ', en: 'Burkina Faso' },
    { value: 'BI', ja: 'ブルンジ', en: 'Burundi' },
    { value: 'CV', ja: 'カーボベルデ', en: 'Cabo Verde' },
    { value: 'KH', ja: 'カンボジア', en: 'Cambodia' },
    { value: 'CM', ja: 'カメルーン', en: 'Cameroon' },
    { value: 'CA', ja: 'カナダ', en: 'Canada' },
    { value: 'CF', ja: '中央アフリカ', en: 'Central African Republic' },
    { value: 'TD', ja: 'チャド', en: 'Chad' },
    { value: 'CL', ja: 'チリ', en: 'Chile' },
    { value: 'CN', ja: '中国', en: 'China' },
    { value: 'CO', ja: 'コロンビア', en: 'Colombia' },
    { value: 'KM', ja: 'コモロ', en: 'Comoros' },
    { value: 'CG', ja: 'コンゴ共和国', en: 'Congo' },
    { value: 'CR', ja: 'コスタリカ', en: 'Costa Rica' },
    { value: 'HR', ja: 'クロアチア', en: 'Croatia' },
    { value: 'CU', ja: 'キューバ', en: 'Cuba' },
    { value: 'CY', ja: 'キプロス', en: 'Cyprus' },
    { value: 'CZ', ja: 'チェコ', en: 'Czechia' },
    { value: 'DK', ja: 'デンマーク', en: 'Denmark' },
    { value: 'DJ', ja: 'ジブチ', en: 'Djibouti' },
    { value: 'DM', ja: 'ドミニカ国', en: 'Dominica' },
    { value: 'DO', ja: 'ドミニカ共和国', en: 'Dominican Republic' },
    { value: 'EC', ja: 'エクアドル', en: 'Ecuador' },
    { value: 'EG', ja: 'エジプト', en: 'Egypt' },
    { value: 'SV', ja: 'エルサルバドル', en: 'El Salvador' },
    { value: 'GQ', ja: '赤道ギニア', en: 'Equatorial Guinea' },
    { value: 'ER', ja: 'エリトリア', en: 'Eritrea' },
    { value: 'EE', ja: 'エストニア', en: 'Estonia' },
    { value: 'SZ', ja: 'エスワティニ', en: 'Eswatini' },
    { value: 'ET', ja: 'エチオピア', en: 'Ethiopia' },
    { value: 'FJ', ja: 'フィジー', en: 'Fiji' },
    { value: 'FI', ja: 'フィンランド', en: 'Finland' },
    { value: 'FR', ja: 'フランス', en: 'France' },
    { value: 'GA', ja: 'ガボン', en: 'Gabon' },
    { value: 'GM', ja: 'ガンビア', en: 'Gambia' },
    { value: 'GE', ja: 'ジョージア', en: 'Georgia' },
    { value: 'DE', ja: 'ドイツ', en: 'Germany' },
    { value: 'GH', ja: 'ガーナ', en: 'Ghana' },
    { value: 'GR', ja: 'ギリシャ', en: 'Greece' },
    { value: 'GD', ja: 'グレナダ', en: 'Grenada' },
    { value: 'GT', ja: 'グアテマラ', en: 'Guatemala' },
    { value: 'GN', ja: 'ギニア', en: 'Guinea' },
    { value: 'GW', ja: 'ギニアビサウ', en: 'Guinea-Bissau' },
    { value: 'GY', ja: 'ガイアナ', en: 'Guyana' },
    { value: 'HT', ja: 'ハイチ', en: 'Haiti' },
    { value: 'HN', ja: 'ホンジュラス', en: 'Honduras' },
    { value: 'HK', ja: '香港', en: 'Hong Kong' },
    { value: 'HU', ja: 'ハンガリー', en: 'Hungary' },
    { value: 'IS', ja: 'アイスランド', en: 'Iceland' },
    { value: 'IN', ja: 'インド', en: 'India' },
    { value: 'ID', ja: 'インドネシア', en: 'Indonesia' },
    { value: 'IR', ja: 'イラン', en: 'Iran' },
    { value: 'IQ', ja: 'イラク', en: 'Iraq' },
    { value: 'IE', ja: 'アイルランド', en: 'Ireland' },
    { value: 'IL', ja: 'イスラエル', en: 'Israel' },
    { value: 'IT', ja: 'イタリア', en: 'Italy' },
    { value: 'JM', ja: 'ジャマイカ', en: 'Jamaica' },
    { value: 'JP', ja: '日本', en: 'Japan' },
    { value: 'JO', ja: 'ヨルダン', en: 'Jordan' },
    { value: 'KZ', ja: 'カザフスタン', en: 'Kazakhstan' },
    { value: 'KE', ja: 'ケニア', en: 'Kenya' },
    { value: 'KI', ja: 'キリバス', en: 'Kiribati' },
    { value: 'KP', ja: '北朝鮮', en: 'North Korea' },
    { value: 'KR', ja: '韓国', en: 'South Korea' },
    { value: 'KW', ja: 'クウェート', en: 'Kuwait' },
    { value: 'KG', ja: 'キルギス', en: 'Kyrgyzstan' },
    { value: 'LA', ja: 'ラオス', en: 'Laos' },
    { value: 'LV', ja: 'ラトビア', en: 'Latvia' },
    { value: 'LB', ja: 'レバノン', en: 'Lebanon' },
    { value: 'LS', ja: 'レソト', en: 'Lesotho' },
    { value: 'LR', ja: 'リベリア', en: 'Liberia' },
    { value: 'LY', ja: 'リビア', en: 'Libya' },
    { value: 'LI', ja: 'リヒテンシュタイン', en: 'Liechtenstein' },
    { value: 'LT', ja: 'リトアニア', en: 'Lithuania' },
    { value: 'LU', ja: 'ルクセンブルク', en: 'Luxembourg' },
    { value: 'MG', ja: 'マダガスカル', en: 'Madagascar' },
    { value: 'MW', ja: 'マラウイ', en: 'Malawi' },
    { value: 'MY', ja: 'マレーシア', en: 'Malaysia' },
    { value: 'MV', ja: 'モルディブ', en: 'Maldives' },
    { value: 'ML', ja: 'マリ', en: 'Mali' },
    { value: 'MT', ja: 'マルタ', en: 'Malta' },
    { value: 'MH', ja: 'マーシャル諸島', en: 'Marshall Islands' },
    { value: 'MR', ja: 'モーリタニア', en: 'Mauritania' },
    { value: 'MU', ja: 'モーリシャス', en: 'Mauritius' },
    { value: 'MX', ja: 'メキシコ', en: 'Mexico' },
    { value: 'FM', ja: 'ミクロネシア', en: 'Micronesia' },
    { value: 'MD', ja: 'モルドバ', en: 'Moldova' },
    { value: 'MC', ja: 'モナコ', en: 'Monaco' },
    { value: 'MN', ja: 'モンゴル', en: 'Mongolia' },
    { value: 'ME', ja: 'モンテネグロ', en: 'Montenegro' },
    { value: 'MA', ja: 'モロッコ', en: 'Morocco' },
    { value: 'MZ', ja: 'モザンビーク', en: 'Mozambique' },
    { value: 'MM', ja: 'ミャンマー', en: 'Myanmar' },
    { value: 'NA', ja: 'ナミビア', en: 'Namibia' },
    { value: 'NR', ja: 'ナウル', en: 'Nauru' },
    { value: 'NP', ja: 'ネパール', en: 'Nepal' },
    { value: 'NL', ja: 'オランダ', en: 'Netherlands' },
    { value: 'NZ', ja: 'ニュージーランド', en: 'New Zealand' },
    { value: 'NI', ja: 'ニカラグア', en: 'Nicaragua' },
    { value: 'NE', ja: 'ニジェール', en: 'Niger' },
    { value: 'NG', ja: 'ナイジェリア', en: 'Nigeria' },
    { value: 'MK', ja: '北マケドニア', en: 'North Macedonia' },
    { value: 'NO', ja: 'ノルウェー', en: 'Norway' },
    { value: 'OM', ja: 'オマーン', en: 'Oman' },
    { value: 'PK', ja: 'パキスタン', en: 'Pakistan' },
    { value: 'PW', ja: 'パラオ', en: 'Palau' },
    { value: 'PA', ja: 'パナマ', en: 'Panama' },
    { value: 'PG', ja: 'パプアニューギニア', en: 'Papua New Guinea' },
    { value: 'PY', ja: 'パラグアイ', en: 'Paraguay' },
    { value: 'PE', ja: 'ペルー', en: 'Peru' },
    { value: 'PH', ja: 'フィリピン', en: 'Philippines' },
    { value: 'PL', ja: 'ポーランド', en: 'Poland' },
    { value: 'PT', ja: 'ポルトガル', en: 'Portugal' },
    { value: 'QA', ja: 'カタール', en: 'Qatar' },
    { value: 'RO', ja: 'ルーマニア', en: 'Romania' },
    { value: 'RU', ja: 'ロシア', en: 'Russia' },
    { value: 'RW', ja: 'ルワンダ', en: 'Rwanda' },
    { value: 'KN', ja: 'セントクリストファー・ネイビス', en: 'Saint Kitts and Nevis' },
    { value: 'LC', ja: 'セントルシア', en: 'Saint Lucia' },
    { value: 'VC', ja: 'セントビンセント・グレナディーン', en: 'Saint Vincent and the Grenadines' },
    { value: 'WS', ja: 'サモア', en: 'Samoa' },
    { value: 'SM', ja: 'サンマリノ', en: 'San Marino' },
    { value: 'ST', ja: 'サントメ・プリンシペ', en: 'Sao Tome and Principe' },
    { value: 'SA', ja: 'サウジアラビア', en: 'Saudi Arabia' },
    { value: 'SN', ja: 'セネガル', en: 'Senegal' },
    { value: 'RS', ja: 'セルビア', en: 'Serbia' },
    { value: 'SC', ja: 'セーシェル', en: 'Seychelles' },
    { value: 'SL', ja: 'シエラレオネ', en: 'Sierra Leone' },
    { value: 'SG', ja: 'シンガポール', en: 'Singapore' },
    { value: 'SK', ja: 'スロバキア', en: 'Slovakia' },
    { value: 'SI', ja: 'スロベニア', en: 'Slovenia' },
    { value: 'SB', ja: 'ソロモン諸島', en: 'Solomon Islands' },
    { value: 'SO', ja: 'ソマリア', en: 'Somalia' },
    { value: 'ZA', ja: '南アフリカ', en: 'South Africa' },
    { value: 'SS', ja: '南スーダン', en: 'South Sudan' },
    { value: 'ES', ja: 'スペイン', en: 'Spain' },
    { value: 'LK', ja: 'スリランカ', en: 'Sri Lanka' },
    { value: 'SD', ja: 'スーダン', en: 'Sudan' },
    { value: 'SR', ja: 'スリナム', en: 'Suriname' },
    { value: 'SE', ja: 'スウェーデン', en: 'Sweden' },
    { value: 'CH', ja: 'スイス', en: 'Switzerland' },
    { value: 'SY', ja: 'シリア', en: 'Syria' },
    { value: 'TW', ja: '台湾', en: 'Taiwan' },
    { value: 'TJ', ja: 'タジキスタン', en: 'Tajikistan' },
    { value: 'TZ', ja: 'タンザニア', en: 'Tanzania' },
    { value: 'TH', ja: 'タイ', en: 'Thailand' },
    { value: 'TL', ja: '東ティモール', en: 'Timor-Leste' },
    { value: 'TG', ja: 'トーゴ', en: 'Togo' },
    { value: 'TO', ja: 'トンガ', en: 'Tonga' },
    { value: 'TT', ja: 'トリニダード・トバゴ', en: 'Trinidad and Tobago' },
    { value: 'TN', ja: 'チュニジア', en: 'Tunisia' },
    { value: 'TR', ja: 'トルコ', en: 'Turkey' },
    { value: 'TM', ja: 'トルクメニスタン', en: 'Turkmenistan' },
    { value: 'TV', ja: 'ツバル', en: 'Tuvalu' },
    { value: 'UG', ja: 'ウガンダ', en: 'Uganda' },
    { value: 'UA', ja: 'ウクライナ', en: 'Ukraine' },
    { value: 'AE', ja: 'アラブ首長国連邦', en: 'United Arab Emirates' },
    { value: 'GB', ja: 'イギリス', en: 'United Kingdom' },
    { value: 'US', ja: 'アメリカ', en: 'United States' },
    { value: 'UY', ja: 'ウルグアイ', en: 'Uruguay' },
    { value: 'UZ', ja: 'ウズベキスタン', en: 'Uzbekistan' },
    { value: 'VU', ja: 'バヌアツ', en: 'Vanuatu' },
    { value: 'VA', ja: 'バチカン市国', en: 'Vatican City' },
    { value: 'VE', ja: 'ベネズエラ', en: 'Venezuela' },
    { value: 'VN', ja: 'ベトナム', en: 'Vietnam' },
    { value: 'YE', ja: 'イエメン', en: 'Yemen' },
    { value: 'ZM', ja: 'ザンビア', en: 'Zambia' },
    { value: 'ZW', ja: 'ジンバブエ', en: 'Zimbabwe' },
  ];

  const countries = [
    { value: '', label: t('application.form.selectCountry') },
    ...allCountries.map(c => ({ value: c.value, label: locale === 'ja' ? c.ja : c.en })),
  ];

  const experienceLevels = [
    { value: '', label: t('application.form.selectExperience') },
    { value: 'none', label: t('application.form.experience.none') },
    { value: '1-2', label: t('application.form.experience.years1to2') },
    { value: '3-5', label: t('application.form.experience.years3to5') },
    { value: '5+', label: t('application.form.experience.years5plus') },
  ];

  const hsmProviders = [
    { value: '', label: t('application.form.selectHsm') },
    { value: 'thales', label: 'Thales Luna' },
    { value: 'aws', label: 'AWS CloudHSM' },
    { value: 'azure', label: 'Azure Dedicated HSM' },
    { value: 'other', label: t('application.form.other') },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex justify-between items-center py-5 px-8" role="banner">
          <Link href="/prover/landing" className="flex items-center gap-3">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-lg font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-[1.5px]">
                Prover Portal
              </div>
            </div>
          </Link>
        </header>

        <div className="max-w-2xl mx-auto px-8 py-16">
          <Card className="text-center p-12">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-success" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {t('application.submitted.title')}
            </h1>
            <p className="text-foreground-secondary mb-6">
              {t('application.submitted.description')}
            </p>
            <div className="bg-background-secondary rounded-lg p-6 mb-6">
              <p className="text-sm text-foreground-secondary mb-2">
                {t('application.submitted.applicationId')}
              </p>
              <div className="font-mono text-2xl font-bold text-gold mb-4">
                {applicationId}
              </div>
              <p className="text-xs text-foreground-tertiary">
                {t('application.submitted.saveIdNote')}
              </p>
            </div>
            <p className="text-sm text-foreground-secondary mb-8">
              {t('application.submitted.emailSentNote')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" asChild>
                <Link href={`/prover/application-status?id=${applicationId}`}>
                  {t('application.submitted.checkStatus')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/prover/landing">
                  {t('application.submitted.backToHome')}
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#application-form"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to application form
      </a>

      {/* Header */}
      <header className="flex justify-between items-center py-5 px-8" role="banner">
        <Link href="/prover/landing" className="flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-lg font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1.5px]">
              Prover Portal
            </div>
          </div>
        </Link>
        <Link
          href="/prover/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('application.backToOverview')}
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-8">
        {/* Application Type Toggle (only shown before invitation is verified for enterprise) */}
        {!invitationVerified && (
          <div className="py-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setApplicationType('public');
                  setInvitationCode('');
                  setInvitationError(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all min-h-[44px]',
                  applicationType === 'public'
                    ? 'border-hinomaru bg-hinomaru/10 text-hinomaru'
                    : 'border-surface-tertiary text-foreground-secondary hover:border-foreground-tertiary'
                )}
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">{t('application.type.public')}</span>
              </button>
              <button
                type="button"
                onClick={() => setApplicationType('enterprise')}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all min-h-[44px]',
                  applicationType === 'enterprise'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-surface-tertiary text-foreground-secondary hover:border-foreground-tertiary'
                )}
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">{t('application.type.enterprise')}</span>
              </button>
            </div>

            {/* Enterprise Invitation Code Input */}
            {applicationType === 'enterprise' && (
              <Card className="p-6 border-gold bg-gradient-to-br from-gold/5 to-transparent mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="h-5 w-5 text-gold" aria-hidden="true" />
                  <h2 className="font-semibold">{t('application.enterprise.invitation.title')}</h2>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('application.enterprise.invitation.description')}
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className={cn(
                      'flex-1 px-4 py-3 bg-background border rounded-lg text-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-gold/20',
                      invitationError
                        ? 'border-danger focus:border-danger'
                        : 'border-surface-tertiary focus:border-gold'
                    )}
                    placeholder={t('application.enterprise.invitation.placeholder')}
                    value={invitationCode}
                    onChange={(e) => {
                      setInvitationCode(e.target.value);
                      setInvitationError(false);
                    }}
                  />
                  <Button variant="gold" onClick={verifyInvitation} disabled={!invitationCode.trim()}>
                    {t('application.enterprise.invitation.verify')}
                  </Button>
                </div>
                {invitationError && (
                  <p className="text-sm text-danger mt-2" role="alert">
                    {t('application.enterprise.invitation.error')}
                  </p>
                )}
                <p className="text-xs text-foreground-tertiary mt-3">
                  {t('application.enterprise.invitation.hint')}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Enterprise Invitation Verified Banner */}
        {invitationVerified && (
          <Card className="p-6 border-gold bg-gradient-to-br from-gold/10 to-transparent mb-6 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('application.enterprise.verified.title')}</span>
                  <Badge variant="gold" className="text-[10px]">
                    {FALLBACK_INVITATION.plan}
                  </Badge>
                </div>
                <div className="text-sm text-foreground-secondary">
                  {t('application.enterprise.verified.operator')}: {FALLBACK_INVITATION.operatorName}
                </div>
              </div>
            </div>

            {/* Enterprise Benefits Summary */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gold/30">
              <div className="flex items-center gap-2 text-xs">
                <Server className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                <span>{t('application.enterprise.verified.managedInfra')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Headphones className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                <span>{t('application.enterprise.verified.dedicatedSupport')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                <span>SLA {FALLBACK_INVITATION.benefits.slaGuarantee}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Gift className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                <span>{t('application.enterprise.verified.minRevenue')}: {FALLBACK_INVITATION.benefits.minRevenue}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Progress Steps - only show when public or invitation verified */}
        {(applicationType === 'public' || invitationVerified) && (
        <nav
          className="py-10"
          role="navigation"
          aria-label="Application progress"
        >
          <ol className="flex justify-between relative">
            <div
              className="absolute top-5 left-0 right-0 h-0.5 bg-surface-tertiary"
              aria-hidden="true"
            />
            {steps.map((step) => (
              <li key={step.number} className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step.number < currentStep
                      ? 'bg-success text-white'
                      : step.number === currentStep
                        ? 'bg-hinomaru text-white'
                        : 'bg-background-secondary border border-surface-tertiary text-foreground-tertiary'
                  }`}
                  aria-current={step.number === currentStep ? 'step' : undefined}
                >
                  {step.number < currentStep ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    step.number === currentStep
                      ? 'text-foreground font-medium'
                      : 'text-foreground-tertiary'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </nav>
        )}

        {/* Form Section - only show when public or invitation verified */}
        {(applicationType === 'public' || invitationVerified) && (
        <main id="application-form" className="pb-16">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step1.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step1.description')}
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="org-name" className="text-sm text-foreground-secondary">
                    {t('application.form.organizationName')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.organizationNamePlaceholder')}
                    value={formData.organizationName}
                    onChange={(e) => updateFormData('organizationName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm text-foreground-secondary">
                      {t('application.form.country')}{' '}
                      <span className="text-hinomaru">*</span>
                    </label>
                    <select
                      id="country"
                      className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      required
                    >
                      {countries.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm text-foreground-secondary">
                      {t('application.form.website')}
                    </label>
                    <input
                      id="website"
                      type="url"
                      className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-foreground-secondary">
                    {t('application.form.contactEmail')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder="contact@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="experience" className="text-sm text-foreground-secondary">
                    {t('application.form.validatorExperience')}
                  </label>
                  <select
                    id="experience"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                    value={formData.validatorExperience}
                    onChange={(e) => updateFormData('validatorExperience', e.target.value)}
                  >
                    {experienceLevels.map((exp) => (
                      <option key={exp.value} value={exp.value}>
                        {exp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep1Valid()}
                  aria-disabled={!isStep1Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Technical */}
          {currentStep === 2 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step2.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step2.description')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    key: 'hsmConfirmed',
                    icon: Shield,
                    title: t('application.step2.requirements.hsm.title'),
                    desc: t('application.step2.requirements.hsm.description'),
                  },
                  {
                    key: 'uptimeConfirmed',
                    icon: Clock,
                    title: t('application.step2.requirements.uptime.title'),
                    desc: t('application.step2.requirements.uptime.description'),
                  },
                  {
                    key: 'responseTimeConfirmed',
                    icon: Zap,
                    title: t('application.step2.requirements.responseTime.title'),
                    desc: t('application.step2.requirements.responseTime.description'),
                  },
                  {
                    key: 'multisigConfirmed',
                    icon: Lock,
                    title: t('application.step2.requirements.multisig.title'),
                    desc: t('application.step2.requirements.multisig.description'),
                  },
                ].map((req) => (
                  <label
                    key={req.key}
                    className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg cursor-pointer hover:bg-surface transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru"
                      checked={formData[req.key as keyof FormData] as boolean}
                      onChange={(e) =>
                        updateFormData(req.key as keyof FormData, e.target.checked)
                      }
                    />
                    <req.icon
                      className={`h-6 w-6 ${
                        formData[req.key as keyof FormData]
                          ? 'text-success'
                          : 'text-foreground-tertiary'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{req.title}</div>
                      <div className="text-sm text-foreground-secondary">{req.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="hsm-provider" className="text-sm text-foreground-secondary">
                    {t('application.form.hsmProvider')}
                  </label>
                  <select
                    id="hsm-provider"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                    value={formData.hsmProvider}
                    onChange={(e) => updateFormData('hsmProvider', e.target.value)}
                  >
                    {hsmProviders.map((hsm) => (
                      <option key={hsm.value} value={hsm.value}>
                        {hsm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="infrastructure" className="text-sm text-foreground-secondary">
                    {t('application.form.infrastructureLocation')}
                  </label>
                  <input
                    id="infrastructure"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.infrastructurePlaceholder')}
                    value={formData.infrastructureLocation}
                    onChange={(e) => updateFormData('infrastructureLocation', e.target.value)}
                  />
                </div>
              </div>

              {!isStep2Valid() && (
                <p className="text-sm text-hinomaru mt-4" role="alert">
                  {t('application.step2.validationMessage')}
                </p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep2Valid()}
                  aria-disabled={!isStep2Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Legal & KYB */}
          {currentStep === 3 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step3.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step3.description')}
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="reg-number" className="text-sm text-foreground-secondary">
                    {t('application.form.businessId')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="reg-number"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.businessIdPlaceholder')}
                    value={formData.businessRegistrationNumber}
                    onChange={(e) =>
                      updateFormData('businessRegistrationNumber', e.target.value)
                    }
                    required
                  />
                  <p className="text-xs text-foreground-tertiary mt-1">
                    {t('application.form.businessIdHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-foreground-secondary">
                    {t('application.form.uploadDocument')}
                  </label>
                  <div className="bg-background-secondary/50 border border-surface-tertiary rounded-lg p-4 mb-3">
                    <p className="text-sm font-medium mb-1">
                      {t('application.form.requiredDocuments')}
                    </p>
                    <p className="text-xs text-foreground-tertiary">
                      {t('application.form.requiredDocumentsHint')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background-secondary border border-dashed border-surface-tertiary rounded-lg">
                    <Upload className="h-6 w-6 text-foreground-tertiary" aria-hidden="true" />
                    <div className="flex-1">
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.png"
                        onChange={() => updateFormData('documentUploaded', true)}
                      />
                      <label
                        htmlFor="document-upload"
                        className="text-hinomaru cursor-pointer hover:underline"
                      >
                        {t('application.form.chooseFile')}
                      </label>
                      <p className="text-xs text-foreground-tertiary mt-1">
                        {t('application.form.fileFormats')}
                      </p>
                    </div>
                    {formData.documentUploaded && (
                      <Check className="h-5 w-5 text-success" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeTerms}
                      onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeTerms')}{' '}
                      <Link href="/prover/terms" className="text-gold underline">
                        {t('application.form.proverTerms')}
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeKyb}
                      onChange={(e) => updateFormData('agreeKyb', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeKyb')}
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeStake}
                      onChange={(e) => updateFormData('agreeStake', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeStake')}{' '}
                      <Link
                        href="/prover/requirements#risk"
                        className="text-gold underline"
                      >
                        {t('application.form.quadraticSlashing')}
                      </Link>
                    </span>
                  </label>
                </div>
              </div>

              {!isStep3Valid() && (
                <p className="text-sm text-hinomaru mt-4" role="alert">
                  {t('application.step3.validationMessage')}
                </p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep3Valid()}
                  aria-disabled={!isStep3Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Stake */}
          {currentStep === 4 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step4.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step4.description')}
              </p>

              {/* Stake Amount Selection */}
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm text-foreground-secondary">
                    {t('application.step4.stakeAmount')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: '100', label: '100 ETH', description: t('application.step4.stakeOptions.minimum') },
                      { value: '200', label: '200 ETH', description: t('application.step4.stakeOptions.standard') },
                      { value: '500', label: '500 ETH', description: t('application.step4.stakeOptions.premium') },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-lg cursor-pointer border transition-all',
                          formData.stakeAmount === option.value
                            ? 'border-hinomaru bg-hinomaru/10'
                            : 'border-surface-tertiary bg-background-secondary hover:border-foreground-tertiary'
                        )}
                      >
                        <input
                          type="radio"
                          name="stakeAmount"
                          value={option.value}
                          checked={formData.stakeAmount === option.value}
                          onChange={(e) => updateFormData('stakeAmount', e.target.value)}
                          className="w-5 h-5 accent-hinomaru"
                        />
                        <Coins
                          className={cn(
                            'h-6 w-6',
                            formData.stakeAmount === option.value ? 'text-hinomaru' : 'text-foreground-tertiary'
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-sm text-foreground-secondary">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Wallet Connection */}
                <div className="space-y-3">
                  <label className="text-sm text-foreground-secondary">
                    {t('application.step4.walletConnection')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  {!isConnected ? (
                    <button
                      type="button"
                      onClick={() => openConnectModal?.()}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-background-secondary border border-surface-tertiary rounded-lg hover:border-hinomaru transition-colors"
                    >
                      <Wallet className="h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                      <span className="font-medium">{t('application.step4.connectWallet')}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-success/10 border border-success rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                      <div className="flex-1">
                        <div className="font-medium text-success">{t('application.step4.walletConnected')}</div>
                        <div className="text-sm text-foreground-secondary font-mono">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnect()}
                      >
                        {t('application.step4.disconnect')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Stake Info Box */}
                <div className="bg-gold/10 border border-gold rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-2">
                      <div className="font-semibold text-gold">{t('application.step4.stakeInfo.title')}</div>
                      <ul className="text-sm text-foreground-secondary space-y-1">
                        <li>• {t('application.step4.stakeInfo.lockPeriod')}</li>
                        <li>• {t('application.step4.stakeInfo.slashingRisk')}</li>
                        <li>• {t('application.step4.stakeInfo.rewardsInfo')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Stake Confirmation Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                    checked={formData.stakeConfirmed}
                    onChange={(e) => updateFormData('stakeConfirmed', e.target.checked)}
                    required
                  />
                  <span className="text-sm text-foreground-secondary">
                    {t('application.step4.confirmStake')}
                  </span>
                </label>
              </div>

              {!isStep4Valid() && (
                <p className="text-sm text-hinomaru mt-4" role="alert">
                  {t('application.step4.validationMessage')}
                </p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep4Valid()}
                  aria-disabled={!isStep4Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step5.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step5.description')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    label: t('application.review.organization'),
                    value: formData.organizationName || '-',
                    icon: Building,
                  },
                  {
                    label: t('application.review.country'),
                    value:
                      countries.find((c) => c.value === formData.country)?.label ||
                      '-',
                    icon: Globe,
                  },
                  {
                    label: t('application.review.contactEmail'),
                    value: formData.contactEmail || '-',
                    icon: Mail,
                  },
                  {
                    label: t('application.review.hsmProvider'),
                    value:
                      hsmProviders.find((h) => h.value === formData.hsmProvider)
                        ?.label || '-',
                    icon: Shield,
                  },
                  {
                    label: t('application.review.infrastructure'),
                    value: formData.infrastructureLocation || '-',
                    icon: Globe,
                  },
                  {
                    label: t('application.review.stakeCommitment'),
                    value: `${formData.stakeAmount} ETH`,
                    icon: Coins,
                    highlight: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3 border-b border-surface-tertiary"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className="h-4 w-4 text-foreground-tertiary"
                        aria-hidden="true"
                      />
                      <span className="text-foreground-secondary">{item.label}</span>
                    </div>
                    <span
                      className={`font-semibold ${item.highlight ? 'text-gold' : ''}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-hinomaru/10 border border-hinomaru rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-hinomaru flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-hinomaru-400">
                      {t('application.review.important')}:
                    </span>{' '}
                    <span className="text-foreground-secondary">
                      {t('application.review.reviewNote')}
                    </span>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="bg-hinomaru/10 border border-hinomaru rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-hinomaru flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-hinomaru">{submitError}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={registerProver.isPending}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={registerProver.isPending || !isConnected}
                >
                  {registerProver.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                      {t('application.submitting')}
                    </>
                  ) : (
                    t('application.submit')
                  )}
                </Button>
              </div>
            </Card>
          )}
        </main>
        )}
      </div>
    </div>
  );
}
