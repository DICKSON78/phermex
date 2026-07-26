<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $accounts = $this->seedAccounts();
        $bankAccounts = $this->seedBankAccounts($accounts);
        $journalEntryIds = $this->seedJournalEntries($accounts);
        $this->seedBankTransactions($bankAccounts, $journalEntryIds);
        $this->seedBudgets($accounts);
        $this->seedTaxRecords();

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    private function seedAccounts(): array
    {
        $now = now();

        $parentAccounts = [
            ['pharmacy_id' => 1, 'account_code' => '1000', 'account_name' => 'Assets', 'account_type' => 'asset', 'parent_id' => null, 'description' => 'All asset accounts', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '2000', 'account_name' => 'Liabilities', 'account_type' => 'liability', 'parent_id' => null, 'description' => 'All liability accounts', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '3000', 'account_name' => 'Equity', 'account_type' => 'equity', 'parent_id' => null, 'description' => 'Owner equity accounts', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '4000', 'account_name' => 'Revenue', 'account_type' => 'revenue', 'parent_id' => null, 'description' => 'Income and revenue accounts', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5000', 'account_name' => 'Expenses', 'account_type' => 'expense', 'parent_id' => null, 'description' => 'All expense accounts', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('accounts')->insert($parentAccounts);

        $parentIds = [];
        foreach ($parentAccounts as $acct) {
            $parentIds[$acct['account_code']] = DB::table('accounts')
                ->where('pharmacy_id', 1)
                ->where('account_code', $acct['account_code'])
                ->value('id');
        }

        $subAccounts = [
            // Assets
            ['pharmacy_id' => 1, 'account_code' => '1100', 'account_name' => 'Cash in Hand', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Physical cash held at pharmacy premises', 'is_active' => true, 'balance' => 250000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1200', 'account_name' => 'Bank Accounts', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'All bank and mobile money accounts', 'is_active' => true, 'balance' => 5500000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1300', 'account_name' => 'Inventory', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Pharmaceutical and health product inventory', 'is_active' => true, 'balance' => 12500000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1400', 'account_name' => 'Accounts Receivable', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Amounts owed by customers and insurance', 'is_active' => true, 'balance' => 1850000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1500', 'account_name' => 'Fixed Assets', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Property, equipment and fixtures', 'is_active' => true, 'balance' => 8500000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Liabilities
            ['pharmacy_id' => 1, 'account_code' => '2100', 'account_name' => 'Accounts Payable', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Amounts owed to suppliers', 'is_active' => true, 'balance' => 3200000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '2200', 'account_name' => 'Loans Payable', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Outstanding business loans', 'is_active' => true, 'balance' => 5000000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '2300', 'account_name' => 'VAT Payable', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Collected VAT owed to TRA', 'is_active' => true, 'balance' => 875000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Equity
            ['pharmacy_id' => 1, 'account_code' => '3100', 'account_name' => "Owner's Equity", 'account_type' => 'equity', 'parent_id' => $parentIds['3000'], 'description' => 'Capital invested by owner', 'is_active' => true, 'balance' => 10000000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '3200', 'account_name' => 'Retained Earnings', 'account_type' => 'equity', 'parent_id' => $parentIds['3000'], 'description' => 'Accumulated profits retained in business', 'is_active' => true, 'balance' => 4575000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Revenue
            ['pharmacy_id' => 1, 'account_code' => '4100', 'account_name' => 'Drug Sales', 'account_type' => 'revenue', 'parent_id' => $parentIds['4000'], 'description' => 'Revenue from pharmaceutical product sales', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '4200', 'account_name' => 'Service Income', 'account_type' => 'revenue', 'parent_id' => $parentIds['4000'], 'description' => 'Revenue from pharmaceutical consultations and services', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Expenses
            ['pharmacy_id' => 1, 'account_code' => '5100', 'account_name' => 'Cost of Goods Sold', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Direct cost of drugs and products sold', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5200', 'account_name' => 'Rent Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Monthly shop and warehouse rent', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5300', 'account_name' => 'Utilities Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Electricity, water, internet and phone bills', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5400', 'account_name' => 'Salaries Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Employee salaries and wages', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5500', 'account_name' => 'Insurance Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Business and employee insurance premiums', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5600', 'account_name' => 'Depreciation Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Depreciation of fixed assets', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('accounts')->insert($subAccounts);

        $allAccounts = [];
        $allRows = DB::table('accounts')->where('pharmacy_id', 1)->get();
        foreach ($allRows as $row) {
            $allAccounts[$row->account_code] = $row->id;
        }

        return $allAccounts;
    }

    private function seedBankAccounts(array $accounts): array
    {
        $now = now();

        $bankData = [
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['1210'] ?? $accounts['1200'],
                'bank_name' => 'CRDB Bank Plc',
                'account_name' => 'PharmEx Main Operating Account',
                'account_number' => '0150326547890',
                'swift_code' => 'CORBTZTZ',
                'opening_balance' => 4200000.00,
                'current_balance' => 5075000.00,
                'is_default' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['1220'] ?? $accounts['1200'],
                'bank_name' => 'Vodacom M-Pesa',
                'account_name' => 'PharmEx Mobile Money',
                'account_number' => '0712345678',
                'swift_code' => null,
                'opening_balance' => 350000.00,
                'current_balance' => 475000.00,
                'is_default' => false,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('bank_accounts')->insert($bankData);

        $bankAccountIds = [];
        $bankRows = DB::table('bank_accounts')->where('pharmacy_id', 1)->get();
        foreach ($bankRows as $row) {
            $bankAccountIds[$row->account_name] = $row->id;
        }

        return $bankAccountIds;
    }

    private function seedJournalEntries(array $accounts): array
    {
        $now = now();
        $entryIds = [];

        // ── Entry 1: Opening Balances (posted) ─────────────────────────────
        $entry1Total = 28500000.00;

        DB::table('journal_entries')->insert([
            'pharmacy_id' => 1,
            'entry_number' => 'JE-2026-0001',
            'entry_date' => '2026-01-01',
            'description' => 'Opening balances for the financial year 2026',
            'reference_type' => null,
            'reference_id' => null,
            'total_debit' => $entry1Total,
            'total_credit' => $entry1Total,
            'status' => 'posted',
            'posted_by' => 2,
            'posted_at' => '2026-01-01 08:00:00',
            'reversed_by' => null,
            'reversed_at' => null,
            'reversal_reason' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $entryIds['JE-2026-0001'] = DB::table('journal_entries')
            ->where('entry_number', 'JE-2026-0001')
            ->where('pharmacy_id', 1)
            ->value('id');

        DB::table('journal_lines')->insert([
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['1100'], 'debit' => 250000.00, 'credit' => 0, 'description' => 'Cash in hand opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['1200'], 'debit' => 4550000.00, 'credit' => 0, 'description' => 'Bank accounts opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['1300'], 'debit' => 12500000.00, 'credit' => 0, 'description' => 'Inventory opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['1400'], 'debit' => 1850000.00, 'credit' => 0, 'description' => 'Accounts receivable opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['1500'], 'debit' => 8500000.00, 'credit' => 0, 'description' => 'Fixed assets opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['2100'], 'debit' => 0, 'credit' => 3200000.00, 'description' => 'Accounts payable opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['2200'], 'debit' => 0, 'credit' => 5000000.00, 'description' => 'Loans payable opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['2300'], 'debit' => 0, 'credit' => 875000.00, 'description' => 'VAT payable opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['3100'], 'debit' => 0, 'credit' => 10000000.00, 'description' => 'Owner equity opening balance', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0001'], 'account_id' => $accounts['3200'], 'debit' => 0, 'credit' => 4575000.00, 'description' => 'Retained earnings opening balance', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ── Entry 2: Drug Purchase (posted) ────────────────────────────────
        $entry2Total = 3150000.00;

        DB::table('journal_entries')->insert([
            'pharmacy_id' => 1,
            'entry_number' => 'JE-2026-0002',
            'entry_date' => '2026-06-15',
            'description' => 'Purchase of pharmaceutical drugs from Generic Pharma Ltd - Invoice GP-4521',
            'reference_type' => 'purchase_order',
            'reference_id' => 1,
            'total_debit' => $entry2Total,
            'total_credit' => $entry2Total,
            'status' => 'posted',
            'posted_by' => 2,
            'posted_at' => '2026-06-15 14:30:00',
            'reversed_by' => null,
            'reversed_at' => null,
            'reversal_reason' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $entryIds['JE-2026-0002'] = DB::table('journal_entries')
            ->where('entry_number', 'JE-2026-0002')
            ->where('pharmacy_id', 1)
            ->value('id');

        DB::table('journal_lines')->insert([
            ['journal_entry_id' => $entryIds['JE-2026-0002'], 'account_id' => $accounts['1300'], 'debit' => 2700000.00, 'credit' => 0, 'description' => 'Inventory increase - drugs received', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0002'], 'account_id' => $accounts['2300'], 'debit' => 0, 'credit' => 450000.00, 'description' => 'VAT input on purchase', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0002'], 'account_id' => $accounts['2100'], 'debit' => 0, 'credit' => 3150000.00, 'description' => 'Amount owed to Generic Pharma Ltd', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ── Entry 3: Monthly Revenue (posted) ──────────────────────────────
        $entry3Total = 4250000.00;

        DB::table('journal_entries')->insert([
            'pharmacy_id' => 1,
            'entry_number' => 'JE-2026-0003',
            'entry_date' => '2026-06-30',
            'description' => 'Monthly drug sales revenue for June 2026',
            'reference_type' => 'sales_summary',
            'reference_id' => null,
            'total_debit' => $entry3Total,
            'total_credit' => $entry3Total,
            'status' => 'posted',
            'posted_by' => 2,
            'posted_at' => '2026-06-30 17:00:00',
            'reversed_by' => null,
            'reversed_at' => null,
            'reversal_reason' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $entryIds['JE-2026-0003'] = DB::table('journal_entries')
            ->where('entry_number', 'JE-2026-0003')
            ->where('pharmacy_id', 1)
            ->value('id');

        DB::table('journal_lines')->insert([
            ['journal_entry_id' => $entryIds['JE-2026-0003'], 'account_id' => $accounts['1200'], 'debit' => 3500000.00, 'credit' => 0, 'description' => 'Bank deposit from cash sales', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0003'], 'account_id' => $accounts['1400'], 'debit' => 750000.00, 'credit' => 0, 'description' => 'Credit sales to insurance customers', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0003'], 'account_id' => $accounts['4100'], 'debit' => 0, 'credit' => 3750000.00, 'description' => 'Drug sales revenue - June 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0003'], 'account_id' => $accounts['4200'], 'debit' => 0, 'credit' => 500000.00, 'description' => 'Pharmaceutical consultation services', 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ── Entry 4: Payroll (draft) ───────────────────────────────────────
        $entry4Total = 2650000.00;

        DB::table('journal_entries')->insert([
            'pharmacy_id' => 1,
            'entry_number' => 'JE-2026-0004',
            'entry_date' => '2026-07-28',
            'description' => 'July 2026 payroll processing - pending approval',
            'reference_type' => null,
            'reference_id' => null,
            'total_debit' => $entry4Total,
            'total_credit' => $entry4Total,
            'status' => 'draft',
            'posted_by' => null,
            'posted_at' => null,
            'reversed_by' => null,
            'reversed_at' => null,
            'reversal_reason' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $entryIds['JE-2026-0004'] = DB::table('journal_entries')
            ->where('entry_number', 'JE-2026-0004')
            ->where('pharmacy_id', 1)
            ->value('id');

        DB::table('journal_lines')->insert([
            ['journal_entry_id' => $entryIds['JE-2026-0004'], 'account_id' => $accounts['5400'], 'debit' => 2650000.00, 'credit' => 0, 'description' => 'Gross salaries for July 2026 (6 employees)', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0004'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 2650000.00, 'description' => 'Salaries payable via bank transfer', 'created_at' => $now, 'updated_at' => $now],
        ]);

        return $entryIds;
    }

    private function seedBankTransactions(array $bankAccounts, array $journalEntryIds): void
    {
        $now = now();
        $crdbId = $bankAccounts['PharmEx Main Operating Account'];
        $mpesaId = $bankAccounts['PharmEx Mobile Money'];

        $startingCrdb = 4200000.00;
        $startingMpesa = 350000.00;

        $transactions = [
            // ── CRDB Bank transactions ──────────────────────────────────────
            [
                'bank_account_id' => $crdbId,
                'journal_entry_id' => $journalEntryIds['JE-2026-0003'] ?? null,
                'transaction_date' => '2026-06-15',
                'type' => 'deposit',
                'amount' => 1250000.00,
                'balance_after' => $startingCrdb + 1250000.00,
                'description' => 'Cash deposit from daily sales - week ending 15 Jun',
                'reference_number' => 'CRDB-DEP-20260615',
                'reconciled' => true,
                'reconciled_at' => '2026-06-16 09:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $crdbId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-06-20',
                'type' => 'withdrawal',
                'amount' => 850000.00,
                'balance_after' => $startingCrdb + 1250000.00 - 850000.00,
                'description' => 'Rent payment for July 2026 - Kariakoo shop premises',
                'reference_number' => 'CRDB-WTH-20260620',
                'reconciled' => true,
                'reconciled_at' => '2026-06-21 10:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $crdbId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-06-25',
                'type' => 'withdrawal',
                'amount' => 3200000.00,
                'balance_after' => $startingCrdb + 1250000.00 - 850000.00 - 3200000.00,
                'description' => 'Payment to Generic Pharma Ltd for Invoice GP-4521',
                'reference_number' => 'CRDB-WTH-20260625',
                'reconciled' => true,
                'reconciled_at' => '2026-06-26 11:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $crdbId,
                'journal_entry_id' => $journalEntryIds['JE-2026-0003'] ?? null,
                'transaction_date' => '2026-06-30',
                'type' => 'deposit',
                'amount' => 2250000.00,
                'balance_after' => $startingCrdb + 1250000.00 - 850000.00 - 3200000.00 + 2250000.00,
                'description' => 'End of month sales deposit - June 2026 total collections',
                'reference_number' => 'CRDB-DEP-20260630',
                'reconciled' => true,
                'reconciled_at' => '2026-07-01 08:30:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $crdbId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-07-10',
                'type' => 'transfer',
                'amount' => 200000.00,
                'balance_after' => $startingCrdb + 1250000.00 - 850000.00 - 3200000.00 + 2250000.00 - 200000.00,
                'description' => 'Transfer to Vodacom M-Pesa for petty cash float',
                'reference_number' => 'CRDB-TRF-20260710',
                'reconciled' => false,
                'reconciled_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // ── M-Pesa transactions ─────────────────────────────────────────
            [
                'bank_account_id' => $mpesaId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-06-18',
                'type' => 'deposit',
                'amount' => 180000.00,
                'balance_after' => $startingMpesa + 180000.00,
                'description' => 'Mobile payments received from customers',
                'reference_number' => 'MPESA-DEP-20260618',
                'reconciled' => true,
                'reconciled_at' => '2026-06-19 09:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $mpesaId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-06-28',
                'type' => 'withdrawal',
                'amount' => 75000.00,
                'balance_after' => $startingMpesa + 180000.00 - 75000.00,
                'description' => 'Electricity bill payment via M-Pesa',
                'reference_number' => 'MPESA-WTH-20260628',
                'reconciled' => true,
                'reconciled_at' => '2026-06-29 10:00:00',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'bank_account_id' => $mpesaId,
                'journal_entry_id' => null,
                'transaction_date' => '2026-07-10',
                'type' => 'transfer',
                'amount' => 200000.00,
                'balance_after' => $startingMpesa + 180000.00 - 75000.00 + 200000.00,
                'description' => 'Transfer received from CRDB Bank - petty cash float',
                'reference_number' => 'MPESA-TRF-20260710',
                'reconciled' => false,
                'reconciled_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('bank_transactions')->insert($transactions);
    }

    private function seedBudgets(array $accounts): void
    {
        $now = now();
        $year = 2026;
        $month = 7;

        $budgetItems = [
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['5100'],
                'budget_year' => $year,
                'budget_month' => $month,
                'budgeted_amount' => 5000000.00,
                'actual_amount' => 3150000.00,
                'variance' => -1850000.00,
                'notes' => 'Drug purchases for July - mid-month tracking shows under-budget due to delayed NutriVita delivery',
                'created_by' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['5200'],
                'budget_year' => $year,
                'budget_month' => $month,
                'budgeted_amount' => 850000.00,
                'actual_amount' => 850000.00,
                'variance' => 0.00,
                'notes' => 'Shop premises rent - Kariakoo, fixed monthly amount',
                'created_by' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['5400'],
                'budget_year' => $year,
                'budget_month' => $month,
                'budgeted_amount' => 2700000.00,
                'actual_amount' => 2650000.00,
                'variance' => -50000.00,
                'notes' => 'Staff salaries - Aisha on maternity leave, partial month deduction applied',
                'created_by' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['5300'],
                'budget_year' => $year,
                'budget_month' => $month,
                'budgeted_amount' => 350000.00,
                'actual_amount' => 312000.00,
                'variance' => -38000.00,
                'notes' => 'Electricity, water, Tigo internet, and office phone - below budget due to power saving measures',
                'created_by' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'account_id' => $accounts['5500'],
                'budget_year' => $year,
                'budget_month' => $month,
                'budgeted_amount' => 250000.00,
                'actual_amount' => 0.00,
                'variance' => -250000.00,
                'notes' => 'Annual insurance premium - paid quarterly, next payment due September 2026',
                'created_by' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('budgets')->insert($budgetItems);
    }

    private function seedTaxRecords(): void
    {
        $now = now();

        $records = [
            [
                'pharmacy_id' => 1,
                'tax_type' => 'VAT',
                'period_month' => 6,
                'period_year' => 2026,
                'taxable_amount' => 3750000.00,
                'tax_amount' => 675000.00,
                'status' => 'paid',
                'filed_date' => '2026-07-15',
                'payment_date' => '2026-07-18',
                'receipt_number' => 'TRA-VAT-2026-06-4521',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'tax_type' => 'VAT',
                'period_month' => 7,
                'period_year' => 2026,
                'taxable_amount' => 4100000.00,
                'tax_amount' => 738000.00,
                'status' => 'filed',
                'filed_date' => '2026-07-20',
                'payment_date' => null,
                'receipt_number' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'pharmacy_id' => 1,
                'tax_type' => 'PAYE',
                'period_month' => 7,
                'period_year' => 2026,
                'taxable_amount' => 3650000.00,
                'tax_amount' => 547500.00,
                'status' => 'draft',
                'filed_date' => null,
                'payment_date' => null,
                'receipt_number' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('tax_records')->insert($records);
    }
}
