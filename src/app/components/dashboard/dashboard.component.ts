import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InvestmentService } from '../../services/investment.service';
import { User, Investor, PortfolioStats, InvestmentSummary, Transaction } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  investors: Investor[] = [];
  portfolioStats: PortfolioStats = {
    totalInvestors: 0,
    totalFunds: 0,
    monthlyGrowth: 0,
    avgMonthlyReturn: 0
  };
  recentTransactions: any[] = [];
  isLoading = true;

  // Form states
  showAddMoneyForm = false;
  showWithdrawForm = false;
  showAddInvestorForm = false;
  showReportForm = false;
  
  // Forms
  addMoneyForm!: FormGroup;
  withdrawForm!: FormGroup;
  addInvestorForm!: FormGroup;
  reportForm!: FormGroup;

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private investmentService: InvestmentService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForms();
    this.loadDashboardData();
  }

  private initializeForms(): void {
    // Add Money Form
    this.addMoneyForm = this.fb.group({
      investorId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });

    // Withdraw Form
    this.withdrawForm = this.fb.group({
      investorId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });

    // Add Investor Form
    this.addInvestorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Report Form
    this.reportForm = this.fb.group({
      investorId: ['', Validators.required],
      startMonthKey: [''],
      endMonthKey: ['']
    });
  }

  async loadDashboardData(): Promise<void> {
    try {
      this.isLoading = true;
      
      // Load investors
      this.investmentService.listInvestors().subscribe(async investors => {
        this.investors = investors;
        this.portfolioStats.totalInvestors = investors.length;
        
        // Calculate portfolio statistics
        await this.calculatePortfolioStats();
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async calculatePortfolioStats(): Promise<void> {
    let totalFunds = 0;
    let totalReturns = 0;
    
    for (const investor of this.investors) {
      try {
        const balances = await this.investmentService.computeBalances(
          investor.id!,
          investor.name
        );
        
        if (balances.length > 0) {
          const latestBalance = balances[balances.length - 1];
          totalFunds += latestBalance.balance || 0;
          
          // Calculate returns (simplified)
          const totalInvested = balances.reduce((sum, b) => sum + (b.delta > 0 ? b.delta : 0), 0);
          const totalWithdrawn = balances.reduce((sum, b) => sum + (b.delta < 0 ? Math.abs(b.delta) : 0), 0);
          totalReturns += (latestBalance.balance - totalInvested + totalWithdrawn);
        }
      } catch (error) {
        console.error(`Error calculating stats for investor ${investor.name}:`, error);
      }
    }
    
    this.portfolioStats.totalFunds = Math.round(totalFunds * 100) / 100;
    this.portfolioStats.monthlyGrowth = Math.round((totalReturns / Math.max(totalFunds - totalReturns, 1)) * 100 * 100) / 100;
    this.portfolioStats.avgMonthlyReturn = 2.5; // Default average return
  }

  onLogout(): void {
    this.authService.logout();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  // Form toggle methods
  toggleAddMoneyForm(): void {
    this.showAddMoneyForm = !this.showAddMoneyForm;
    this.hideOtherForms('addMoney');
    this.clearMessages();
  }

  toggleWithdrawForm(): void {
    this.showWithdrawForm = !this.showWithdrawForm;
    this.hideOtherForms('withdraw');
    this.clearMessages();
  }

  toggleAddInvestorForm(): void {
    this.showAddInvestorForm = !this.showAddInvestorForm;
    this.hideOtherForms('addInvestor');
    this.clearMessages();
  }

  toggleReportForm(): void {
    this.showReportForm = !this.showReportForm;
    this.hideOtherForms('report');
    this.clearMessages();
  }

  private hideOtherForms(except: string): void {
    if (except !== 'addMoney') this.showAddMoneyForm = false;
    if (except !== 'withdraw') this.showWithdrawForm = false;
    if (except !== 'addInvestor') this.showAddInvestorForm = false;
    if (except !== 'report') this.showReportForm = false;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Form submission methods
  async onAddMoney(): Promise<void> {
    if (this.addMoneyForm.invalid) {
      this.addMoneyForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.addMoneyForm.value;
      const investor = this.investors.find(i => i.id === formData.investorId);

      const transactionData: Omit<Transaction, 'id'> = {
        investorId: formData.investorId,
        investorName: investor ? investor.name : '',
        amount: formData.amount,
        date: new Date(formData.date),
        type: 'invest'
      };

      await this.investmentService.addTransaction(transactionData);
      
      this.successMessage = `Successfully added $${formData.amount} investment for ${investor?.name}!`;
      this.addMoneyForm.reset({
        investorId: '',
        amount: null,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh data
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Error adding money:', error);
      this.errorMessage = 'Failed to add investment. Please try again.';
    }
  }

  async onWithdraw(): Promise<void> {
    if (this.withdrawForm.invalid) {
      this.withdrawForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.withdrawForm.value;
      const investor = this.investors.find(i => i.id === formData.investorId);

      const transactionData: Omit<Transaction, 'id'> = {
        investorId: formData.investorId,
        investorName: investor ? investor.name : '',
        amount: formData.amount,
        date: new Date(formData.date),
        type: 'withdraw'
      };

      await this.investmentService.addTransaction(transactionData);
      
      this.successMessage = `Successfully processed $${formData.amount} withdrawal for ${investor?.name}!`;
      this.withdrawForm.reset({
        investorId: '',
        amount: null,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh data
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      this.errorMessage = 'Failed to process withdrawal. Please try again.';
    }
  }

  async onAddInvestor(): Promise<void> {
    if (this.addInvestorForm.invalid) {
      this.addInvestorForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.addInvestorForm.value;
      await this.investmentService.addInvestor(formData.name);
      
      this.successMessage = `Successfully added investor: ${formData.name}!`;
      this.addInvestorForm.reset();
      
      // Refresh data
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Error adding investor:', error);
      this.errorMessage = 'Failed to add investor. Please try again.';
    }
  }

  reportData: any[] = [];
  
  async onGenerateReport(): Promise<void> {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.reportForm.value;
      const investor = this.investors.find(i => i.id === formData.investorId);
      
      if (!investor) {
        this.errorMessage = 'Please select a valid investor.';
        return;
      }

      this.reportData = await this.investmentService.computeBalances(
        investor.id!,
        investor.name,
        formData.startMonthKey || undefined,
        formData.endMonthKey || undefined
      );
      
      this.successMessage = `Report generated successfully for ${investor.name}!`;
      
    } catch (error) {
      console.error('Error generating report:', error);
      this.errorMessage = 'Failed to generate report. Please try again.';
    }
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}
