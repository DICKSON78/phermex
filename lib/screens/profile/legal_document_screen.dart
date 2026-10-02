import 'package:flutter/material.dart';

import '../../l10n/app_localizations.dart';
import '../../theme.dart';

/// In-app Privacy Policy and Terms of Service documents.
///
/// These are rendered locally so the legal rows always open something useful,
/// even with no network connection.
class LegalDocumentScreen extends StatelessWidget {
  /// Either [LegalDocument.privacy] or [LegalDocument.terms].
  final LegalDocument document;
  const LegalDocumentScreen({super.key, required this.document});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final sw = L.locale.languageCode == 'sw';
    final sections = document == LegalDocument.privacy
        ? (sw ? _privacySw : _privacyEn)
        : (sw ? _termsSw : _termsEn);

    return Scaffold(
      backgroundColor: AppColors.sand,
      appBar: AppBar(
        title: Text(
          L.t(
            document == LegalDocument.privacy
                ? 'privacyPolicy'
                : 'termsOfService',
          ),
        ),
        backgroundColor: Colors.white,
        systemOverlayStyle: AppUi.statusBar,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppColors.mint50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    document == LegalDocument.privacy
                        ? Icons.privacy_tip_outlined
                        : Icons.description_outlined,
                    color: AppColors.brand600,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    document == LegalDocument.privacy
                        ? L.t('privacyIntro')
                        : L.t('termsIntro'),
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.muted,
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          ...sections.map(
            (s) => Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    s.$1,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    s.$2,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.muted,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.mint50,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.support_agent_rounded,
                  size: 18,
                  color: AppColors.brand600,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    sw
                        ? 'Kwa maswali kuhusu sera hii wasiliana nasi kupitia Help & Support.'
                        : 'For questions about this policy contact us through Help & Support.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.brand700,
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum LegalDocument { privacy, terms }

const _privacyEn = <(String, String)>[
  (
    'What we collect',
    'We collect your name, phone number, email address, delivery addresses, order history, and the device location you allow us to use so we can deliver your medicines accurately.',
  ),
  (
    'How we use your data',
    'We use your data only to process orders, arrange deliveries, show order tracking, and send you updates about your prescriptions and loyalty rewards.',
  ),
  (
    'Who we share it with',
    'We share only what is needed with the pharmacy fulfilling your order and our delivery partner. We never sell your personal information to third parties.',
  ),
  (
    'Payments',
    'Card and mobile money details are handled by our licensed payment providers. We never store your full card or mobile money number on our servers.',
  ),
  (
    'Location',
    'Location access is optional. Without it we cannot show live delivery tracking, but you can still place orders by entering your address manually.',
  ),
  (
    'Your rights',
    'You can view, correct, or ask us to delete your data at any time from Settings, or by contacting support. Deleting your account removes your personal data from active systems.',
  ),
  (
    'Data retention',
    'We keep order records for as long as required by law and pharmacy regulations, so your prescription history stays available to you and your pharmacist.',
  ),
  (
    'Security',
    'All traffic is encrypted in transit, access to your data is limited to staff who need it, and we never request your password over chat or phone.',
  ),
];

const _privacySw = <(String, String)>[
  (
    'Tunachowana nini',
    'Tunachowana jina lako, namba ya simu, barua pepe, anwani za uwasilishaji, historia ya maagizo, na eneo la kifaa unachoruhusu ili tuweze kukuleta dawa kwa utakamilifu.',
  ),
  (
    'Jinsi tunavyotumia data yako',
    'Tunatumia data yako kwa kusitafu maagizo, kupanga uwasilishaji, kuonyesha ufuatiliaji, na kutuma taarifa kuhusu madawa na zawadi za loyalty.',
  ),
  (
    'Tunashiriki na nani',
    'Tunashiriki tu kile kinachohitajika na duka la dawa linalotekeleza agizo lako na mshirika wetu wa usafirishaji. Hatsiuzi taarifa zako binafsi kwa watu wengine.',
  ),
  (
    'Malipo',
    'Kadi na taarifa za pesa za simu hushutwa na watoaji wa malipo walio leseni. Hatsihifadhi namba kamili ya kadi wala pesa ya simu kwenye seva zetu.',
  ),
  (
    'Eneo',
    'Ufikiaji wa eneo ni wa hiari. Bila eneo hatuwezi kuonyesha ufuatiliaji wa uwasilishaji, lakini unaweza bado kuweka maagizo kwa kuingiza anwani yako mwenyewe.',
  ),
  (
    'Hakuna zako',
    'Unaweza kuona, kurekebisha, au kuomba tufute data yako wakati wowote kutoka Mipangilio, au kwa wasiliana na msaada. Kufuta akaunti yako kunafuta data yako binafsi.',
  ),
  (
    'Muda wa kuhifadhi data',
    'Tunahifadhi kumbukumbu ya maagizo kwa muda unaohitajika na sheria na kanuni za maduka ya dawa, ili historia yako ya madawa ipatikane na mwokaji wako.',
  ),
  (
    'Usalama',
    'Mafotezi yote yamelindwa wakati yatumwa, nafasi ya kufikia data yako imezuiwa kwa wafanyakazi wanaohitaji, na hatutaombi nenosiri lako kwenye mazungumzo au simu.',
  ),
];

const _termsEn = <(String, String)>[
  (
    'Using this app',
    'By using Helix you agree to these terms and confirm that the information you give us is accurate. You must be able to enter a valid delivery address and a reachable phone number.',
  ),
  (
    'Your account',
    'One account is for one person. Keep your password to yourself, and tell us straight away if you think someone else has used your account.',
  ),
  (
    'Medicines',
    'Helix delivers medicines but does not replace medical advice. Always follow the prescription given by your doctor or pharmacist, and never share or swap prescribed medicine with anyone.',
  ),
  (
    'Orders and pricing',
    'Prices shown in the app include the medicines only. Delivery fees and any applicable taxes are shown before you confirm payment, and we may correct obvious pricing errors.',
  ),
  (
    'Delivery',
    'Delivery windows depend on pharmacy stock, distance, and traffic. If an item is out of stock we contact you before charging you, and you can cancel for a full refund.',
  ),
  (
    'Returns and refunds',
    'Because medicines are health products, returns are accepted only for items that are damaged, wrongly dispensed, or sealed and unopened. Contact us within 48 hours of delivery.',
  ),
  (
    'Prescriptions',
    'Uploading a prescription lets our pharmacy partners verify it. We may decline an order that appears unsafe or that requires a doctor’s confirmation we cannot obtain.',
  ),
  (
    'Acceptable use',
    'Do not use the app to list medicines illegally, harass couriers or pharmacy staff, probe the system for vulnerabilities, or reverse engineer the app.',
  ),
  (
    'Liability',
    'To the extent permitted by law, Helix is not liable for indirect losses. Our total liability for any order is limited to the amount you paid for that order.',
  ),
  (
    'Changes',
    'We may update these terms. Material changes will be announced in the app, and continued use after that means you accept the revised terms.',
  ),
];

const _termsSw = <(String, String)>[
  (
    'Kutumia programu hii',
    'Kwa kutumia Helix unakubali masharti haya na unathibitisha kuwa taarifa unazotoa ni sahihi. Lazima uwe na anwani halali ya uwasilishaji na namba ya simu inayopatikana.',
  ),
  (
    'Akaunti yako',
    'Akaunti moja ni ya mtu mmoja. Nenosiri lako ni lako pekee, na tujulishe mara moja ikiwa mtu mwingine anatumia akaunti yako.',
  ),
  (
    'Dawa',
    'Helix inauliza dawa lakini haibadilishi ushauri wa kitabibu. Fuata dawa uliyotajiwa na daktari au mwokaji dawa, na usishiriki au kubadilisha dawa yako na mtu mwingine.',
  ),
  (
    'Maagizo na bei',
    'Bei zinazoonyeshwa kwenye programu ni za dawa pekee. Ada ya usafirishaji na kodi zote zinazotumika zinaonyeshwa kabla ya kulipa, na tunaweza kurekebisha makosa rahisi ya bei.',
  ),
  (
    'Uwasilishaji',
    'Muda wa uwasilishaji unategemea upatikanaji wa dawa, umbali, na traffic. Ikiwa bidhaa haipo, tunakusiliana kabla ya kukutoza pesa, na unaweza kughairi na kupata pesa yako yote.',
  ),
  (
    'Kurudisha na kubadilisha pesa',
    'Kwa kuwa dawa ni bidhaa za afya, kurudisha hukuridhiwi kwa bidhaa zilizoharibika, zilizojikwa kimakosa, au zilizofungwa na hazijafunguliwa. Wasiliana nasi ndani ya saa 48 baada ya kupokea.',
  ),
  (
    'Madawa',
    'Kupakia dawa huruhusu maduka yetu wahakiki. Tunaweza kukataa agizo linaloonekana kuwa hatarisi au linalohitaji uthibitisho wa daktari ambalo hatunaweza kupata.',
  ),
  (
    'Matumizi yanayokubaliwa',
    'Usitumie programu hii kuuza dawa kwa njia haramu, kulumbisha wasafirishaji au wafanyakazi wa duka, kuangalia mifumo kwa mapengo, au kuchunguza programu.',
  ),
  (
    'Uwajibikaji',
    'Kiasi cha sheria kinachoruhusu, Helix haiwaishi majibu ya hasara za moja kwa moja. Jumla ya uwajibikaji wetu kwa agizo lolote ni sawa na kiasi ulicholipa.',
  ),
  (
    'Mabadiliko',
    'Tunaweza kusasisha masharti haya. Mabadiliko muhimu yataotangazwa kwenye programu, na kuendelea kutumia baada ya hilo kunamaanisha unayakubali.',
  ),
];
