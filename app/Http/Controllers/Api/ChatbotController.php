<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pharmacy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    private const FALLBACKS = [
        'How do I order medicines?' => "Open the pharmacy's storefront, tap 'Order' on any medicine, set the quantity and delivery address, then choose your payment method (M-PESA accepted). Track the order from the Orders tab.",
        'How do I track my order?' => 'Open the Orders tab and tap any order to see its live status — from payment received to dispensed and delivered.',
        'How do I upload a prescription?' => 'From the app, open Profile → Prescriptions → Upload, then attach a clear photo of your doctor\'s prescription. A pharmacist will review and dispense it.',
        'Do you support telemedicine video calls?' => 'Yes. Open the Telemedicine tab, pick a pharmacy, and book an appointment. You will join a secure video call with the pharmacist or doctor at the scheduled time.',
        'What payment methods are accepted?' => 'Orders are paid via M-PESA by default. Some pharmacies also accept cash on delivery — check the payment options at checkout.',
        'How do loyalty points work?' => 'When a pharmacy runs a loyalty program, you earn points on every paid order. Points can be redeemed for discounts on future orders. Check the Loyalty & Rewards section in your profile.',
        'Can I use my NHIF or private insurance?' => 'Yes, insurance is supported. Add your policy under Profile → Health Insurance, then tell the pharmacy to bill your insurer when you order.',
        'Do you offer delivery?' => 'Yes, most pharmacies offer delivery. At checkout, provide your delivery address and any delivery or pickup options will be shown before you confirm.',
        'What are the pharmacy opening hours?' => 'Opening hours vary by pharmacy. Open any pharmacy from the home screen and its working hours are shown on the pharmacy page.',
        'How can I contact the pharmacy?' => 'Each pharmacy displays its phone number and address on its pharmacy page. You can also chat directly with the pharmacy from the Messages tab.',
    ];

    public function respond(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|max:1000',
                'pharmacy_id' => 'nullable|exists:pharmacies,id',
            ]);

            $message = mb_strtolower(trim($validated['message']));
            $pharmacyName = null;

            if (!empty($validated['pharmacy_id'])) {
                $pharmacyName = Pharmacy::find($validated['pharmacy_id'])?->pharmacy_name;
            }

            [$reply, $suggestions] = $this->matchRules($message, $pharmacyName);

            return response()->json([
                'data' => [
                    'reply' => $reply,
                    'suggestions' => $suggestions,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed.', 'error' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed.', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error.'], 500);
        }
    }

    /**
     * Keyword-matching rules returning [reply, suggestedFollowups].
     */
    private function matchRules(string $message, ?string $pharmacyName): array
    {
        $haystack = $message;

        $has = function (array $keywords) use ($haystack): bool {
            foreach ($keywords as $kw) {
                if (mb_strpos($haystack, $kw) !== false) {
                    return true;
                }
            }
            return false;
        };

        $name = $pharmacyName ?? 'your pharmacy';

        // --- Emergency ---
        if ($has(['emergency', 'urgent', 'overdose', 'poisoning', 'dharura'])) {
            return [
                'If this is an emergency, please call 113 (Tanzania ambulance) or go to the nearest hospital immediately. For urgent medicine needs, open the pharmacy and tap Call within business hours.',
                ['How do I order medicines?', 'What are the pharmacy opening hours?'],
            ];
        }

        // --- Greeting ---
        if ($has(['hello', 'hi ', 'hey', 'jambo', 'mambo', 'habari', 'salaam', 'morning', 'afternoon', 'good day'])) {
            $greeting = $this->greeting();
            return [
                "$greeting 👋 Welcome to $name! I can help you with orders, prescriptions, payments, telemedicine, loyalty, and insurance. What do you need?",
                ['How do I order medicines?', 'How do I track my order?', 'Do you offer delivery?'],
            ];
        }

        // --- Order status / tracking ---
        if ($has(['order', 'agizo', 'oda', 'track', 'status', 'hali', 'kidogo'])) {
            return [
                'You can track any order in the Orders tab. Tap an order to see its current status. If an order was placed but you cannot see it, try refreshing the tab.',
                $pharmacyName
                    ? ['How do I order medicines?', 'Do you offer delivery?', 'What payment methods are accepted?']
                    : ['How do I order medicines?', 'What payment methods are accepted?'],
            ];
        }

        // --- Prescription ---
        if ($has(['prescription', 'doctor note', 'dawa', 'maagizo', 'upload', 'mmiliki'])) {
            return [
                'To use a prescription, open Profile → Prescriptions → Upload and attach a clear photo of the doctor\'s prescription. A pharmacist will review and prepare your medicines. You can pick them up or have them delivered.',
                ['How do I order medicines?', 'How do I track my order?'],
            ];
        }

        // --- Telemedicine ---
        if ($has(['telemedicine', 'doctor', 'daktari', 'consult', 'video call', 'appointment', 'virtual'])) {
            return [
                'You can book a secure video consultation with a pharmacist or doctor through the Telemedicine tab. Choose a pharmacy, pick a time slot, and you will join the call at the scheduled time.',
                ['How do I order medicines?', 'Do you offer delivery?'],
            ];
        }

        // --- Loyalty ---
        if ($has(['loyalty', 'points', 'reward', 'zawadi', 'alama', 'bonus'])) {
            return [
                'When the pharmacy runs a loyalty program you earn points on paid orders automatically. You can see your balance and redeem points under Profile → Loyalty & Rewards.',
                ['How do I order medicines?', 'What payment methods are accepted?'],
            ];
        }

        // --- Insurance ---
        if ($has(['insurance', 'nhif', 'insha', 'bima', 'coverage'])) {
            return [
                'You can add your NHIF or private insurance policy under Profile → Health Insurance. Then inform the pharmacy when ordering and they will bill your insurer for the covered portion.',
                ['How do I order medicines?', 'How do loyalty points work?'],
            ];
        }

        // --- Payment ---
        if ($has(['payment', 'pay', 'mpesa', 'm-pesa', 'lipa', 'malipo', 'tigo', 'airtel', 'hali ya']) || str_contains($message, 'pesa')) {
            return [
                'Most orders are paid by M-PESA. At checkout you will enter your phone number and approve the payment prompt. Delivery or cash options, where available, are shown before you confirm the order.',
                ['How do I order medicines?', 'How do I track my order?'],
            ];
        }

        // --- Delivery ---
        if ($has(['delivery', 'deliver', 'dispatch', 'usafirishaji', 'pickup', 'courier', 'endaki', 'delivery fee', 'delivery cost'])) {
            return [
                'Yes, delivery is available from participating pharmacies. At checkout, enter your delivery address and the available delivery options (including any fee) will be shown before you confirm.',
                ['How do I order medicines?', 'What payment methods are accepted?', 'What are the pharmacy opening hours?'],
            ];
        }

        // --- Drug availability / price ---
        if ($has(['drug', 'medicine', 'medication', 'available', 'stock', 'price', 'cost', 'cheap', 'expensive', 'dawa', 'bei', 'gharama', 'kuna'])) {
            return [
                'You can search for any medicine on the pharmacy home page. Tap the search bar, type the name or the generic name, prices and stock availability are shown for each result. Tap a medicine to see details.',
                ['How do I order medicines?', 'Do you offer delivery?', 'What payment methods are accepted?'],
            ];
        }

        // --- Hours ---
        if ($has(['hours', 'opening', 'close', 'closed', 'open', 'working time', 'what time', 'masaa', 'fungua', 'wazi', 'saa'])) {
            return [
                "Opening hours vary per pharmacy. Open $name from the home screen and check the working hours shown on its page before visiting.",
                ['Where is the pharmacy located?', 'How can I contact the pharmacy?'],
            ];
        }

        // --- Location ---
        if ($has(['location', 'address', 'where', 'located', 'wapi', 'anwani', 'eneo', 'directions'])) {
            return [
                "You can find the location of $name on its pharmacy page — including the map and directions. Most pharmacies also display their physical address and street.",
                ['Do you offer delivery?', 'What are the pharmacy opening hours?'],
            ];
        }

        // --- Contact ---
        if ($has(['contact', 'phone', 'call', 'simu', 'reach', 'talk', 'wasiliana'])) {
            return [
                "Open $name in the pharmacy list and tap Call to phone the pharmacy directly during business hours. You can also send a message from the Messages tab and the pharmacy will reply.",
                ['How do I order medicines?', 'Do you offer delivery?'],
            ];
        }

        // --- Register / login / support ---
        if ($has(['login', 'password', 'register', 'sign up', 'log in', 'account', 'kumbukumbu'])) {
            return [
                'For help with your account, password reset, or registration, open Profile → Support and send us a message. We usually reply within 24 hours.',
                ['How do I order medicines?', 'Do you offer delivery?'],
            ];
        }

        // --- Thanks ---
        if ($has(['thank', 'asante', 'shukran', 'thanks'])) {
            return [
                'You are welcome! 😊 Is there anything else I can help you with?',
                ['How do I order medicines?', 'How do loyalty points work?', 'Do you offer delivery?'],
            ];
        }

        // --- Fallback ---
        $short = mb_strlen($message) < 4;
        if ($short) {
            return [
                "I did not quite understand that. Try asking about orders, delivery, prescriptions, payments, telemedicine, loyalty, or insurance — or read the quick questions below.",
                array_slice(array_keys(self::FALLBACKS), 0, 3),
            ];
        }

        return [
            'I am not sure about that one, but here are some common questions I can answer:',
            array_slice(array_keys(self::FALLBACKS), 0, 4),
        ];
    }

    private function greeting(): string
    {
        $h = (int) date('G');
        if ($h < 12) return 'Good morning';
        if ($h < 17) return 'Good afternoon';
        return 'Good evening';
    }
}