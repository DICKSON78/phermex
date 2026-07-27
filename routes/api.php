<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminContentController;
use App\Http\Controllers\Api\AdminDrugDatabaseController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminRevenueController;
use App\Http\Controllers\Api\AdminSettingController;
use App\Http\Controllers\Api\AdminSubscriptionController;
use App\Http\Controllers\Api\AdminSupportController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CustomerAppController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DrugController;
use App\Http\Controllers\Api\DrugMovementController;
use App\Http\Middleware\AutoScopePharmacy;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\PharmacyController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\GoodsReceivedController;
use App\Http\Controllers\Api\StockTransferController;
use App\Http\Controllers\Api\StockReturnController;
use App\Http\Controllers\Api\DamagedGoodsController;
use App\Http\Controllers\Api\ControlledSubstanceController;
use App\Http\Controllers\Api\LicenseController;
use App\Http\Controllers\Api\RegulatoryReportController;
use App\Http\Controllers\Api\DrugRecallController;
use App\Http\Controllers\Api\DemoRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Middleware\PharmacyScopeMiddleware;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/demo-requests', [DemoRequestController::class, 'store']);

Route::prefix('customer-app')->group(function () {
    Route::post('/register', [CustomerAppController::class, 'register']);
    Route::post('/login', [CustomerAppController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload', [UploadController::class, 'store']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/password', [AuthController::class, 'changePassword']);

    Route::prefix('customer-app')->group(function () {
        Route::get('/me', [CustomerAppController::class, 'me']);
        Route::put('/me', [CustomerAppController::class, 'updateProfile']);
        Route::get('/nearby', [CustomerAppController::class, 'nearbyPharmacies']);
        Route::get('/pharmacies/{id}', [CustomerAppController::class, 'pharmacyDetail']);
        Route::get('/pharmacies/{id}/drugs', [CustomerAppController::class, 'pharmacyDrugs']);
        Route::get('/pharmacies/{id}/categories', [CustomerAppController::class, 'pharmacyCategories']);
        Route::post('/orders', [CustomerAppController::class, 'placeOrder']);
        Route::get('/orders', [CustomerAppController::class, 'myOrders']);
        Route::get('/orders/{id}', [CustomerAppController::class, 'orderDetail']);
        Route::post('/prescriptions', [CustomerAppController::class, 'uploadPrescription']);
        Route::get('/prescriptions', [CustomerAppController::class, 'myPrescriptions']);

        Route::get('/notifications/unread-count', [CustomerAppController::class, 'unreadNotificationCount']);
        Route::get('/notifications', [CustomerAppController::class, 'myNotifications']);
        Route::put('/notifications/read-all', [CustomerAppController::class, 'markAllNotificationsRead']);
        Route::put('/notifications/{id}/read', [CustomerAppController::class, 'markNotificationRead']);

        Route::get('/chats', [ChatController::class, 'customerConversations']);
        Route::get('/chats/{pharmacyId}', [ChatController::class, 'customerMessages']);
        Route::post('/chats/{pharmacyId}', [ChatController::class, 'customerSend']);
        Route::put('/chats/{pharmacyId}/read', [ChatController::class, 'customerMarkRead']);
    });

    Route::middleware([PharmacyScopeMiddleware::class, AutoScopePharmacy::class])->group(function () {
        Route::get('/pharmacies', [PharmacyController::class, 'index'])
            ->middleware(RoleMiddleware::class . ':admin');
        Route::post('/pharmacies/{id}/switch', [PharmacyController::class, 'switchPharmacy']);
        Route::get('/pharmacies/current', [PharmacyController::class, 'current']);
        Route::get('/pharmacies/{pharmacy}', [PharmacyController::class, 'show']);
        Route::put('/pharmacies/{pharmacy}', [PharmacyController::class, 'update']);
        Route::get('/pharmacies/{pharmacy}/stats', [PharmacyController::class, 'stats']);

        Route::get('/drugs/search', [DrugController::class, 'search']);
        Route::get('/drug-categories', [DrugController::class, 'categories']);
        Route::get('/drugs', [DrugController::class, 'index']);
        Route::post('/drugs', [DrugController::class, 'store']);
        Route::get('/drugs/{pharmacyId}/low-stock', [DrugController::class, 'lowStock']);
        Route::get('/drugs/{pharmacyId}/expiring-soon', [DrugController::class, 'expiringSoon']);
        Route::get('/drugs/{id}', [DrugController::class, 'show']);
        Route::put('/drugs/{id}', [DrugController::class, 'update']);
        Route::delete('/drugs/{id}', [DrugController::class, 'destroy']);

        Route::get('/drug-movements', [DrugMovementController::class, 'index']);
        Route::post('/drug-movements', [DrugMovementController::class, 'store']);
        Route::get('/drug-movements/{id}', [DrugMovementController::class, 'show']);
        Route::get('/drug-movements/monthly-summary', [DrugMovementController::class, 'monthlySummary']);

        Route::get('/orders/daily-report/{pharmacyId}', [OrderController::class, 'dailyReport']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);

        Route::get('/prescriptions/search-by-doctor', [PrescriptionController::class, 'searchByDoctor']);
        Route::get('/prescriptions', [PrescriptionController::class, 'index']);
        Route::post('/prescriptions', [PrescriptionController::class, 'store']);
        Route::post('/prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense']);
        Route::post('/prescriptions/{id}/cancel', [PrescriptionController::class, 'cancel']);
        Route::get('/prescriptions/{id}', [PrescriptionController::class, 'show']);

        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::get('/customers/{id}/purchase-history', [CustomerController::class, 'purchaseHistory']);
        Route::get('/customers/{id}/prescriptions', [CustomerController::class, 'prescriptions']);
        Route::get('/customers/{id}', [CustomerController::class, 'show']);
        Route::put('/customers/{id}', [CustomerController::class, 'update']);

        Route::get('/employees/stats', [EmployeeController::class, 'getStats']);
        Route::patch('/employees/{id}/toggle-status', [EmployeeController::class, 'toggleStatus']);
        Route::get('/employees', [EmployeeController::class, 'index']);
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::get('/employees/{id}', [EmployeeController::class, 'show']);
        Route::put('/employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

        Route::get('/attendance/report', [AttendanceController::class, 'getReport']);
        Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::post('/attendance', [AttendanceController::class, 'store']);
        Route::put('/attendance/{id}', [AttendanceController::class, 'update']);
        Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);

        Route::get('/leaves/balance', [LeaveController::class, 'getBalance']);
        Route::get('/leaves/calendar', [LeaveController::class, 'getCalendar']);
        Route::post('/leaves/{id}/approve', [LeaveController::class, 'approve']);
        Route::post('/leaves/{id}/reject', [LeaveController::class, 'reject']);
        Route::post('/leaves/{id}/cancel', [LeaveController::class, 'cancel']);
        Route::get('/leaves', [LeaveController::class, 'index']);
        Route::post('/leaves', [LeaveController::class, 'store']);
        Route::get('/leaves/{id}', [LeaveController::class, 'show']);

        Route::get('/payroll/summary', [PayrollController::class, 'getSummary']);
        Route::post('/payroll', [PayrollController::class, 'store']);
        Route::get('/payroll/{id}', [PayrollController::class, 'show']);
        Route::get('/payroll/{id}/payslip', [PayrollController::class, 'getPayslip']);
        Route::post('/payroll/{id}/approve', [PayrollController::class, 'approve']);
        Route::post('/payroll/{id}/pay', [PayrollController::class, 'pay']);
        Route::post('/payroll/{id}/cancel', [PayrollController::class, 'cancel']);
        Route::get('/payroll', [PayrollController::class, 'index']);

        Route::get('/performance/summary', [PerformanceController::class, 'getSummary']);
        Route::post('/performance/{id}/submit', [PerformanceController::class, 'submit']);
        Route::post('/performance/{id}/acknowledge', [PerformanceController::class, 'acknowledge']);
        Route::get('/performance', [PerformanceController::class, 'index']);
        Route::post('/performance', [PerformanceController::class, 'store']);
        Route::get('/performance/{id}', [PerformanceController::class, 'show']);
        Route::put('/performance/{id}', [PerformanceController::class, 'update']);

        Route::get('/accounts/tree', [AccountController::class, 'getTree']);
        Route::get('/accounts/balances', [AccountController::class, 'getBalances']);
        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts', [AccountController::class, 'store']);
        Route::get('/accounts/{id}', [AccountController::class, 'show']);
        Route::put('/accounts/{id}', [AccountController::class, 'update']);
        Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

        Route::get('/journal/trial-balance', [JournalController::class, 'getTrialBalance']);
        Route::get('/journal/general-ledger', [JournalController::class, 'getGeneralLedger']);
        Route::get('/journal', [JournalController::class, 'index']);
        Route::post('/journal', [JournalController::class, 'store']);
        Route::get('/journal/{id}', [JournalController::class, 'show']);
        Route::post('/journal/{id}/post', [JournalController::class, 'post']);
        Route::post('/journal/{id}/reverse', [JournalController::class, 'reverse']);

        Route::get('/bank/summary', [BankController::class, 'getSummary']);
        Route::get('/bank', [BankController::class, 'index']);
        Route::post('/bank', [BankController::class, 'store']);
        Route::get('/bank/{id}', [BankController::class, 'show']);
        Route::get('/bank/{id}/transactions', [BankController::class, 'getTransactions']);
        Route::post('/bank/{id}/reconcile', [BankController::class, 'reconcile']);
        Route::post('/bank/transfer', [BankController::class, 'transfer']);

        Route::get('/budgets/summary', [BudgetController::class, 'getSummary']);
        Route::get('/budgets/variance', [BudgetController::class, 'getVarianceReport']);
        Route::get('/budgets', [BudgetController::class, 'index']);
        Route::post('/budgets', [BudgetController::class, 'store']);
        Route::get('/budgets/{id}', [BudgetController::class, 'show']);

        Route::get('/tax/calendar', [TaxController::class, 'getCalendar']);
        Route::get('/tax/summary', [TaxController::class, 'getSummary']);
        Route::post('/tax/calculate', [TaxController::class, 'calculate']);
        Route::get('/tax', [TaxController::class, 'index']);
        Route::post('/tax', [TaxController::class, 'store']);
        Route::post('/tax/{id}/file', [TaxController::class, 'file']);
        Route::post('/tax/{id}/pay', [TaxController::class, 'markPaid']);

        Route::get('/suppliers/stats', [SupplierController::class, 'getStats']);
        Route::get('/suppliers/top', [SupplierController::class, 'getTopSuppliers']);
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

        Route::get('/purchase-orders/stats', [PurchaseOrderController::class, 'getStats']);
        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
        Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
        Route::post('/purchase-orders/{id}/approve', [PurchaseOrderController::class, 'approve']);
        Route::post('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive']);
        Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderController::class, 'cancel']);

        Route::get('/goods-received', [GoodsReceivedController::class, 'index']);
        Route::post('/goods-received', [GoodsReceivedController::class, 'store']);
        Route::get('/goods-received/{id}', [GoodsReceivedController::class, 'show']);
        Route::post('/goods-received/{id}/quality-check', [GoodsReceivedController::class, 'qualityCheck']);

        Route::get('/stock-transfers', [StockTransferController::class, 'index']);
        Route::post('/stock-transfers', [StockTransferController::class, 'store']);
        Route::get('/stock-transfers/{id}', [StockTransferController::class, 'show']);
        Route::post('/stock-transfers/{id}/approve', [StockTransferController::class, 'approve']);
        Route::post('/stock-transfers/{id}/ship', [StockTransferController::class, 'ship']);
        Route::post('/stock-transfers/{id}/receive', [StockTransferController::class, 'receive']);
        Route::post('/stock-transfers/{id}/cancel', [StockTransferController::class, 'cancel']);

        Route::get('/stock-returns', [StockReturnController::class, 'index']);
        Route::post('/stock-returns', [StockReturnController::class, 'store']);
        Route::get('/stock-returns/{id}', [StockReturnController::class, 'show']);
        Route::post('/stock-returns/{id}/approve', [StockReturnController::class, 'approve']);
        Route::post('/stock-returns/{id}/ship', [StockReturnController::class, 'ship']);
        Route::post('/stock-returns/{id}/refund', [StockReturnController::class, 'refund']);

        Route::get('/damaged-goods/report', [DamagedGoodsController::class, 'getReport']);
        Route::get('/damaged-goods', [DamagedGoodsController::class, 'index']);
        Route::post('/damaged-goods', [DamagedGoodsController::class, 'store']);
        Route::get('/damaged-goods/{id}', [DamagedGoodsController::class, 'show']);
        Route::post('/damaged-goods/{id}/process', [DamagedGoodsController::class, 'process']);

        Route::get('/controlled-substances/register', [ControlledSubstanceController::class, 'getRegister']);
        Route::get('/controlled-substances/audit-trail', [ControlledSubstanceController::class, 'getAuditTrail']);
        Route::get('/controlled-substances/balance-report', [ControlledSubstanceController::class, 'getBalanceReport']);
        Route::get('/controlled-substances', [ControlledSubstanceController::class, 'index']);
        Route::post('/controlled-substances', [ControlledSubstanceController::class, 'store']);
        Route::get('/controlled-substances/{id}', [ControlledSubstanceController::class, 'show']);
        Route::post('/controlled-substances/{id}/issue', [ControlledSubstanceController::class, 'issue']);

        Route::get('/licenses/expiry-alert', [LicenseController::class, 'getExpiryAlert']);
        Route::get('/licenses', [LicenseController::class, 'index']);
        Route::post('/licenses', [LicenseController::class, 'store']);
        Route::put('/licenses/{id}', [LicenseController::class, 'update']);
        Route::post('/licenses/{id}/renew', [LicenseController::class, 'renew']);

        Route::get('/regulatory-reports/templates', [RegulatoryReportController::class, 'getTemplates']);
        Route::get('/regulatory-reports', [RegulatoryReportController::class, 'index']);
        Route::post('/regulatory-reports', [RegulatoryReportController::class, 'store']);
        Route::get('/regulatory-reports/{id}', [RegulatoryReportController::class, 'show']);
        Route::post('/regulatory-reports/{id}/submit', [RegulatoryReportController::class, 'submit']);

        Route::get('/drug-recalls/active', [DrugRecallController::class, 'getActive']);
        Route::get('/drug-recalls', [DrugRecallController::class, 'index']);
        Route::post('/drug-recalls', [DrugRecallController::class, 'store']);
        Route::get('/drug-recalls/{id}', [DrugRecallController::class, 'show']);
        Route::post('/drug-recalls/{id}/acknowledge', [DrugRecallController::class, 'acknowledge']);
        Route::post('/drug-recalls/{id}/process', [DrugRecallController::class, 'process']);

        Route::get('/expenses/monthly-summary', [ExpenseController::class, 'monthlySummary']);
        Route::get('/expenses', [ExpenseController::class, 'index']);
        Route::post('/expenses', [ExpenseController::class, 'store']);
        Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
        Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
        Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

        Route::get('/deliveries', [DeliveryController::class, 'index']);
        Route::post('/deliveries', [DeliveryController::class, 'store']);
        Route::get('/deliveries/{id}', [DeliveryController::class, 'show']);
        Route::patch('/deliveries/{id}', [DeliveryController::class, 'update']);
        Route::put('/deliveries/{id}/status', [DeliveryController::class, 'updateStatus']);
        Route::post('/deliveries/{id}/assign-driver', [DeliveryController::class, 'assignDriver']);

        Route::get('/reports/sales', [ReportController::class, 'salesReport']);
        Route::get('/reports/inventory', [ReportController::class, 'inventoryReport']);
        Route::get('/reports/financial', [ReportController::class, 'financialReport']);
        Route::get('/reports/customers', [ReportController::class, 'customerReport']);

        Route::get('/chats', [ChatController::class, 'pharmacyConversations']);
        Route::get('/chats/{customerId}', [ChatController::class, 'pharmacyMessages']);
        Route::post('/chats/{customerId}', [ChatController::class, 'pharmacySend']);
        Route::put('/chats/{customerId}/read', [ChatController::class, 'pharmacyMarkRead']);
    });

    Route::get('/dashboard/owner', [DashboardController::class, 'ownerDashboard'])
        ->middleware(RoleMiddleware::class . ':owner');
    Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard'])
        ->middleware(RoleMiddleware::class . ':admin');
    Route::get('/dashboard/pharmacist', [DashboardController::class, 'pharmacistDashboard'])
        ->middleware(RoleMiddleware::class . ':pharmacist');

    Route::middleware(RoleMiddleware::class . ':admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/pharmacies', [AdminController::class, 'listPharmacies']);
        Route::get('/pharmacies/{id}', [AdminController::class, 'pharmacyDetail']);
        Route::put('/pharmacies/{id}', [PharmacyController::class, 'update']);
        Route::patch('/pharmacies/{id}/status', [AdminController::class, 'updatePharmacyStatus']);
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::patch('/users/{id}/toggle-active', [AdminController::class, 'toggleUserActive']);
        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
        Route::patch('/pharmacies/{id}/approve', [AdminController::class, 'approvePharmacy']);
        Route::patch('/pharmacies/{id}/reject', [AdminController::class, 'rejectPharmacy']);
        Route::patch('/pharmacies/{id}/confirm-payment', [AdminController::class, 'confirmPayment']);
        Route::get('/pending-pharmacies', [AdminController::class, 'listPendingPharmacies']);

        // Admin User Management
        Route::get('/users/all', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::get('/users/{id}/stats', [AdminUserController::class, 'show']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        Route::patch('/users/{id}/toggle-status', [AdminUserController::class, 'toggleActive']);

        // Admin Settings
        Route::get('/settings', [AdminSettingController::class, 'index']);
        Route::put('/settings/platform', [AdminSettingController::class, 'updatePlatform']);
        Route::put('/settings/notifications', [AdminSettingController::class, 'updateNotifications']);
        Route::put('/settings/retention', [AdminSettingController::class, 'updateRetention']);

        // Admin Content Management
        Route::get('/content', [AdminContentController::class, 'index']);
        Route::post('/content', [AdminContentController::class, 'store']);
        Route::get('/content/{id}', [AdminContentController::class, 'show']);
        Route::put('/content/{id}', [AdminContentController::class, 'update']);
        Route::delete('/content/{id}', [AdminContentController::class, 'destroy']);
        Route::patch('/content/{id}/toggle-status', [AdminContentController::class, 'toggleStatus']);
        Route::post('/content/{id}/duplicate', [AdminContentController::class, 'duplicate']);

        // Admin Support Tickets
        Route::get('/support/tickets', [AdminSupportController::class, 'index']);
        Route::post('/support/tickets', [AdminSupportController::class, 'store']);
        Route::get('/support/tickets/{id}', [AdminSupportController::class, 'show']);
        Route::delete('/support/tickets/{id}', [AdminSupportController::class, 'destroy']);
        Route::post('/support/tickets/{id}/resolve', [AdminSupportController::class, 'resolve']);
        Route::post('/support/tickets/{id}/close', [AdminSupportController::class, 'close']);
        Route::post('/support/tickets/{id}/reply', [AdminSupportController::class, 'reply']);

        // Admin Revenue
        Route::get('/revenue', [AdminRevenueController::class, 'index']);
        Route::post('/revenue', [AdminRevenueController::class, 'store']);
        Route::get('/revenue/{id}', [AdminRevenueController::class, 'show']);
        Route::delete('/revenue/{id}', [AdminRevenueController::class, 'destroy']);
        Route::patch('/revenue/{id}', [AdminRevenueController::class, 'update']);
        Route::post('/revenue/{id}/reminder', [AdminRevenueController::class, 'reminder']);

        // Admin Drug Database
        Route::get('/drug-database', [AdminDrugDatabaseController::class, 'index']);
        Route::post('/drug-database', [AdminDrugDatabaseController::class, 'store']);
        Route::get('/drug-database/{id}', [AdminDrugDatabaseController::class, 'show']);
        Route::put('/drug-database/{id}', [AdminDrugDatabaseController::class, 'update']);
        Route::delete('/drug-database/{id}', [AdminDrugDatabaseController::class, 'destroy']);
        Route::patch('/drug-database/{id}/toggle-status', [AdminDrugDatabaseController::class, 'toggleStatus']);

        // Admin Reports
        Route::get('/reports', [AdminReportController::class, 'index']);

        // Admin Subscriptions
        Route::get('/subscriptions', [AdminSubscriptionController::class, 'index']);
    });

    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/{id}', [NotificationController::class, 'show']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });

    Route::prefix('subscriptions')->group(function () {
        Route::get('/plans', [SubscriptionController::class, 'plans']);
        Route::get('/status', [SubscriptionController::class, 'status']);
        Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
    });
});
