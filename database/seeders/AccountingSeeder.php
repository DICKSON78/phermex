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

            // Additional Assets
            ['pharmacy_id' => 1, 'account_code' => '1600', 'account_name' => 'Prepaid Expenses', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Prepaid rent, insurance and subscriptions', 'is_active' => true, 'balance' => 750000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1700', 'account_name' => 'Petty Cash', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Small cash fund for minor expenses', 'is_active' => true, 'balance' => 150000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '1800', 'account_name' => 'Accumulated Depreciation', 'account_type' => 'asset', 'parent_id' => $parentIds['1000'], 'description' => 'Total depreciation on fixed assets to date', 'is_active' => true, 'balance' => 2125000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Additional Liabilities
            ['pharmacy_id' => 1, 'account_code' => '2400', 'account_name' => 'Accrued Expenses', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Expenses incurred but not yet invoiced', 'is_active' => true, 'balance' => 425000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '2500', 'account_name' => 'Tax Withheld Payable', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Withholding tax deducted from supplier payments', 'is_active' => true, 'balance' => 180000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '2600', 'account_name' => 'Customer Deposits', 'account_type' => 'liability', 'parent_id' => $parentIds['2000'], 'description' => 'Advance payments received from customers', 'is_active' => true, 'balance' => 350000.00, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Additional Equity
            ['pharmacy_id' => 1, 'account_code' => '3300', 'account_name' => 'Current Year Earnings', 'account_type' => 'equity', 'parent_id' => $parentIds['3000'], 'description' => 'Net income for the current financial year', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Additional Revenue
            ['pharmacy_id' => 1, 'account_code' => '4300', 'account_name' => 'Consultation Income', 'account_type' => 'revenue', 'parent_id' => $parentIds['4000'], 'description' => 'Revenue from patient consultations', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '4400', 'account_name' => 'Delivery Income', 'account_type' => 'revenue', 'parent_id' => $parentIds['4000'], 'description' => 'Revenue from drug delivery charges', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '4500', 'account_name' => 'Advertising Revenue', 'account_type' => 'revenue', 'parent_id' => $parentIds['4000'], 'description' => 'Revenue from advertising space and promotions', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],

            // Additional Expenses
            ['pharmacy_id' => 1, 'account_code' => '5700', 'account_name' => 'Marketing Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Advertising, promotions and marketing costs', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5800', 'account_name' => 'Office Supplies Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Stationery, printing and office consumables', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_code' => '5900', 'account_name' => 'Maintenance Expense', 'account_type' => 'expense', 'parent_id' => $parentIds['5000'], 'description' => 'Equipment maintenance and repair costs', 'is_active' => true, 'balance' => 0, 'currency' => 'TZS', 'created_at' => $now, 'updated_at' => $now],
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
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'NMB Bank Plc', 'account_name' => 'PharmEx NMB Business', 'account_number' => '0285674312987', 'swift_code' => 'NMBBTZTZ', 'opening_balance' => 2800000.00, 'current_balance' => 3150000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'NBC Bank Ltd', 'account_name' => 'PharmEx NBC Savings', 'account_number' => '0312456789123', 'swift_code' => 'NBICKTZT', 'opening_balance' => 1500000.00, 'current_balance' => 1750000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Stanbic Bank Tanzania', 'account_name' => 'PharmEx Corporate Account', 'account_number' => '0421987654321', 'swift_code' => 'SBICKTZX', 'opening_balance' => 6500000.00, 'current_balance' => 7200000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Standard Chartered Bank', 'account_name' => 'PharmEx SCB Current', 'account_number' => '0587123456789', 'swift_code' => 'SCBLTZTZ', 'opening_balance' => 3200000.00, 'current_balance' => 2900000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Equity Bank Tanzania', 'account_name' => 'PharmEx Equity Business', 'account_number' => '0634567891234', 'swift_code' => 'EQBLTZTZ', 'opening_balance' => 1800000.00, 'current_balance' => 2100000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Exim Bank Tanzania', 'account_name' => 'PharmEx Trade Finance', 'account_number' => '0765432198765', 'swift_code' => 'EXTZTZTZ', 'opening_balance' => 4500000.00, 'current_balance' => 4800000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'TPB Bank Ltd', 'account_name' => 'PharmEx TPB Operating', 'account_number' => '0898765432198', 'swift_code' => 'TPBBTZTZ', 'opening_balance' => 900000.00, 'current_balance' => 1050000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Akiba Commercial Bank', 'account_name' => 'PharmEx Akiba Savings', 'account_number' => '0912348765432', 'swift_code' => 'ACBLTZTZ', 'opening_balance' => 600000.00, 'current_balance' => 725000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Tigo Pesa', 'account_name' => 'PharmEx Tigo Mobile', 'account_number' => '0783456123', 'swift_code' => null, 'opening_balance' => 200000.00, 'current_balance' => 320000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Airtel Money', 'account_name' => 'PharmEx Airtel Mobile', 'account_number' => '0756781234', 'swift_code' => null, 'opening_balance' => 175000.00, 'current_balance' => 290000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Halotel Pesa', 'account_name' => 'PharmEx Halotel Mobile', 'account_number' => '0621987456', 'swift_code' => null, 'opening_balance' => 100000.00, 'current_balance' => 145000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'CRDB Bank Plc', 'account_name' => 'PharmEx Payroll Account', 'account_number' => '0150987123456', 'swift_code' => 'CORBTZTZ', 'opening_balance' => 2500000.00, 'current_balance' => 2300000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'NMB Bank Plc', 'account_name' => 'PharmEx Tax Remittance', 'account_number' => '0285111222333', 'swift_code' => 'NMBBTZTZ', 'opening_balance' => 1200000.00, 'current_balance' => 980000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'CRDB Bank Plc', 'account_name' => 'PharmEx CRDB Savings', 'account_number' => '0150444555666', 'swift_code' => 'CORBTZTZ', 'opening_balance' => 3000000.00, 'current_balance' => 3450000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Stanbic Bank Tanzania', 'account_name' => 'PharmEx Loan Account', 'account_number' => '0421555666777', 'swift_code' => 'SBICKTZX', 'opening_balance' => 5000000.00, 'current_balance' => 4200000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Equity Bank Tanzania', 'account_name' => 'PharmEx Fixed Deposit', 'account_number' => '0634111222333', 'swift_code' => 'EQBLTZTZ', 'opening_balance' => 10000000.00, 'current_balance' => 10000000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'NBC Bank Ltd', 'account_name' => 'PharmEx Petty Cash Bank', 'account_number' => '0312777888999', 'swift_code' => 'NBICKTZT', 'opening_balance' => 500000.00, 'current_balance' => 425000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Vodacom M-Pesa', 'account_name' => 'PharmEx M-Pesa Business Till', 'account_number' => '0719888777', 'swift_code' => null, 'opening_balance' => 450000.00, 'current_balance' => 620000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Standard Chartered Bank', 'account_name' => 'PharmEx SCB USD Account', 'account_number' => '0587999000111', 'swift_code' => 'SCBLTZTZ', 'opening_balance' => 2500.00, 'current_balance' => 3200.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'CRDB Bank Plc', 'account_name' => 'PharmEx CRDB USD Account', 'account_number' => '0150222333444', 'swift_code' => 'CORBTZTZ', 'opening_balance' => 1800.00, 'current_balance' => 2100.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'NMB Bank Plc', 'account_name' => 'PharmEx Agricultural Account', 'account_number' => '0285444555666', 'swift_code' => 'NMBBTZTZ', 'opening_balance' => 800000.00, 'current_balance' => 950000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Exim Bank Tanzania', 'account_name' => 'PharmEx Import Account', 'account_number' => '0765111222333', 'swift_code' => 'EXTZTZTZ', 'opening_balance' => 3500000.00, 'current_balance' => 3800000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'TPB Bank Ltd', 'account_name' => 'PharmEx Government Payments', 'account_number' => '0898444555666', 'swift_code' => 'TPBBTZTZ', 'opening_balance' => 750000.00, 'current_balance' => 680000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Akiba Commercial Bank', 'account_name' => 'PharmEx Investment Account', 'account_number' => '0912777888999', 'swift_code' => 'ACBLTZTZ', 'opening_balance' => 2000000.00, 'current_balance' => 2000000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Airtel Money', 'account_name' => 'PharmEx Airtel Business', 'account_number' => '0756111222', 'swift_code' => null, 'opening_balance' => 120000.00, 'current_balance' => 185000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Tigo Pesa', 'account_name' => 'PharmEx Tigo Business', 'account_number' => '0783222333', 'swift_code' => null, 'opening_balance' => 150000.00, 'current_balance' => 230000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Stanbic Bank Tanzania', 'account_name' => 'PharmEx Salary Disbursement', 'account_number' => '0421888999000', 'swift_code' => 'SBICKTZX', 'opening_balance' => 1500000.00, 'current_balance' => 1350000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Equity Bank Tanzania', 'account_name' => 'PharmEx Equity Savings', 'account_number' => '0634222333444', 'swift_code' => 'EQBLTZTZ', 'opening_balance' => 900000.00, 'current_balance' => 1100000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['1200'], 'bank_name' => 'Halotel Pesa', 'account_name' => 'PharmEx Halotel Business', 'account_number' => '0621333444', 'swift_code' => null, 'opening_balance' => 80000.00, 'current_balance' => 110000.00, 'is_default' => false, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
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

        // ── Entries 5–35: Additional journal entries (batch) ────────────────
        $newEntries = [
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0005', 'entry_date' => '2026-01-05', 'description' => 'Petty cash replenishment from CRDB bank', 'reference_type' => 'bank_transfer', 'reference_id' => null, 'total_debit' => 150000.00, 'total_credit' => 150000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-01-05 09:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0006', 'entry_date' => '2026-01-10', 'description' => 'Water bill payment - DAWASCO January 2026', 'reference_type' => 'utility_bill', 'reference_id' => null, 'total_debit' => 85000.00, 'total_credit' => 85000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-01-10 11:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0007', 'entry_date' => '2026-01-15', 'description' => 'Cash drug sales recorded for first half of January', 'reference_type' => 'sales_summary', 'reference_id' => null, 'total_debit' => 1850000.00, 'total_credit' => 1850000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-01-15 18:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0008', 'entry_date' => '2026-01-20', 'description' => 'Insurance claim payment received from NHIF', 'reference_type' => 'insurance_claim', 'reference_id' => 3, 'total_debit' => 2200000.00, 'total_credit' => 2200000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-01-20 14:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0009', 'entry_date' => '2026-01-25', 'description' => 'Purchase of new refrigerator for drug storage', 'reference_type' => 'asset_purchase', 'reference_id' => null, 'total_debit' => 1800000.00, 'total_credit' => 1800000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-01-25 10:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0010', 'entry_date' => '2026-02-01', 'description' => 'Monthly loan repayment to Stanbic Bank', 'reference_type' => 'loan_payment', 'reference_id' => null, 'total_debit' => 500000.00, 'total_credit' => 500000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-02-01 09:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0011', 'entry_date' => '2026-02-05', 'description' => 'Facebook and Instagram advertising - February 2026', 'reference_type' => 'marketing', 'reference_id' => null, 'total_debit' => 350000.00, 'total_credit' => 350000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-02-05 16:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0012', 'entry_date' => '2026-02-10', 'description' => 'Customer payment on account - Mwanjila Clinic', 'reference_type' => 'customer_payment', 'reference_id' => 5, 'total_debit' => 950000.00, 'total_credit' => 950000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-02-10 13:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0013', 'entry_date' => '2026-02-15', 'description' => 'Payment to NMB supplier for January drugs order', 'reference_type' => 'supplier_payment', 'reference_id' => 2, 'total_debit' => 2800000.00, 'total_credit' => 2800000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-02-15 11:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0014', 'entry_date' => '2026-02-20', 'description' => 'Consultation services rendered to walk-in patients', 'reference_type' => 'service_income', 'reference_id' => null, 'total_debit' => 450000.00, 'total_credit' => 450000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-02-20 17:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0015', 'entry_date' => '2026-02-28', 'description' => 'Office supplies purchase from Office Max Dar', 'reference_type' => 'expense', 'reference_id' => null, 'total_debit' => 125000.00, 'total_credit' => 125000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-02-28 10:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0016', 'entry_date' => '2026-03-01', 'description' => 'VAT remittance to TRA for January-February 2026', 'reference_type' => 'tax_payment', 'reference_id' => null, 'total_debit' => 1350000.00, 'total_credit' => 1350000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-03-01 09:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0017', 'entry_date' => '2026-03-05', 'description' => 'Delivery income collected from customer orders', 'reference_type' => 'delivery_income', 'reference_id' => null, 'total_debit' => 180000.00, 'total_credit' => 180000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-03-05 16:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0018', 'entry_date' => '2026-03-10', 'description' => 'Air conditioner repair and maintenance', 'reference_type' => 'maintenance', 'reference_id' => null, 'total_debit' => 280000.00, 'total_credit' => 280000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-03-10 14:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0019', 'entry_date' => '2026-03-15', 'description' => 'Transfer from CRDB main to NMB business account', 'reference_type' => 'bank_transfer', 'reference_id' => null, 'total_debit' => 1000000.00, 'total_credit' => 1000000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-03-15 10:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0020', 'entry_date' => '2026-03-20', 'description' => 'Purchase of Metformin and Amlodipine from Pharma Distributors', 'reference_type' => 'purchase_order', 'reference_id' => 3, 'total_debit' => 4200000.00, 'total_credit' => 4200000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-03-20 15:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0021', 'entry_date' => '2026-03-31', 'description' => 'March 2026 monthly sales revenue summary', 'reference_type' => 'sales_summary', 'reference_id' => null, 'total_debit' => 5100000.00, 'total_credit' => 5100000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-03-31 18:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0022', 'entry_date' => '2026-04-05', 'description' => 'M-Pesa mobile sales deposited to CRDB account', 'reference_type' => 'bank_deposit', 'reference_id' => null, 'total_debit' => 750000.00, 'total_credit' => 750000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-04-05 09:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0023', 'entry_date' => '2026-04-10', 'description' => 'Radio advertisement on Times FM - April campaign', 'reference_type' => 'marketing', 'reference_id' => null, 'total_debit' => 500000.00, 'total_credit' => 500000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-04-10 11:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0024', 'entry_date' => '2026-04-15', 'description' => 'Quarterly depreciation of fixed assets - Q1 2026', 'reference_type' => 'depreciation', 'reference_id' => null, 'total_debit' => 708333.00, 'total_credit' => 708333.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-04-15 16:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0025', 'entry_date' => '2026-04-20', 'description' => 'Customer advance payment for bulk order - Kilimanjaro Hospital', 'reference_type' => 'customer_deposit', 'reference_id' => 7, 'total_debit' => 3500000.00, 'total_credit' => 3500000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-04-20 14:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0026', 'entry_date' => '2026-04-25', 'description' => 'PAYE tax remittance to TRA for March 2026 employees', 'reference_type' => 'tax_payment', 'reference_id' => null, 'total_debit' => 547500.00, 'total_credit' => 547500.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-04-25 09:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0027', 'entry_date' => '2026-05-01', 'description' => 'Staff performance bonus for Q1 2026', 'reference_type' => 'bonus', 'reference_id' => null, 'total_debit' => 800000.00, 'total_credit' => 800000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-05-01 10:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0028', 'entry_date' => '2026-05-10', 'description' => 'Drug return credit from Generic Pharma Ltd for damaged batch', 'reference_type' => 'purchase_return', 'reference_id' => 1, 'total_debit' => 320000.00, 'total_credit' => 320000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-05-10 13:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0029', 'entry_date' => '2026-05-15', 'description' => 'Bank interest earned on CRDB savings account - Q1', 'reference_type' => 'interest_income', 'reference_id' => null, 'total_debit' => 125000.00, 'total_credit' => 125000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-05-15 09:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0030', 'entry_date' => '2026-05-20', 'description' => 'Annual pharmacy operating license renewal fee', 'reference_type' => 'license_fee', 'reference_id' => null, 'total_debit' => 450000.00, 'total_credit' => 450000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-05-20 14:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0031', 'entry_date' => '2026-06-01', 'description' => 'Additional capital injection by owner', 'reference_type' => 'capital_injection', 'reference_id' => null, 'total_debit' => 5000000.00, 'total_credit' => 5000000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-06-01 09:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0032', 'entry_date' => '2026-06-10', 'description' => 'Inter-branch inventory transfer to Arusha branch', 'reference_type' => 'inventory_transfer', 'reference_id' => null, 'total_debit' => 1200000.00, 'total_credit' => 1200000.00, 'status' => 'posted', 'posted_by' => 3, 'posted_at' => '2026-06-10 11:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0033', 'entry_date' => '2026-06-20', 'description' => 'Prepaid insurance premium for Q3 2026', 'reference_type' => 'prepayment', 'reference_id' => null, 'total_debit' => 450000.00, 'total_credit' => 450000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-06-20 10:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0034', 'entry_date' => '2026-07-01', 'description' => 'Consulting service income from Mwanjila Clinic', 'reference_type' => 'service_income', 'reference_id' => 5, 'total_debit' => 650000.00, 'total_credit' => 650000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-07-01 15:00:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
            ['pharmacy_id' => 1, 'entry_number' => 'JE-2026-0035', 'entry_date' => '2026-07-15', 'description' => 'Month-end inventory adjustment - physical count variance', 'reference_type' => 'inventory_adjustment', 'reference_id' => null, 'total_debit' => 185000.00, 'total_credit' => 185000.00, 'status' => 'posted', 'posted_by' => 2, 'posted_at' => '2026-07-15 17:30:00', 'reversed_by' => null, 'reversed_at' => null, 'reversal_reason' => null, 'created_at' => now()->subDays(rand(0, 29)), 'updated_at' => now()->subDays(rand(0, 29))],
        ];
        DB::table('journal_entries')->insert($newEntries);

        $allEntryRows = DB::table('journal_entries')->where('pharmacy_id', 1)->get();
        foreach ($allEntryRows as $row) { $entryIds[$row->entry_number] = $row->id; }

        $newLines = [
            ['journal_entry_id' => $entryIds['JE-2026-0005'], 'account_id' => $accounts['1700'], 'debit' => 150000.00, 'credit' => 0, 'description' => 'Petty cash replenishment from bank', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0005'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 150000.00, 'description' => 'CRDB bank withdrawal for petty cash', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0006'], 'account_id' => $accounts['5300'], 'debit' => 85000.00, 'credit' => 0, 'description' => 'DAWASCO water bill - January 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0006'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 85000.00, 'description' => 'Payment via CRDB bank transfer', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0007'], 'account_id' => $accounts['1100'], 'debit' => 1200000.00, 'credit' => 0, 'description' => 'Cash collected from drug sales', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0007'], 'account_id' => $accounts['1200'], 'debit' => 650000.00, 'credit' => 0, 'description' => 'M-Pesa payments deposited to bank', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0007'], 'account_id' => $accounts['4100'], 'debit' => 0, 'credit' => 1850000.00, 'description' => 'Drug sales revenue - January first half', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0008'], 'account_id' => $accounts['1200'], 'debit' => 2200000.00, 'credit' => 0, 'description' => 'NHIF payment received via bank transfer', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0008'], 'account_id' => $accounts['1400'], 'debit' => 0, 'credit' => 2200000.00, 'description' => 'Settlement of outstanding NHIF claims', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0009'], 'account_id' => $accounts['1500'], 'debit' => 1800000.00, 'credit' => 0, 'description' => 'Pharmaceutical refrigerator purchased', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0009'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 1800000.00, 'description' => 'Payment via CRDB bank transfer', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0010'], 'account_id' => $accounts['2200'], 'debit' => 500000.00, 'credit' => 0, 'description' => 'Principal repayment on Stanbic loan', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0010'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 500000.00, 'description' => 'Automated debit from Stanbic account', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0011'], 'account_id' => $accounts['5700'], 'debit' => 350000.00, 'credit' => 0, 'description' => 'Social media advertising spend', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0011'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 350000.00, 'description' => 'Payment via CRDB credit card', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0012'], 'account_id' => $accounts['1200'], 'debit' => 950000.00, 'credit' => 0, 'description' => 'Bank transfer received from Mwanjila Clinic', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0012'], 'account_id' => $accounts['1400'], 'debit' => 0, 'credit' => 950000.00, 'description' => 'Accounts receivable settled', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0013'], 'account_id' => $accounts['2100'], 'debit' => 2800000.00, 'credit' => 0, 'description' => 'Settling payable to NMB supplier', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0013'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 2800000.00, 'description' => 'CRDB bank transfer to supplier', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0014'], 'account_id' => $accounts['1100'], 'debit' => 450000.00, 'credit' => 0, 'description' => 'Cash received for consultations', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0014'], 'account_id' => $accounts['4300'], 'debit' => 0, 'credit' => 450000.00, 'description' => 'Consultation income - February 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0015'], 'account_id' => $accounts['5800'], 'debit' => 125000.00, 'credit' => 0, 'description' => 'Stationery and printing materials', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0015'], 'account_id' => $accounts['1100'], 'debit' => 0, 'credit' => 125000.00, 'description' => 'Paid from petty cash', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0016'], 'account_id' => $accounts['2300'], 'debit' => 1350000.00, 'credit' => 0, 'description' => 'VAT payable to TRA for Jan-Feb', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0016'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 1350000.00, 'description' => 'TRC bank payment for VAT', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0017'], 'account_id' => $accounts['1100'], 'debit' => 120000.00, 'credit' => 0, 'description' => 'Cash delivery charges collected', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0017'], 'account_id' => $accounts['1200'], 'debit' => 60000.00, 'credit' => 0, 'description' => 'M-Pesa delivery payments', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0017'], 'account_id' => $accounts['4400'], 'debit' => 0, 'credit' => 180000.00, 'description' => 'Delivery income - March 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0018'], 'account_id' => $accounts['5900'], 'debit' => 280000.00, 'credit' => 0, 'description' => 'AC repair by Cool Breeze Engineers', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0018'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 280000.00, 'description' => 'Bank transfer payment', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0019'], 'account_id' => $accounts['1200'], 'debit' => 1000000.00, 'credit' => 0, 'description' => 'Funds received in NMB business account', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0019'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 1000000.00, 'description' => 'Funds sent from CRDB main account', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0020'], 'account_id' => $accounts['1300'], 'debit' => 3600000.00, 'credit' => 0, 'description' => 'Inventory increase - Metformin and Amlodipine', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0020'], 'account_id' => $accounts['2300'], 'debit' => 0, 'credit' => 600000.00, 'description' => 'VAT input on purchase', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0020'], 'account_id' => $accounts['2100'], 'debit' => 0, 'credit' => 4200000.00, 'description' => 'Amount owed to Pharma Distributors Ltd', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0021'], 'account_id' => $accounts['1200'], 'debit' => 4200000.00, 'credit' => 0, 'description' => 'Bank deposits from March sales', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0021'], 'account_id' => $accounts['1400'], 'debit' => 900000.00, 'credit' => 0, 'description' => 'Credit sales to insurance customers', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0021'], 'account_id' => $accounts['4100'], 'debit' => 0, 'credit' => 4500000.00, 'description' => 'Drug sales revenue - March 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0021'], 'account_id' => $accounts['4200'], 'debit' => 0, 'credit' => 600000.00, 'description' => 'Service income - consultations', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0022'], 'account_id' => $accounts['1200'], 'debit' => 750000.00, 'credit' => 0, 'description' => 'CRDB account credited from M-Pesa', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0022'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 750000.00, 'description' => 'M-Pesa business till balance transferred', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0023'], 'account_id' => $accounts['5700'], 'debit' => 500000.00, 'credit' => 0, 'description' => 'Times FM radio ad campaign', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0023'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 500000.00, 'description' => 'Payment via Stanbic corporate account', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0024'], 'account_id' => $accounts['5600'], 'debit' => 708333.00, 'credit' => 0, 'description' => 'Q1 2026 depreciation on equipment', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0024'], 'account_id' => $accounts['1800'], 'debit' => 0, 'credit' => 708333.00, 'description' => 'Accumulated depreciation - Q1 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0025'], 'account_id' => $accounts['1200'], 'debit' => 3500000.00, 'credit' => 0, 'description' => 'Bank transfer from Kilimanjaro Hospital', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0025'], 'account_id' => $accounts['2600'], 'debit' => 0, 'credit' => 3500000.00, 'description' => 'Advance payment for bulk drug order', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0026'], 'account_id' => $accounts['2500'], 'debit' => 547500.00, 'credit' => 0, 'description' => 'PAYE remittance to TRA', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0026'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 547500.00, 'description' => 'Tax payment via NMB bank', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0027'], 'account_id' => $accounts['5400'], 'debit' => 800000.00, 'credit' => 0, 'description' => 'Q1 performance bonuses for 6 staff', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0027'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 800000.00, 'description' => 'Bonus payments via bank transfer', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0028'], 'account_id' => $accounts['2100'], 'debit' => 320000.00, 'credit' => 0, 'description' => 'Credit note received from Generic Pharma Ltd', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0028'], 'account_id' => $accounts['1300'], 'debit' => 0, 'credit' => 320000.00, 'description' => 'Inventory reduced - damaged batch returned', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0029'], 'account_id' => $accounts['1200'], 'debit' => 125000.00, 'credit' => 0, 'description' => 'Interest credited to CRDB savings', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0029'], 'account_id' => $accounts['4500'], 'debit' => 0, 'credit' => 125000.00, 'description' => 'Bank interest income - Q1 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0030'], 'account_id' => $accounts['5700'], 'debit' => 450000.00, 'credit' => 0, 'description' => 'Pharmacy license renewal - TMDA', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0030'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 450000.00, 'description' => 'Payment via CRDB bank', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0031'], 'account_id' => $accounts['1200'], 'debit' => 5000000.00, 'credit' => 0, 'description' => 'Funds deposited to CRDB account', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0031'], 'account_id' => $accounts['3100'], 'debit' => 0, 'credit' => 5000000.00, 'description' => 'Additional owner equity contribution', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0032'], 'account_id' => $accounts['1300'], 'debit' => 0, 'credit' => 1200000.00, 'description' => 'Inventory sent to Arusha branch', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0032'], 'account_id' => $accounts['1300'], 'debit' => 1200000.00, 'credit' => 0, 'description' => 'Inventory received at Dar main branch', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0033'], 'account_id' => $accounts['1600'], 'debit' => 450000.00, 'credit' => 0, 'description' => 'Prepaid insurance premium Q3 2026', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0033'], 'account_id' => $accounts['1200'], 'debit' => 0, 'credit' => 450000.00, 'description' => 'Payment via Equity Bank transfer', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0034'], 'account_id' => $accounts['1400'], 'debit' => 650000.00, 'credit' => 0, 'description' => 'Amount billed to Mwanjila Clinic', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0034'], 'account_id' => $accounts['4300'], 'debit' => 0, 'credit' => 650000.00, 'description' => 'Consulting service income', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0035'], 'account_id' => $accounts['1300'], 'debit' => 185000.00, 'credit' => 0, 'description' => 'Inventory surplus from physical count', 'created_at' => $now, 'updated_at' => $now],
            ['journal_entry_id' => $entryIds['JE-2026-0035'], 'account_id' => $accounts['5100'], 'debit' => 0, 'credit' => 185000.00, 'description' => 'Cost of goods sold adjustment', 'created_at' => $now, 'updated_at' => $now],
        ];
        DB::table('journal_lines')->insert($newLines);

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
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-05', 'type' => 'withdrawal', 'amount' => 150000.00, 'balance_after' => $startingCrdb - 150000.00, 'description' => 'Petty cash replenishment withdrawal', 'reference_number' => 'CRDB-WTH-20260105', 'reconciled' => true, 'reconciled_at' => '2026-01-06 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-10', 'type' => 'withdrawal', 'amount' => 85000.00, 'balance_after' => $startingCrdb - 235000.00, 'description' => 'DAWASCO water bill payment', 'reference_number' => 'CRDB-WTH-20260110', 'reconciled' => true, 'reconciled_at' => '2026-01-11 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-20', 'type' => 'deposit', 'amount' => 2200000.00, 'balance_after' => $startingCrdb + 1965000.00, 'description' => 'NHIF insurance claim payment received', 'reference_number' => 'CRDB-DEP-20260120', 'reconciled' => true, 'reconciled_at' => '2026-01-21 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-25', 'type' => 'withdrawal', 'amount' => 1800000.00, 'balance_after' => $startingCrdb + 165000.00, 'description' => 'Payment for pharmaceutical refrigerator', 'reference_number' => 'CRDB-WTH-20260125', 'reconciled' => true, 'reconciled_at' => '2026-01-26 11:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-02-01', 'type' => 'withdrawal', 'amount' => 500000.00, 'balance_after' => $startingCrdb - 335000.00, 'description' => 'Stanbic loan repayment - automated debit', 'reference_number' => 'CRDB-WTH-20260201', 'reconciled' => true, 'reconciled_at' => '2026-02-02 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-02-10', 'type' => 'deposit', 'amount' => 950000.00, 'balance_after' => $startingCrdb + 615000.00, 'description' => 'Customer payment from Mwanjila Clinic', 'reference_number' => 'CRDB-DEP-20260210', 'reconciled' => true, 'reconciled_at' => '2026-02-11 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-02-15', 'type' => 'withdrawal', 'amount' => 2800000.00, 'balance_after' => $startingCrdb - 2185000.00, 'description' => 'Payment to NMB supplier for January drugs', 'reference_number' => 'CRDB-WTH-20260215', 'reconciled' => true, 'reconciled_at' => '2026-02-16 11:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-15', 'type' => 'deposit', 'amount' => 320000.00, 'balance_after' => $startingMpesa + 320000.00, 'description' => 'M-Pesa mobile payments received - January', 'reference_number' => 'MPESA-DEP-20260115', 'reconciled' => true, 'reconciled_at' => '2026-01-16 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-01-28', 'type' => 'withdrawal', 'amount' => 75000.00, 'balance_after' => $startingMpesa + 245000.00, 'description' => 'TANESCO electricity bill payment', 'reference_number' => 'MPESA-WTH-20260128', 'reconciled' => true, 'reconciled_at' => '2026-01-29 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-02-18', 'type' => 'deposit', 'amount' => 280000.00, 'balance_after' => $startingMpesa + 525000.00, 'description' => 'M-Pesa mobile payments received - February', 'reference_number' => 'MPESA-DEP-20260218', 'reconciled' => true, 'reconciled_at' => '2026-02-19 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-02-28', 'type' => 'withdrawal', 'amount' => 65000.00, 'balance_after' => $startingMpesa + 460000.00, 'description' => 'Internet bill payment via M-Pesa', 'reference_number' => 'MPESA-WTH-20260228', 'reconciled' => true, 'reconciled_at' => '2026-03-01 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-03-15', 'type' => 'transfer', 'amount' => 1000000.00, 'balance_after' => $startingCrdb - 3185000.00, 'description' => 'Transfer to NMB business account', 'reference_number' => 'CRDB-TRF-20260315', 'reconciled' => true, 'reconciled_at' => '2026-03-16 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-03-31', 'type' => 'deposit', 'amount' => 4200000.00, 'balance_after' => $startingCrdb + 1015000.00, 'description' => 'End of month sales deposit - March 2026', 'reference_number' => 'CRDB-DEP-20260331', 'reconciled' => true, 'reconciled_at' => '2026-04-01 08:30:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-04-05', 'type' => 'deposit', 'amount' => 750000.00, 'balance_after' => $startingCrdb + 1765000.00, 'description' => 'M-Pesa sales deposited to CRDB', 'reference_number' => 'CRDB-DEP-20260405', 'reconciled' => true, 'reconciled_at' => '2026-04-06 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-04-10', 'type' => 'withdrawal', 'amount' => 500000.00, 'balance_after' => $startingCrdb + 1265000.00, 'description' => 'Times FM radio advertisement payment', 'reference_number' => 'CRDB-WTH-20260410', 'reconciled' => true, 'reconciled_at' => '2026-04-11 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-04-25', 'type' => 'withdrawal', 'amount' => 547500.00, 'balance_after' => $startingCrdb + 717500.00, 'description' => 'PAYE tax payment to TRA via NMB', 'reference_number' => 'CRDB-WTH-20260425', 'reconciled' => true, 'reconciled_at' => '2026-04-26 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-05-01', 'type' => 'withdrawal', 'amount' => 800000.00, 'balance_after' => $startingCrdb - 82500.00, 'description' => 'Staff performance bonus payments', 'reference_number' => 'CRDB-WTH-20260501', 'reconciled' => true, 'reconciled_at' => '2026-05-02 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-05-15', 'type' => 'deposit', 'amount' => 125000.00, 'balance_after' => $startingCrdb + 42500.00, 'description' => 'Bank interest credited to CRDB savings', 'reference_number' => 'CRDB-DEP-20260515', 'reconciled' => true, 'reconciled_at' => '2026-05-16 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-05-20', 'type' => 'withdrawal', 'amount' => 450000.00, 'balance_after' => $startingCrdb - 407500.00, 'description' => 'TMDA pharmacy license renewal', 'reference_number' => 'CRDB-WTH-20260520', 'reconciled' => true, 'reconciled_at' => '2026-05-21 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-06-01', 'type' => 'deposit', 'amount' => 5000000.00, 'balance_after' => $startingCrdb + 4592500.00, 'description' => 'Owner capital injection deposit', 'reference_number' => 'CRDB-DEP-20260601', 'reconciled' => true, 'reconciled_at' => '2026-06-02 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-03-18', 'type' => 'deposit', 'amount' => 350000.00, 'balance_after' => $startingMpesa + 810000.00, 'description' => 'M-Pesa mobile payments - March', 'reference_number' => 'MPESA-DEP-20260318', 'reconciled' => true, 'reconciled_at' => '2026-03-19 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-04-15', 'type' => 'deposit', 'amount' => 290000.00, 'balance_after' => $startingMpesa + 1100000.00, 'description' => 'M-Pesa mobile payments - April', 'reference_number' => 'MPESA-DEP-20260415', 'reconciled' => true, 'reconciled_at' => '2026-04-16 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-05-20', 'type' => 'withdrawal', 'amount' => 85000.00, 'balance_after' => $startingMpesa + 1015000.00, 'description' => 'Water bill payment via M-Pesa', 'reference_number' => 'MPESA-WTH-20260520', 'reconciled' => true, 'reconciled_at' => '2026-05-21 10:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-06-10', 'type' => 'deposit', 'amount' => 410000.00, 'balance_after' => $startingMpesa + 1425000.00, 'description' => 'M-Pesa mobile payments - May-June', 'reference_number' => 'MPESA-DEP-20260610', 'reconciled' => true, 'reconciled_at' => '2026-06-11 09:00:00', 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-07-15', 'type' => 'deposit', 'amount' => 1850000.00, 'balance_after' => $startingCrdb + 6442500.00, 'description' => 'Mid-month sales deposit - July 2026', 'reference_number' => 'CRDB-DEP-20260715', 'reconciled' => false, 'reconciled_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $crdbId, 'journal_entry_id' => null, 'transaction_date' => '2026-07-20', 'type' => 'withdrawal', 'amount' => 850000.00, 'balance_after' => $startingCrdb + 5592500.00, 'description' => 'Rent payment for August 2026', 'reference_number' => 'CRDB-WTH-20260720', 'reconciled' => false, 'reconciled_at' => null, 'created_at' => $now, 'updated_at' => $now],
            ['bank_account_id' => $mpesaId, 'journal_entry_id' => null, 'transaction_date' => '2026-07-12', 'type' => 'deposit', 'amount' => 380000.00, 'balance_after' => $startingMpesa + 1805000.00, 'description' => 'M-Pesa mobile payments - July', 'reference_number' => 'MPESA-DEP-20260712', 'reconciled' => false, 'reconciled_at' => null, 'created_at' => $now, 'updated_at' => $now],
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
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 1, 'budgeted_amount' => 4000000.00, 'actual_amount' => 3850000.00, 'variance' => -150000.00, 'notes' => 'January 2025 drug purchases - slight under-spend', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 2, 'budgeted_amount' => 4000000.00, 'actual_amount' => 4300000.00, 'variance' => 300000.00, 'notes' => 'February 2025 - excess due to emergency Malaria drug order', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 3, 'budgeted_amount' => 4500000.00, 'actual_amount' => 4200000.00, 'variance' => -300000.00, 'notes' => 'March 2025 - below budget, bulk order deferred to April', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 4, 'budgeted_amount' => 4200000.00, 'actual_amount' => 4250000.00, 'variance' => 50000.00, 'notes' => 'April 2025 - on target, deferred March bulk order processed', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 5, 'budgeted_amount' => 4300000.00, 'actual_amount' => 4100000.00, 'variance' => -200000.00, 'notes' => 'May 2025 - under-spend due to delayed supplier delivery', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 6, 'budgeted_amount' => 4400000.00, 'actual_amount' => 4600000.00, 'variance' => 200000.00, 'notes' => 'June 2025 - over-spend, rainy season malaria surge', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 7, 'budgeted_amount' => 4500000.00, 'actual_amount' => 4750000.00, 'variance' => 250000.00, 'notes' => 'July 2025 - malaria peak season overspend', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 8, 'budgeted_amount' => 4000000.00, 'actual_amount' => 3900000.00, 'variance' => -100000.00, 'notes' => 'August 2025 - return to normal spending', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 9, 'budgeted_amount' => 4000000.00, 'actual_amount' => 4050000.00, 'variance' => 50000.00, 'notes' => 'September 2025 - on target', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 10, 'budgeted_amount' => 3800000.00, 'actual_amount' => 3650000.00, 'variance' => -150000.00, 'notes' => 'October 2025 - seasonal dip in respiratory infections', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 11, 'budgeted_amount' => 4000000.00, 'actual_amount' => 4200000.00, 'variance' => 200000.00, 'notes' => 'November 2025 - pre-Christmas stock-up', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2025, 'budget_month' => 12, 'budgeted_amount' => 5000000.00, 'actual_amount' => 5500000.00, 'variance' => 500000.00, 'notes' => 'December 2025 - holiday season peak demand', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5200'], 'budget_year' => 2025, 'budget_month' => 1, 'budgeted_amount' => 800000.00, 'actual_amount' => 800000.00, 'variance' => 0.00, 'notes' => 'January 2025 - rent fixed at TZS 800k', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5200'], 'budget_year' => 2025, 'budget_month' => 7, 'budgeted_amount' => 800000.00, 'actual_amount' => 800000.00, 'variance' => 0.00, 'notes' => 'July 2025 - rent fixed', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5200'], 'budget_year' => 2026, 'budget_month' => 1, 'budgeted_amount' => 850000.00, 'actual_amount' => 850000.00, 'variance' => 0.00, 'notes' => 'January 2026 - rent increased to TZS 850k', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2025, 'budget_month' => 1, 'budgeted_amount' => 2500000.00, 'actual_amount' => 2450000.00, 'variance' => -50000.00, 'notes' => 'January 2025 salaries - slightly under due to late start', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2025, 'budget_month' => 6, 'budgeted_amount' => 2500000.00, 'actual_amount' => 2550000.00, 'variance' => 50000.00, 'notes' => 'June 2025 salaries - overtime bonus for weekend coverage', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2025, 'budget_month' => 12, 'budgeted_amount' => 2500000.00, 'actual_amount' => 2700000.00, 'variance' => 200000.00, 'notes' => 'December 2025 - Christmas bonus payments', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2026, 'budget_month' => 1, 'budgeted_amount' => 2600000.00, 'actual_amount' => 2600000.00, 'variance' => 0.00, 'notes' => 'January 2026 - salary increment applied', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5300'], 'budget_year' => 2025, 'budget_month' => 1, 'budgeted_amount' => 300000.00, 'actual_amount' => 285000.00, 'variance' => -15000.00, 'notes' => 'January 2025 utilities - lower than expected', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5300'], 'budget_year' => 2025, 'budget_month' => 7, 'budgeted_amount' => 350000.00, 'actual_amount' => 420000.00, 'variance' => 70000.00, 'notes' => 'July 2025 - high electricity from refrigerator running 24/7', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5300'], 'budget_year' => 2026, 'budget_month' => 1, 'budgeted_amount' => 320000.00, 'actual_amount' => 310000.00, 'variance' => -10000.00, 'notes' => 'January 2026 utilities - standard month', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5700'], 'budget_year' => 2026, 'budget_month' => 7, 'budgeted_amount' => 200000.00, 'actual_amount' => 180000.00, 'variance' => -20000.00, 'notes' => 'Marketing spend - Facebook and Instagram ads', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5800'], 'budget_year' => 2026, 'budget_month' => 7, 'budgeted_amount' => 100000.00, 'actual_amount' => 95000.00, 'variance' => -5000.00, 'notes' => 'Office supplies - paper, ink, toner', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5900'], 'budget_year' => 2026, 'budget_month' => 7, 'budgeted_amount' => 150000.00, 'actual_amount' => 125000.00, 'variance' => -25000.00, 'notes' => 'Building maintenance - air conditioning filter replacement', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2026, 'budget_month' => 8, 'budgeted_amount' => 5200000.00, 'actual_amount' => 0.00, 'variance' => -5200000.00, 'notes' => 'August 2026 projected - pending actual data', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2026, 'budget_month' => 8, 'budgeted_amount' => 2850000.00, 'actual_amount' => 0.00, 'variance' => -2850000.00, 'notes' => 'August 2026 projected salaries - includes new hire', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5200'], 'budget_year' => 2026, 'budget_month' => 8, 'budgeted_amount' => 850000.00, 'actual_amount' => 0.00, 'variance' => -850000.00, 'notes' => 'August 2026 projected rent', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5300'], 'budget_year' => 2026, 'budget_month' => 8, 'budgeted_amount' => 350000.00, 'actual_amount' => 0.00, 'variance' => -350000.00, 'notes' => 'August 2026 projected utilities', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5700'], 'budget_year' => 2026, 'budget_month' => 8, 'budgeted_amount' => 250000.00, 'actual_amount' => 0.00, 'variance' => -250000.00, 'notes' => 'August 2026 marketing - back-to-school campaign', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5600'], 'budget_year' => 2026, 'budget_month' => 9, 'budgeted_amount' => 4800000.00, 'actual_amount' => 0.00, 'variance' => -4800000.00, 'notes' => 'September 2026 projected drug purchases', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5400'], 'budget_year' => 2026, 'budget_month' => 9, 'budgeted_amount' => 2850000.00, 'actual_amount' => 0.00, 'variance' => -2850000.00, 'notes' => 'September 2026 projected salaries', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'account_id' => $accounts['5500'], 'budget_year' => 2026, 'budget_month' => 9, 'budgeted_amount' => 250000.00, 'actual_amount' => 0.00, 'variance' => -250000.00, 'notes' => 'September 2026 insurance quarterly payment', 'created_by' => 2, 'created_at' => $now, 'updated_at' => $now],
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
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 1, 'period_year' => 2026, 'taxable_amount' => 3200000.00, 'tax_amount' => 576000.00, 'status' => 'paid', 'filed_date' => '2026-02-15', 'payment_date' => '2026-02-18', 'receipt_number' => 'TRA-VAT-2026-01-4510', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 2, 'period_year' => 2026, 'taxable_amount' => 2950000.00, 'tax_amount' => 531000.00, 'status' => 'paid', 'filed_date' => '2026-03-15', 'payment_date' => '2026-03-18', 'receipt_number' => 'TRA-VAT-2026-02-4511', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 3, 'period_year' => 2026, 'taxable_amount' => 3500000.00, 'tax_amount' => 630000.00, 'status' => 'paid', 'filed_date' => '2026-04-15', 'payment_date' => '2026-04-17', 'receipt_number' => 'TRA-VAT-2026-03-4512', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 4, 'period_year' => 2026, 'taxable_amount' => 3800000.00, 'tax_amount' => 684000.00, 'status' => 'paid', 'filed_date' => '2026-05-15', 'payment_date' => '2026-05-18', 'receipt_number' => 'TRA-VAT-2026-04-4513', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 5, 'period_year' => 2026, 'taxable_amount' => 4000000.00, 'tax_amount' => 720000.00, 'status' => 'paid', 'filed_date' => '2026-06-15', 'payment_date' => '2026-06-17', 'receipt_number' => 'TRA-VAT-2026-05-4514', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 1, 'period_year' => 2026, 'taxable_amount' => 3200000.00, 'tax_amount' => 480000.00, 'status' => 'paid', 'filed_date' => '2026-02-05', 'payment_date' => '2026-02-08', 'receipt_number' => 'TRA-PAYE-2026-01-7890', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 2, 'period_year' => 2026, 'taxable_amount' => 3200000.00, 'tax_amount' => 480000.00, 'status' => 'paid', 'filed_date' => '2026-03-05', 'payment_date' => '2026-03-08', 'receipt_number' => 'TRA-PAYE-2026-02-7891', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 3, 'period_year' => 2026, 'taxable_amount' => 3400000.00, 'tax_amount' => 510000.00, 'status' => 'paid', 'filed_date' => '2026-04-05', 'payment_date' => '2026-04-08', 'receipt_number' => 'TRA-PAYE-2026-03-7892', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 4, 'period_year' => 2026, 'taxable_amount' => 3500000.00, 'tax_amount' => 525000.00, 'status' => 'paid', 'filed_date' => '2026-05-05', 'payment_date' => '2026-05-08', 'receipt_number' => 'TRA-PAYE-2026-04-7893', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 5, 'period_year' => 2026, 'taxable_amount' => 3600000.00, 'tax_amount' => 540000.00, 'status' => 'paid', 'filed_date' => '2026-06-05', 'payment_date' => '2026-06-08', 'receipt_number' => 'TRA-PAYE-2026-05-7894', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 6, 'period_year' => 2026, 'taxable_amount' => 3600000.00, 'tax_amount' => 540000.00, 'status' => 'paid', 'filed_date' => '2026-07-05', 'payment_date' => '2026-07-08', 'receipt_number' => 'TRA-PAYE-2026-06-7895', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 1, 'period_year' => 2026, 'taxable_amount' => 3200000.00, 'tax_amount' => 96000.00, 'status' => 'paid', 'filed_date' => '2026-02-10', 'payment_date' => '2026-02-12', 'receipt_number' => 'TRA-SDL-2026-01-3210', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 2, 'period_year' => 2026, 'taxable_amount' => 3200000.00, 'tax_amount' => 96000.00, 'status' => 'paid', 'filed_date' => '2026-03-10', 'payment_date' => '2026-03-12', 'receipt_number' => 'TRA-SDL-2026-02-3211', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 3, 'period_year' => 2026, 'taxable_amount' => 3400000.00, 'tax_amount' => 102000.00, 'status' => 'paid', 'filed_date' => '2026-04-10', 'payment_date' => '2026-04-12', 'receipt_number' => 'TRA-SDL-2026-03-3212', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 4, 'period_year' => 2026, 'taxable_amount' => 3500000.00, 'tax_amount' => 105000.00, 'status' => 'paid', 'filed_date' => '2026-05-10', 'payment_date' => '2026-05-12', 'receipt_number' => 'TRA-SDL-2026-04-3213', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 5, 'period_year' => 2026, 'taxable_amount' => 3600000.00, 'tax_amount' => 108000.00, 'status' => 'paid', 'filed_date' => '2026-06-10', 'payment_date' => '2026-06-12', 'receipt_number' => 'TRA-SDL-2026-05-3214', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 6, 'period_year' => 2026, 'taxable_amount' => 3600000.00, 'tax_amount' => 108000.00, 'status' => 'paid', 'filed_date' => '2026-07-10', 'payment_date' => '2026-07-12', 'receipt_number' => 'TRA-SDL-2026-06-3215', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'SDL', 'period_month' => 7, 'period_year' => 2026, 'taxable_amount' => 3650000.00, 'tax_amount' => 109500.00, 'status' => 'draft', 'filed_date' => null, 'payment_date' => null, 'receipt_number' => null, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 1, 'period_year' => 2026, 'taxable_amount' => 1500000.00, 'tax_amount' => 75000.00, 'status' => 'paid', 'filed_date' => '2026-02-10', 'payment_date' => '2026-02-12', 'receipt_number' => 'TRA-WHT-2026-01-5501', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 2, 'period_year' => 2026, 'taxable_amount' => 1200000.00, 'tax_amount' => 60000.00, 'status' => 'paid', 'filed_date' => '2026-03-10', 'payment_date' => '2026-03-12', 'receipt_number' => 'TRA-WHT-2026-02-5502', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 3, 'period_year' => 2026, 'taxable_amount' => 1800000.00, 'tax_amount' => 90000.00, 'status' => 'paid', 'filed_date' => '2026-04-10', 'payment_date' => '2026-04-12', 'receipt_number' => 'TRA-WHT-2026-03-5503', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 4, 'period_year' => 2026, 'taxable_amount' => 1600000.00, 'tax_amount' => 80000.00, 'status' => 'paid', 'filed_date' => '2026-05-10', 'payment_date' => '2026-05-12', 'receipt_number' => 'TRA-WHT-2026-04-5504', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 5, 'period_year' => 2026, 'taxable_amount' => 1400000.00, 'tax_amount' => 70000.00, 'status' => 'paid', 'filed_date' => '2026-06-10', 'payment_date' => '2026-06-12', 'receipt_number' => 'TRA-WHT-2026-05-5505', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 6, 'period_year' => 2026, 'taxable_amount' => 1700000.00, 'tax_amount' => 85000.00, 'status' => 'paid', 'filed_date' => '2026-07-10', 'payment_date' => '2026-07-12', 'receipt_number' => 'TRA-WHT-2026-06-5506', 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'WHT', 'period_month' => 7, 'period_year' => 2026, 'taxable_amount' => 1900000.00, 'tax_amount' => 95000.00, 'status' => 'draft', 'filed_date' => null, 'payment_date' => null, 'receipt_number' => null, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'VAT', 'period_month' => 8, 'period_year' => 2026, 'taxable_amount' => 4500000.00, 'tax_amount' => 810000.00, 'status' => 'draft', 'filed_date' => null, 'payment_date' => null, 'receipt_number' => null, 'created_at' => $now, 'updated_at' => $now],
            ['pharmacy_id' => 1, 'tax_type' => 'PAYE', 'period_month' => 8, 'period_year' => 2026, 'taxable_amount' => 3700000.00, 'tax_amount' => 555000.00, 'status' => 'draft', 'filed_date' => null, 'payment_date' => null, 'receipt_number' => null, 'created_at' => $now, 'updated_at' => $now],
        ];

        DB::table('tax_records')->insert($records);
    }
}
