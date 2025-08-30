import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { InterestComponent } from './components/interest/interest.component';
import { BalancesComponent } from './components/balances/balances.component';
import { AddInvestorComponent } from './components/add-investor/add-investor.component';
import { WithdrawComponent } from './components/withdraw/withdraw.component';
import { AddmoneyComponent } from './components/addmoney/addmoney.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminLoginComponent } from './components/admin-login/admin-login.component';

export const appRoutes: Routes = [
  // Login route - only public route
  { path: 'login', component: AdminLoginComponent },
  
  // Default redirect to dashboard
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // Protected routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'interest-rates', component: InterestComponent, canActivate: [AuthGuard] },
  { path: 'report', component: BalancesComponent, canActivate: [AuthGuard] },
  { path: 'add-investor', component: AddInvestorComponent, canActivate: [AuthGuard] },
  { path: 'withdraw', component: WithdrawComponent, canActivate: [AuthGuard] },
  { path: 'add-money', component: AddmoneyComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  
  // Fallback route
  { path: '**', redirectTo: '/login' }
];